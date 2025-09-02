import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('📩 Webhook received from Phantom Buster:', data);

    // Process the webhook data here
    // You can save to database, update UI, etc.

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received successfully' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}