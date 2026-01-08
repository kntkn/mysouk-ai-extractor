import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Debug endpoint called ===');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { listing } = body;
    console.log('Listing object:', JSON.stringify(listing, null, 2));
    console.log('Listing type:', typeof listing);
    console.log('Listing keys:', listing ? Object.keys(listing) : 'null/undefined');
    
    // Try to access properties
    try {
      console.log('物件名:', listing?.物件名);
      console.log('物件名 value:', listing?.物件名?.value);
    } catch (err) {
      console.log('Error accessing 物件名:', err);
    }

    return NextResponse.json({
      success: true,
      debug: {
        listingType: typeof listing,
        listingKeys: listing ? Object.keys(listing) : null,
        hasPropertyName: listing && '物件名' in listing,
        propertyValue: listing?.物件名?.value
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json({ 
      success: false, 
      error: `Debug error: ${errorMessage}` 
    }, { status: 500 });
  }
}