import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { PropertyListing, NotionPageCreationResult } from '@/types';

// Debug and sanitize the Notion API token
const rawToken = process.env.NOTION_API_TOKEN;

if (!rawToken) {
  throw new Error('NOTION_API_TOKEN environment variable is not set');
}

// Remove ALL whitespace characters including newlines, carriage returns, and "y\n" prefix
const sanitizedToken = rawToken
  .replace(/^y\n/, '') // Remove "y\n" prefix if present
  .replace(/[\r\n\t\s]/g, ''); // Remove all whitespace characters

const notion = new Client({
  auth: sanitizedToken,
});

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

    // Validate database schema
    await validateDatabaseSchema(dbId);

    // Create Notion page
    const result = await createNotionPage(listing, dbId);

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

async function validateDatabaseSchema(databaseId: string) {
  try {
    const response = await notion.databases.retrieve({
      database_id: databaseId,
    });

    // Check if database has essential properties
    const properties = (response as any).properties;
    const requiredProperties = [
      '物件名', '所在地', '賃料', '間取り', '専有面積', 
      '管理費共益費', '敷金月数', '礼金月数'
    ];

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
  databaseId: string
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
    properties['最寄り駅1'] = {
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
    properties['管理会社元付業者名'] = {
      rich_text: [{
        text: {
          content: String(listing.管理会社元付業者名.value)
        }
      }]
    };
  }

  if (listing.業者電話番号?.value) {
    properties['業者電話番号'] = {
      phone_number: String(listing.業者電話番号.value)
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
    properties['管理費共益費'] = {
      number: Number(listing.管理費共益費.value)
    };
  }

  if (listing.敷金月数?.value != null) {
    properties['敷金月数'] = {
      number: Number(listing.敷金月数.value)
    };
  }

  if (listing.礼金月数?.value != null) {
    properties['礼金月数'] = {
      number: Number(listing.礼金月数.value)
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

  return properties;
}