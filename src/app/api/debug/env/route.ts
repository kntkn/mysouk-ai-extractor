import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = process.env.NOTION_API_TOKEN;
  
  return NextResponse.json({
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token?.slice(0, 10) + '...',
    tokenBytes: token ? Array.from(token).map(char => char.charCodeAt(0)).slice(0, 20) : [],
    tokenHex: token ? Array.from(token.slice(0, 10)).map(char => char.charCodeAt(0).toString(16)).join(' ') : '',
  });
}