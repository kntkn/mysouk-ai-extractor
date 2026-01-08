import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { PropertyListing, NotionPageCreationResult } from '@/types';

function getNotionClient() {
  // Debug and sanitize the Notion API token
  const rawToken = process.env.NOTION_API_TOKEN;

  if (!rawToken) {
    throw new Error('NOTION_API_TOKEN environment variable is not set');
  }

  // Aggressively clean the token - handle any possible format issues
  let cleanToken = rawToken;

  // Remove any "y\n" prefix
  if (cleanToken.startsWith('y\n')) {
    cleanToken = cleanToken.slice(2);
  }

  // Remove all types of whitespace and control characters
  cleanToken = cleanToken.replace(/[\r\n\t\s\x00-\x1f\x7f]/g, '');

  // Ensure it starts with "ntn_"
  if (!cleanToken.startsWith('ntn_')) {
    throw new Error(`Invalid token format. Token should start with 'ntn_', but got: ${cleanToken.slice(0, 10)}...`);
  }

  console.log(`Token length: ${cleanToken.length}, starts with: ${cleanToken.slice(0, 10)}`);

  return new Client({
    auth: cleanToken,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { listing, databaseId }: { 
      listing: PropertyListing; 
      databaseId?: string; 
    } = await request.json();

    if (!listing) {
      return NextResponse.json({ 
        success: false, 
        error: '物件データが不足しています' 
      }, { status: 400 });
    }

    // Use provided database ID or default from environment
    const dbId = databaseId || process.env.NOTION_DATABASE_ID;
    if (!dbId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notion Database IDが設定されていません。環境変数NOTION_DATABASE_IDまたはリクエストパラメータdatabaseIdを設定してください' 
      }, { status: 400 });
    }

    console.log('=== Starting Notion page creation ===');
    console.log('Listing received:', JSON.stringify(listing, null, 2));
    
    const notion = getNotionClient();
    console.log('Notion client created successfully');

    // Validate database schema
    console.log('Starting database validation...');
    await validateDatabaseSchema(dbId, notion);
    console.log('Database validation completed');

    // Create Notion page
    console.log('Starting page creation...');
    const result = await createNotionPage(listing, dbId, notion);
    console.log('Page creation completed');

    return NextResponse.json(result);

  } catch (error) {
    console.error('Notion API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle specific Notion errors
    if (errorMessage.includes('Could not find database')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notionデータベースが見つかりません。Database IDを確認してください' 
      }, { status: 404 });
    }
    
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notion APIトークンが無効です。アクセス権限を確認してください' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: false, 
      error: `Notion API エラー: ${errorMessage}` 
    }, { status: 500 });
  }
}

async function validateDatabaseSchema(databaseId: string, notion: Client) {
  try {
    const response = await notion.databases.retrieve({
      database_id: databaseId,
    });

    // Check if database has essential properties
    const properties = (response as any).properties;
    const requiredProperties = [
      '物件名', '所在地', '賃料', '間取り', '専有面積'
    ];
    
    // The database exists and has some properties, so let's be more flexible with validation
    console.log('Available properties:', Object.keys(properties));

    const missingProperties = requiredProperties.filter(prop => !properties[prop]);
    
    if (missingProperties.length > 0) {
      throw new Error(`データベースに必要なプロパティが不足しています: ${missingProperties.join(', ')}`);
    }

  } catch (error) {
    console.error('Database validation error:', error);
    throw error;
  }
}

async function createNotionPage(
  listing: PropertyListing, 
  databaseId: string,
  notion: Client
): Promise<NotionPageCreationResult> {
  try {
    // Build properties object for Notion page
    const properties = buildNotionProperties(listing);

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
      icon: {
        emoji: "🏠"
      }
    });

    return {
      success: true,
      pageId: response.id,
      pageUrl: (response as any).url
    };

  } catch (error) {
    console.error('Page creation error:', error);
    throw error;
  }
}

function buildNotionProperties(listing: any) {
  console.log('Building properties for listing:', JSON.stringify(listing, null, 2));
  const properties: any = {};

  // Title property (物件名)
  if (listing.物件名?.value) {
    properties['物件名'] = {
      title: [{
        text: {
          content: String(listing.物件名.value)
        }
      }]
    };
  }

  // Rich text properties
  if (listing.所在地?.value) {
    properties['所在地'] = {
      rich_text: [{
        text: {
          content: String(listing.所在地.value)
        }
      }]
    };
  }

  if (listing.最寄り駅1?.value) {
    properties['最寄り駅'] = {
      rich_text: [{
        text: {
          content: String(listing.最寄り駅1.value)
        }
      }]
    };
  }

  if (listing.最寄り駅2?.value) {
    properties['最寄り駅2'] = {
      rich_text: [{
        text: {
          content: String(listing.最寄り駅2.value)
        }
      }]
    };
  }

  if (listing.築年月?.value) {
    properties['築年月'] = {
      rich_text: [{
        text: {
          content: String(listing.築年月.value)
        }
      }]
    };
  }

  if (listing.所在階建?.value) {
    properties['所在階建'] = {
      rich_text: [{
        text: {
          content: String(listing.所在階建.value)
        }
      }]
    };
  }

  if (listing.敷金礼金備考?.value) {
    properties['敷金礼金備考'] = {
      rich_text: [{
        text: {
          content: String(listing.敷金礼金備考.value)
        }
      }]
    };
  }

  if (listing.契約期間?.value) {
    properties['契約期間'] = {
      rich_text: [{
        text: {
          content: String(listing.契約期間.value)
        }
      }]
    };
  }

  if (listing.更新料?.value) {
    properties['更新料'] = {
      rich_text: [{
        text: {
          content: String(listing.更新料.value)
        }
      }]
    };
  }

  if (listing.保証会社条件?.value) {
    properties['保証会社条件'] = {
      rich_text: [{
        text: {
          content: String(listing.保証会社条件.value)
        }
      }]
    };
  }

  if (listing.入居時期?.value) {
    properties['入居時期'] = {
      rich_text: [{
        text: {
          content: String(listing.入居時期.value)
        }
      }]
    };
  }

  if (listing.管理会社元付業者名?.value) {
    properties['管理会社'] = {
      rich_text: [{
        text: {
          content: String(listing.管理会社元付業者名.value)
        }
      }]
    };
  }

  if (listing.業者電話番号?.value) {
    properties['連絡先'] = {
      rich_text: [{
        text: {
          content: String(listing.業者電話番号.value)
        }
      }]
    };
  }

  // Number properties
  if (listing.駅1徒歩分?.value != null) {
    properties['駅1徒歩分'] = {
      number: Number(listing.駅1徒歩分.value)
    };
  }

  if (listing.専有面積?.value != null) {
    properties['専有面積'] = {
      number: Number(listing.専有面積.value)
    };
  }

  if (listing.賃料?.value != null) {
    properties['賃料'] = {
      number: Number(listing.賃料.value)
    };
  }

  if (listing.管理費共益費?.value != null) {
    properties['管理費'] = {
      number: Number(listing.管理費共益費.value)
    };
  }

  if (listing.敷金月数?.value != null) {
    properties['敷金'] = {
      rich_text: [{
        text: {
          content: String(listing.敷金月数.value) + '月'
        }
      }]
    };
  }

  if (listing.礼金月数?.value != null) {
    properties['礼金'] = {
      rich_text: [{
        text: {
          content: String(listing.礼金月数.value) + '月'
        }
      }]
    };
  }

  if (listing.鍵交換費用?.value != null) {
    properties['鍵交換費用'] = {
      number: Number(listing.鍵交換費用.value)
    };
  }

  if (listing.火災保険料?.value != null) {
    properties['火災保険料'] = {
      number: Number(listing.火災保険料.value)
    };
  }

  if (listing.その他初期費用合計?.value != null) {
    properties['その他初期費用合計'] = {
      number: Number(listing.その他初期費用合計.value)
    };
  }

  // Select properties
  if (listing.物件種別?.value) {
    properties['物件種別'] = {
      select: {
        name: String(listing.物件種別.value)
      }
    };
  }

  if (listing.間取り?.value) {
    properties['間取り'] = {
      select: {
        name: String(listing.間取り.value)
      }
    };
  }

  if (listing.構造?.value) {
    properties['構造'] = {
      select: {
        name: String(listing.構造.value)
      }
    };
  }

  if (listing.向き?.value) {
    properties['向き'] = {
      select: {
        name: String(listing.向き.value)
      }
    };
  }

  if (listing.契約形態?.value) {
    properties['契約形態'] = {
      select: {
        name: String(listing.契約形態.value)
      }
    };
  }

  if (listing.取引態様?.value) {
    properties['取引態様'] = {
      select: {
        name: String(listing.取引態様.value)
      }
    };
  }

  if (listing.AD?.value) {
    properties['AD'] = {
      select: {
        name: String(listing.AD.value)
      }
    };
  }

  if (listing.ステータス?.value) {
    properties['ステータス'] = {
      select: {
        name: String(listing.ステータス.value)
      }
    };
  }

  // Multi-select properties
  if (listing.設備タグ?.value && Array.isArray(listing.設備タグ.value)) {
    properties['設備タグ'] = {
      multi_select: listing.設備タグ.value.map((tag: string) => ({
        name: tag
      }))
    };
  }

  console.log('Built properties:', JSON.stringify(properties, null, 2));
  return properties;
}