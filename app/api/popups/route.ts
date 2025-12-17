import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Popup from '@/models/Popup';

/**
 * GET /api/popups
 * Fetch all popups
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get('siteId');

    const query = siteId ? { siteId } : {};
    const popups = await Popup.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: popups }, { status: 200 });
  } catch (error) {
    console.error('Error fetching popups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch popups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/popups
 * Create a new popup
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      siteId,
      title,
      description,
      ctaText,
      styles,
      triggers,
      isActive,
    } = body;

    if (!siteId || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'Site ID, title, and description are required' },
        { status: 400 }
      );
    }

    const popup = await Popup.create({
      siteId,
      title,
      description,
      ctaText: ctaText || 'Subscribe',
      styles: styles || {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        buttonColor: '#007bff',
      },
      triggers: triggers || {
        timeDelay: null,
        exitIntent: false,
      },
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ success: true, data: popup }, { status: 201 });
  } catch (error) {
    console.error('Error creating popup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create popup' },
      { status: 500 }
    );
  }
}

