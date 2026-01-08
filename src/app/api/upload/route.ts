import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import * as pdfParse from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'ファイルが見つかりません' 
      }, { status: 400 });
    }

    const sessionId = uuidv4();
    const processedFiles = [];

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Upload original PDF to blob storage
        const blob = await put(`${sessionId}/${file.name}`, buffer, {
          access: 'public',
        });

        // Parse PDF for basic info
        const pdfData = await pdfParse(buffer);
        const pageCount = pdfData.numpages;

        // For now, skip image conversion and focus on text analysis
        // TODO: Implement PDF to image conversion in next phase
        const images = [];

        // Detect potential property listings in each page
        const candidates = await detectListingCandidates(
          pdfData.text,
          images,
          pageCount
        );

        const processedFile = {
          id: uuidv4(),
          name: file.name,
          url: blob.url,
          pages: pageCount,
          candidates,
          images: [], // Will be implemented in next phase
          textContent: pdfData.text,
        };

        processedFiles.push(processedFile);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        
        // Return partial success with error info
        processedFiles.push({
          id: uuidv4(),
          name: file.name,
          url: '',
          pages: 0,
          candidates: [],
          images: [],
          error: `ファイル処理エラー: ${fileError.message}`,
        });
      }
    }

    // Group candidates by property to detect duplicates
    const groupedListings = await groupListingsByProperty(processedFiles);

    return NextResponse.json({
      success: true,
      sessionId,
      files: processedFiles,
      groupedListings,
      message: `${files.length}個のPDFファイルを処理しました。${groupedListings.length}件の物件を検出。`
    });

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      success: false, 
      error: `アップロードエラー: ${errorMessage}` 
    }, { status: 500 });
  }
}

// Detect potential property listings in PDF content
async function detectListingCandidates(
  textContent: string, 
  images: any[],
  pageCount: number
) {
  const candidates = [];
  
  // Split text by pages (rough estimation)
  const textPerPage = textContent.length / pageCount;
  
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const startPos = Math.floor(pageIndex * textPerPage);
    const endPos = Math.floor((pageIndex + 1) * textPerPage);
    const pageText = textContent.substring(startPos, endPos);
    
    // Look for key property indicators
    const propertyPatterns = [
      /(?:物件名|建物名)[：:]\s*(.+?)(?:\n|$)/g,
      /(?:賃料|家賃)[：:]\s*([0-9,]+)\s*円/g,
      /(?:所在地|住所)[：:]\s*(.+?)(?:\n|$)/g,
      /(?:間取り)[：:]\s*([0-9]+[KLDR]+)/g,
      /(?:築年数?|築)[：:]?\s*([0-9]+年|[0-9]+\.[0-9]+年)/g,
    ];

    let hasPropertyInfo = false;
    let propertyName = '';
    let rent = 0;
    let address = '';

    for (const pattern of propertyPatterns) {
      const matches = [...pageText.matchAll(pattern)];
      if (matches.length > 0) {
        hasPropertyInfo = true;
        
        if (pattern.source.includes('物件名|建物名')) {
          propertyName = matches[0][1]?.trim() || '';
        } else if (pattern.source.includes('賃料|家賃')) {
          const rentStr = matches[0][1]?.replace(/[,]/g, '') || '0';
          rent = parseInt(rentStr) || 0;
        } else if (pattern.source.includes('所在地|住所')) {
          address = matches[0][1]?.trim() || '';
        }
      }
    }

    if (hasPropertyInfo) {
      const candidate = {
        pageIndex,
        物件名: propertyName || `物件_${pageIndex + 1}`,
        所在地: address,
        賃料: rent,
        listingKey: generateListingKey(propertyName, address, rent),
        textContent: pageText.substring(0, 500), // First 500 chars for preview
      };
      
      candidates.push(candidate);
    }
  }

  return candidates;
}

// Generate a unique key for property grouping
function generateListingKey(propertyName: string, address: string, rent: number) {
  const normalizedName = propertyName.replace(/[\s\-_]/g, '').toLowerCase();
  const normalizedAddress = address.replace(/[\s\-_]/g, '').toLowerCase();
  const rentRange = Math.floor(rent / 10000) * 10000; // Group by 10k yen ranges
  
  return `${normalizedName}_${normalizedAddress}_${rentRange}`;
}

// Group listing candidates by property (deduplication)
async function groupListingsByProperty(files: any[]) {
  const allCandidates = files.flatMap(file => 
    file.candidates.map(candidate => ({
      ...candidate,
      fileId: file.id,
      fileName: file.name
    }))
  );

  // Group by listingKey
  const groups = allCandidates.reduce((acc, candidate) => {
    const key = candidate.listingKey;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(candidate);
    return acc;
  }, {} as Record<string, any[]>);

  // Create consolidated listings
  const groupedListings = Object.values(groups).map(candidates => {
    // Use the candidate with the most text content as the primary
    const primary = candidates.reduce((best, current) => 
      (current.textContent?.length || 0) > (best.textContent?.length || 0) ? current : best
    );

    return {
      id: uuidv4(),
      primary,
      duplicates: candidates.filter(c => c !== primary),
      pageIndexes: candidates.map(c => c.pageIndex),
      fileIds: candidates.map(c => c.fileId),
      confidence: candidates.length > 1 ? 0.9 : 0.7, // Higher confidence if found in multiple pages
    };
  });

  return groupedListings;
}