import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

function getNotionClient() {
  const rawToken = process.env.NOTION_API_TOKEN;

  if (!rawToken) {
    throw new Error('NOTION_API_TOKEN environment variable is not set');
  }

  let cleanToken = rawToken;

  if (cleanToken.startsWith('y\n')) {
    cleanToken = cleanToken.slice(2);
  }

  cleanToken = cleanToken.replace(/[\r\n\t\s\x00-\x1f\x7f]/g, '');

  if (!cleanToken.startsWith('ntn_')) {
    throw new Error(`Invalid token format. Token should start with 'ntn_', but got: ${cleanToken.slice(0, 10)}...`);
  }

  console.log(`Token length: ${cleanToken.length}, starts with: ${cleanToken.slice(0, 10)}`);

  return new Client({
    auth: cleanToken,
  });
}

export async function GET(request: NextRequest) {
  try {
    const notion = getNotionClient();
    const databaseId = "2bd1c1974dad811e9f4ff41be6814fab";

    console.log(`Attempting to retrieve database: ${databaseId}`);

    const response = await notion.databases.retrieve({
      database_id: databaseId,
    });

    console.log(`Database retrieved successfully. Title: ${(response as any).title?.map((t: any) => t.plain_text).join(' ')}`);
    console.log(`Properties:`, Object.keys((response as any).properties || {}));

    return NextResponse.json({
      success: true,
      database: {
        id: response.id,
        title: (response as any).title?.map((t: any) => t.plain_text).join(' '),
        properties: Object.keys((response as any).properties || {}),
        propertiesDetail: (response as any).properties
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json({ 
      success: false, 
      error: `Database test error: ${errorMessage}` 
    }, { status: 500 });
  }
}