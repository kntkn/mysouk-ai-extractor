import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { put } from '@vercel/blob';
import { PropertyListing, ProcessedFile, ExtractedImage } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, listings, files }: {
      sessionId: string;
      listings: PropertyListing[];
      files: ProcessedFile[];
    } = await request.json();

    if (!sessionId || !listings || listings.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'セッションIDまたは物件データが不足しています' 
      }, { status: 400 });
    }

    console.log(`Generating PDF report for session ${sessionId}...`);

    // Generate HTML content for PDF
    const htmlContent = generateHTMLReport(sessionId, listings, files);

    // Generate PDF using Playwright
    const pdfBuffer = await generatePDFWithPlaywright(htmlContent);

    // Upload PDF to blob storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `マイソク分析レポート_${sessionId}_${timestamp}.pdf`;
    
    const pdfBlob = await put(
      `${sessionId}/reports/${fileName}`,
      pdfBuffer,
      {
        access: 'public',
        contentType: 'application/pdf'
      }
    );

    return NextResponse.json({
      success: true,
      sessionId,
      reportUrl: pdfBlob.url,
      fileName,
      listingCount: listings.length,
      message: `${listings.length}件の物件分析レポートを生成しました`
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      success: false, 
      error: `PDF生成エラー: ${errorMessage}` 
    }, { status: 500 });
  }
}

function generateHTMLReport(
  sessionId: string, 
  listings: PropertyListing[], 
  files: ProcessedFile[]
): string {
  
  const now = new Date();
  const reportDate = now.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate summary statistics
  const totalProperties = listings.length;
  const avgRent = listings.reduce((sum, listing) => 
    sum + (listing.賃料?.value || 0), 0) / totalProperties;
  const avgArea = listings.reduce((sum, listing) => 
    sum + (listing.専有面積?.value || 0), 0) / totalProperties;

  // Extract high confidence data
  const highConfidenceListings = listings.filter(listing => {
    const fields = Object.values(listing);
    const highConfFields = fields.filter(field => field && field.confidence > 0.7);
    return highConfFields.length >= 3; // At least 3 high confidence fields
  });

  // Image statistics
  const totalImages = files.reduce((sum, file) => sum + (file.images?.length || 0), 0);
  const imagesByType = files.reduce((acc, file) => {
    if (file.images) {
      file.images.forEach(img => {
        acc[img.type] = (acc[img.type] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>マイソク分析レポート</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 20mm;
        }
        
        body {
            font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 24px;
            color: #1e40af;
            margin: 0 0 10px 0;
            font-weight: bold;
        }
        
        .header .meta {
            font-size: 11px;
            color: #6b7280;
            margin: 5px 0;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        
        .summary-card .number {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
            display: block;
        }
        
        .summary-card .label {
            font-size: 10px;
            color: #64748b;
            margin-top: 5px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            border-left: 4px solid #3b82f6;
            padding-left: 12px;
            margin: 25px 0 15px 0;
        }
        
        .property-card {
            border: 1px solid #d1d5db;
            border-radius: 8px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .property-header {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 12px 15px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .property-name {
            font-size: 14px;
            font-weight: bold;
        }
        
        .property-rent {
            font-size: 16px;
            font-weight: bold;
        }
        
        .property-body {
            padding: 15px;
        }
        
        .property-details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .detail-item {
            border-left: 3px solid #e2e8f0;
            padding-left: 10px;
        }
        
        .detail-item.high-confidence {
            border-left-color: #10b981;
        }
        
        .detail-item.medium-confidence {
            border-left-color: #f59e0b;
        }
        
        .detail-item.low-confidence {
            border-left-color: #ef4444;
        }
        
        .detail-label {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 2px;
        }
        
        .detail-value {
            font-weight: 600;
            color: #1f2937;
        }
        
        .confidence-badge {
            display: inline-block;
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 10px;
            margin-left: 5px;
        }
        
        .confidence-high { background: #dcfce7; color: #166534; }
        .confidence-medium { background: #fef3c7; color: #92400e; }
        .confidence-low { background: #fee2e2; color: #dc2626; }
        
        .images-section {
            background: #f8fafc;
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
        }
        
        .images-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            margin-top: 8px;
        }
        
        .image-item {
            text-align: center;
        }
        
        .image-thumbnail {
            width: 100%;
            height: 40px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #d1d5db;
        }
        
        .image-label {
            font-size: 8px;
            color: #6b7280;
            margin-top: 2px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .confidence-legend {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 20px 0;
            font-size: 10px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .legend-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .dot-high { background: #10b981; }
        .dot-medium { background: #f59e0b; }
        .dot-low { background: #ef4444; }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>🏠 マイソク分析レポート</h1>
        <div class="meta">セッションID: ${sessionId}</div>
        <div class="meta">生成日時: ${reportDate}</div>
        <div class="meta">AI抽出エンジン: Claude 3.5 Sonnet + Vision</div>
    </div>

    <!-- Summary Statistics -->
    <div class="summary-grid">
        <div class="summary-card">
            <span class="number">${totalProperties}</span>
            <div class="label">抽出物件数</div>
        </div>
        <div class="summary-card">
            <span class="number">${avgRent.toLocaleString()}</span>
            <div class="label">平均賃料（円）</div>
        </div>
        <div class="summary-card">
            <span class="number">${avgArea.toFixed(1)}</span>
            <div class="label">平均専有面積（㎡）</div>
        </div>
        <div class="summary-card">
            <span class="number">${totalImages}</span>
            <div class="label">抽出画像数</div>
        </div>
    </div>

    <!-- Confidence Legend -->
    <div class="confidence-legend">
        <div class="legend-item">
            <div class="legend-dot dot-high"></div>
            <span>高信頼度 (80%以上)</span>
        </div>
        <div class="legend-item">
            <div class="legend-dot dot-medium"></div>
            <span>中信頼度 (60-80%)</span>
        </div>
        <div class="legend-item">
            <div class="legend-dot dot-low"></div>
            <span>要確認 (60%未満)</span>
        </div>
    </div>

    <!-- Property Listings -->
    <div class="section-title">📋 物件詳細情報</div>
    
    ${listings.map((listing, index) => {
      // Get associated images for this listing
      const propertyImages = files.flatMap(file => 
        (file.images || []).filter(img => img.pageIndex === index)
      );

      return `
        <div class="property-card">
            <div class="property-header">
                <span class="property-name">
                    ${listing.物件名?.value || `物件 ${index + 1}`}
                </span>
                <span class="property-rent">
                    ${listing.賃料?.value ? `¥${listing.賃料.value.toLocaleString()}` : '賃料未確定'}
                </span>
            </div>
            
            <div class="property-body">
                <div class="property-details">
                    ${formatDetailItem('所在地', listing.所在地)}
                    ${formatDetailItem('間取り', listing.間取り)}
                    ${formatDetailItem('専有面積', listing.専有面積, '㎡')}
                    ${formatDetailItem('築年月', listing.築年月)}
                    ${formatDetailItem('構造', listing.構造)}
                    ${formatDetailItem('最寄り駅', listing.最寄り駅1)}
                    ${formatDetailItem('管理費', listing.管理費共益費, '円')}
                    ${formatDetailItem('敷金', listing.敷金月数, 'ヶ月')}
                    ${formatDetailItem('礼金', listing.礼金月数, 'ヶ月')}
                </div>
                
                ${propertyImages.length > 0 ? `
                <div class="images-section">
                    <div style="font-size: 11px; font-weight: 600; margin-bottom: 5px;">
                        📸 関連画像 (${propertyImages.length}枚)
                    </div>
                    <div class="images-grid">
                        ${propertyImages.slice(0, 6).map(img => `
                            <div class="image-item">
                                <img src="${img.url}" alt="${img.type}" class="image-thumbnail" />
                                <div class="image-label">${getImageTypeLabel(img.type)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
      `;
    }).join('')}

    <!-- Footer -->
    <div class="footer">
        <div>🤖 Generated with AI-Powered Mysouk Extractor</div>
        <div>Powered by Claude 3.5 Sonnet + Vision | ${new Date().getFullYear()}</div>
    </div>
</body>
</html>
  `;

  // Helper function to format detail items
  function formatDetailItem(label: string, field: any, unit: string = ''): string {
    if (!field || field.value == null) {
      return `
        <div class="detail-item low-confidence">
            <div class="detail-label">${label}</div>
            <div class="detail-value">
                未抽出
                <span class="confidence-badge confidence-low">要確認</span>
            </div>
        </div>
      `;
    }

    const confidence = field.confidence || 0;
    const confidenceClass = confidence >= 0.8 ? 'high-confidence' : 
                           confidence >= 0.6 ? 'medium-confidence' : 'low-confidence';
    const confidenceBadgeClass = confidence >= 0.8 ? 'confidence-high' : 
                                 confidence >= 0.6 ? 'confidence-medium' : 'confidence-low';
    const confidenceText = confidence >= 0.8 ? '高信頼' : 
                          confidence >= 0.6 ? '中信頼' : '要確認';

    const displayValue = typeof field.value === 'number' && unit === '円' 
      ? field.value.toLocaleString() 
      : String(field.value);

    return `
      <div class="detail-item ${confidenceClass}">
          <div class="detail-label">${label}</div>
          <div class="detail-value">
              ${displayValue}${unit}
              <span class="confidence-badge ${confidenceBadgeClass}">
                  ${confidenceText} ${Math.round(confidence * 100)}%
              </span>
          </div>
      </div>
    `;
  }

  // Helper function to get image type labels
  function getImageTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      floorplan: '間取図',
      exterior: '外観',
      interior: '室内',
      bath: '浴室',
      kitchen: 'キッチン',
      view: '眺望',
      map: '地図',
      logo: 'ロゴ',
      other: 'その他'
    };
    return labels[type] || type;
  }
}

async function generatePDFWithPlaywright(htmlContent: string): Promise<Buffer> {
  let browser;
  
  try {
    console.log('Launching Playwright browser...');
    browser = await chromium.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set content with proper encoding
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    console.log('PDF generated successfully');
    return pdfBuffer;

  } catch (error) {
    console.error('Playwright PDF generation error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}