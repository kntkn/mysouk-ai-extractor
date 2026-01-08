import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ExtractionResult, PropertyListing } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId, candidateText, pageIndex } = await request.json();

    if (!sessionId || !candidateText) {
      return NextResponse.json({ 
        success: false, 
        error: 'セッションIDまたは候補テキストが不足しています' 
      }, { status: 400 });
    }

    // Extract property information using Claude
    const extractedListing = await extractPropertyWithClaude(candidateText, pageIndex);

    return NextResponse.json({
      success: true,
      sessionId,
      listing: extractedListing,
      message: '物件情報の抽出が完了しました'
    });

  } catch (error) {
    console.error('Extract error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      success: false, 
      error: `抽出エラー: ${errorMessage}` 
    }, { status: 500 });
  }
}

async function extractPropertyWithClaude(
  candidateText: string, 
  pageIndex: number
): Promise<PropertyListing> {
  
  const extractionPrompt = `
あなたは賃貸物件情報の抽出の専門家です。以下のマイソクテキストから物件情報を正確に抽出し、JSON形式で返してください。

【抽出対象のテキスト】
${candidateText}

【出力形式】
以下のJSONスキーマに従って、各フィールドにvalue（抽出した値）、confidence（0-1の信頼度）、evidence（根拠テキスト）を含めてください。

\`\`\`json
{
  "物件名": {
    "value": "抽出した物件名",
    "confidence": 0.95,
    "evidence": "物件名:○○マンション"
  },
  "所在地": {
    "value": "抽出した住所",
    "confidence": 0.9,
    "evidence": "所在地:東京都..."
  },
  "賃料": {
    "value": 120000,
    "confidence": 0.85,
    "evidence": "賃料:120,000円"
  },
  // ... 他のフィールド
}
\`\`\`

【抽出ルール】
1. **数値正規化**：
   - 賃料: "120,000円" → 120000
   - 徒歩分: "徒歩5分" → 5
   - 面積: "25.5㎡" → 25.5
   - 月数: "1ヶ月" → 1

2. **信頼度判定**：
   - 明確に記載: 0.9-1.0
   - 推測可能: 0.5-0.9
   - 不確実: 0.1-0.5
   - 見つからない: 0.0

3. **evidence**: 根拠となる原文を150文字以内で記載

【必須フィールド】
物件名, 所在地, 賃料, 管理費共益費, 間取り, 専有面積, 築年月, 構造, 向き, 所在階建, 敷金月数, 礼金月数, 契約形態, 取引態様, 管理会社元付業者名

【オプションフィールド】
物件種別, 最寄り駅1, 駅1徒歩分, 最寄り駅2, 敷金礼金備考, 鍵交換費用, 火災保険料, その他初期費用合計, 契約期間, 更新料, 保証会社条件, 入居時期, 設備タグ, AD, 業者電話番号, ステータス

値が見つからない場合は、valueをnull、confidenceを0.0にしてください。
`;

  try {
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      temperature: 0.1, // Low temperature for consistent extraction
      messages: [
        {
          role: 'user',
          content: extractionPrompt
        }
      ],
    });

    const content = response.content[0];
    
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    // Extract JSON from Claude's response
    const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/);
    let extractedData;

    if (jsonMatch) {
      extractedData = JSON.parse(jsonMatch[1]);
    } else {
      // Try to parse the entire response as JSON
      extractedData = JSON.parse(content.text);
    }

    // Normalize and validate the extracted data
    const normalizedListing = await normalizeExtractedData(extractedData, pageIndex);
    
    return normalizedListing;

  } catch (error) {
    console.error('Claude extraction error:', error);
    
    // Return fallback extraction with low confidence
    return createFallbackListing(candidateText, pageIndex);
  }
}

async function normalizeExtractedData(
  rawData: any,
  pageIndex: number
): Promise<PropertyListing> {
  
  const normalized: any = {};

  // Normalize each field
  const fieldNormalizers = {
    賃料: (value: any) => {
      if (typeof value === 'string') {
        const numStr = value.replace(/[^0-9]/g, '');
        return parseInt(numStr) || null;
      }
      return typeof value === 'number' ? value : null;
    },
    
    管理費共益費: (value: any) => {
      if (typeof value === 'string') {
        const numStr = value.replace(/[^0-9]/g, '');
        return parseInt(numStr) || 0;
      }
      return typeof value === 'number' ? value : 0;
    },

    専有面積: (value: any) => {
      if (typeof value === 'string') {
        const numStr = value.replace(/[^0-9.]/g, '');
        return parseFloat(numStr) || null;
      }
      return typeof value === 'number' ? value : null;
    },

    駅1徒歩分: (value: any) => {
      if (typeof value === 'string') {
        const numStr = value.replace(/[^0-9]/g, '');
        return parseInt(numStr) || null;
      }
      return typeof value === 'number' ? value : null;
    },

    敷金月数: (value: any) => {
      if (typeof value === 'string') {
        const numStr = value.replace(/[^0-9.]/g, '');
        return parseFloat(numStr) || 0;
      }
      return typeof value === 'number' ? value : 0;
    },

    礼金月数: (value: any) => {
      if (typeof value === 'string') {
        const numStr = value.replace(/[^0-9.]/g, '');
        return parseFloat(numStr) || 0;
      }
      return typeof value === 'number' ? value : 0;
    },

    鍵交換費用: (value: any) => {
      if (typeof value === 'string') {
        const numStr = value.replace(/[^0-9]/g, '');
        return parseInt(numStr) || 0;
      }
      return typeof value === 'number' ? value : 0;
    },

    火災保険料: (value: any) => {
      if (typeof value === 'string') {
        const numStr = value.replace(/[^0-9]/g, '');
        return parseInt(numStr) || 0;
      }
      return typeof value === 'number' ? value : 0;
    },

    その他初期費用合計: (value: any) => {
      if (typeof value === 'string') {
        const numStr = value.replace(/[^0-9]/g, '');
        return parseInt(numStr) || 0;
      }
      return typeof value === 'number' ? value : 0;
    },

    // String fields - keep as is
    物件名: (value: any) => typeof value === 'string' ? value.trim() : null,
    所在地: (value: any) => typeof value === 'string' ? value.trim() : null,
    最寄り駅1: (value: any) => typeof value === 'string' ? value.trim() : null,
    最寄り駅2: (value: any) => typeof value === 'string' ? value.trim() : null,
    築年月: (value: any) => typeof value === 'string' ? value.trim() : null,
    所在階建: (value: any) => typeof value === 'string' ? value.trim() : null,
    敷金礼金備考: (value: any) => typeof value === 'string' ? value.trim() : null,
    契約期間: (value: any) => typeof value === 'string' ? value.trim() : null,
    更新料: (value: any) => typeof value === 'string' ? value.trim() : null,
    保証会社条件: (value: any) => typeof value === 'string' ? value.trim() : null,
    入居時期: (value: any) => typeof value === 'string' ? value.trim() : null,
    管理会社元付業者名: (value: any) => typeof value === 'string' ? value.trim() : null,
    業者電話番号: (value: any) => typeof value === 'string' ? value.trim() : null,

    // Arrays
    設備タグ: (value: any) => Array.isArray(value) ? value : (typeof value === 'string' ? [value] : []),
  };

  // Process each field in the raw data
  for (const [fieldKey, fieldData] of Object.entries(rawData)) {
    if (typeof fieldData === 'object' && fieldData !== null && 'value' in fieldData) {
      const normalizer = fieldNormalizers[fieldKey as keyof typeof fieldNormalizers];
      const normalizedValue = normalizer ? normalizer(fieldData.value) : fieldData.value;
      
      normalized[fieldKey] = {
        value: normalizedValue,
        confidence: Math.max(0, Math.min(1, fieldData.confidence || 0)),
        evidence: {
          pageIndex,
          snippet: typeof fieldData.evidence === 'string' 
            ? fieldData.evidence.substring(0, 150) 
            : `ページ${pageIndex + 1}から抽出`
        }
      };
    }
  }

  return normalized as PropertyListing;
}

function createFallbackListing(
  candidateText: string,
  pageIndex: number
): PropertyListing {
  
  // Basic pattern matching fallback
  const patterns = {
    物件名: /(?:物件名|建物名)[：:\s]*([^\n]+)/i,
    賃料: /(?:賃料|家賃)[：:\s]*([0-9,]+)円/i,
    所在地: /(?:所在地|住所)[：:\s]*([^\n]+)/i,
    間取り: /間取り[：:\s]*([0-9]+[RLDK]+)/i,
  };

  const fallback: any = {};

  for (const [field, pattern] of Object.entries(patterns)) {
    const match = candidateText.match(pattern);
    if (match) {
      let value = match[1].trim();
      
      // Basic normalization for numeric fields
      if (field === '賃料') {
        value = parseInt(value.replace(/[^0-9]/g, '')) || null;
      }

      fallback[field] = {
        value,
        confidence: 0.3, // Low confidence for pattern matching
        evidence: {
          pageIndex,
          snippet: match[0].substring(0, 150)
        }
      };
    } else {
      fallback[field] = {
        value: null,
        confidence: 0.0,
        evidence: {
          pageIndex,
          snippet: `ページ${pageIndex + 1}でパターンマッチ失敗`
        }
      };
    }
  }

  return fallback as PropertyListing;
}