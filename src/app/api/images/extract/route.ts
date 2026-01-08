import { NextRequest, NextResponse } from 'next/server';
import { pdf2pic } from 'pdf2pic';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import Anthropic from '@anthropic-ai/sdk';
import { ExtractedImage } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId, fileUrl, fileName }: {
      sessionId: string;
      fileUrl: string;
      fileName: string;
    } = await request.json();

    if (!sessionId || !fileUrl || !fileName) {
      return NextResponse.json({ 
        success: false, 
        error: '必要なパラメータが不足しています' 
      }, { status: 400 });
    }

    console.log(`Starting image extraction for ${fileName}...`);

    // Download PDF from blob storage
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      throw new Error(`PDF download failed: ${pdfResponse.statusText}`);
    }
    
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // Extract images from PDF using pdf2pic
    const images = await extractImagesFromPDF(pdfBuffer, sessionId, fileName);

    // Classify images using Claude Vision
    const classifiedImages = await classifyImages(images);

    return NextResponse.json({
      success: true,
      sessionId,
      fileName,
      images: classifiedImages,
      message: `${classifiedImages.length}枚の画像を抽出・分類しました`
    });

  } catch (error) {
    console.error('Image extraction error:', error);
    return NextResponse.json({ 
      success: false, 
      error: `画像抽出エラー: ${error.message}` 
    }, { status: 500 });
  }
}

async function extractImagesFromPDF(
  pdfBuffer: Buffer,
  sessionId: string,
  fileName: string
): Promise<Partial<ExtractedImage>[]> {
  
  const images: Partial<ExtractedImage>[] = [];
  
  try {
    // Initialize pdf2pic with options
    const convert = pdf2pic.fromBuffer(pdfBuffer, {
      density: 150, // DPI
      saveFilename: "page",
      savePath: "./tmp/", // Temp path (won't actually save to disk in this implementation)
      format: "png",
      width: 800,
      height: 1200
    });

    // Convert each page to image
    const results = await convert.bulk(-1); // Convert all pages
    
    for (const result of results) {
      if (result.base64) {
        try {
          // Process image with Sharp for optimization
          const imageBuffer = Buffer.from(result.base64, 'base64');
          const optimizedImage = await sharp(imageBuffer)
            .resize(800, 1200, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .png({ 
              quality: 85,
              compressionLevel: 6
            })
            .toBuffer();

          // Upload optimized image to blob storage
          const imageBlob = await put(
            `${sessionId}/images/${fileName}_page_${result.page}.png`, 
            optimizedImage, 
            {
              access: 'public',
              contentType: 'image/png'
            }
          );

          images.push({
            id: `${sessionId}_${fileName}_page_${result.page}`,
            url: imageBlob.url,
            pageIndex: result.page - 1, // Convert to 0-based index
            confidence: 1.0 // Will be updated after classification
          });

          console.log(`Extracted page ${result.page} from ${fileName}`);

        } catch (uploadError) {
          console.error(`Failed to process page ${result.page}:`, uploadError);
        }
      }
    }

  } catch (conversionError) {
    console.error('PDF to image conversion error:', conversionError);
    throw new Error(`PDF画像変換に失敗: ${conversionError.message}`);
  }

  return images;
}

async function classifyImages(images: Partial<ExtractedImage>[]): Promise<ExtractedImage[]> {
  const classifiedImages: ExtractedImage[] = [];

  for (const image of images) {
    try {
      console.log(`Classifying image: ${image.url}`);

      // Download image for analysis
      const imageResponse = await fetch(image.url);
      if (!imageResponse.ok) {
        throw new Error(`Image download failed: ${imageResponse.statusText}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const base64Image = imageBuffer.toString('base64');

      // Use Claude Vision for image classification
      const classificationResult = await classifyImageWithClaude(base64Image);

      classifiedImages.push({
        id: image.id!,
        url: image.url!,
        pageIndex: image.pageIndex!,
        type: classificationResult.type,
        confidence: classificationResult.confidence,
        bounds: classificationResult.bounds
      });

      console.log(`Classified as: ${classificationResult.type} (confidence: ${classificationResult.confidence})`);

    } catch (classificationError) {
      console.error(`Failed to classify image ${image.url}:`, classificationError);
      
      // Fallback classification
      classifiedImages.push({
        id: image.id!,
        url: image.url!,
        pageIndex: image.pageIndex!,
        type: 'other',
        confidence: 0.1
      });
    }
  }

  return classifiedImages;
}

async function classifyImageWithClaude(base64Image: string): Promise<{
  type: ExtractedImage['type'];
  confidence: number;
  bounds?: { x: number; y: number; width: number; height: number };
}> {
  
  const classificationPrompt = `
この不動産マイソク（物件資料）のページ画像を分析し、画像の種類を分類してください。

【分類カテゴリー】
- floorplan: 間取り図（平面図、レイアウト図）
- exterior: 建物外観写真
- interior: 室内写真（リビング、寝室など）
- bath: 浴室・洗面所の写真
- kitchen: キッチン・台所の写真  
- view: 眺望・景色の写真
- map: 地図・周辺環境図
- logo: 不動産会社のロゴ・ヘッダー
- other: その他（テキスト中心、表、連絡先など）

【出力形式】
以下のJSON形式で回答してください：

\`\`\`json
{
  "type": "分類カテゴリー",
  "confidence": 0.85,
  "reasoning": "分類の根拠を日本語で説明"
}
\`\`\`

【分類基準】
- confidence: 0.9以上=確実、0.7-0.9=高確率、0.5-0.7=中程度、0.5未満=不確実
- 複数の要素がある場合は、最も支配的な要素で分類
- 間取り図は線画・記号・部屋名が特徴的
- 写真は実際の空間を写したもの
- 地図は道路・建物配置・方位記号が特徴的
`;

  try {
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: classificationPrompt
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Image
              }
            }
          ]
        }
      ],
    });

    const content = response.content[0];
    
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude Vision');
    }

    // Extract JSON from Claude's response
    const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/);
    let classificationData;

    if (jsonMatch) {
      classificationData = JSON.parse(jsonMatch[1]);
    } else {
      // Try to parse the entire response as JSON
      classificationData = JSON.parse(content.text);
    }

    // Validate classification result
    const validTypes = [
      'floorplan', 'exterior', 'interior', 'bath', 'kitchen', 
      'view', 'map', 'logo', 'other'
    ];
    
    const classifiedType = validTypes.includes(classificationData.type) 
      ? classificationData.type 
      : 'other';

    const confidence = Math.max(0, Math.min(1, classificationData.confidence || 0));

    console.log(`Claude classification: ${classifiedType} (confidence: ${confidence})`);
    if (classificationData.reasoning) {
      console.log(`Reasoning: ${classificationData.reasoning}`);
    }

    return {
      type: classifiedType as ExtractedImage['type'],
      confidence,
      // bounds will be added in future updates for specific element detection
    };

  } catch (error) {
    console.error('Claude Vision classification error:', error);
    
    // Fallback classification based on simple heuristics
    return {
      type: 'other',
      confidence: 0.1
    };
  }
}