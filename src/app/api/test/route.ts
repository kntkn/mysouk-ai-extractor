import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'マイソクAI抽出システムが正常に稼働しています！',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      features: {
        upload: true,
        extract: true,
        notion: !!process.env.NOTION_API_TOKEN,
        images: false, // Temporarily disabled for testing
        pdf: false, // Temporarily disabled for testing
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      success: false, 
      error: `テストエラー: ${errorMessage}` 
    }, { status: 500 });
  }
}