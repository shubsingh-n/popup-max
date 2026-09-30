import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import Popup from '@/models/Popup';

/**
 * GET /api/popups
 * Fetch all popups
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get('siteId');

    const query: any = { userId: (session.user as any).id };
    if (siteId) query.siteId = siteId;

    const popups = await Popup.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: popups }, { status: 200 });
  } catch (error) {
    console.error('Error fetching popups:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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
      components,
      settings,
      type,
      customCode,
    } = body;

    // Validate Site ID
    if (!siteId) {
      return NextResponse.json(
        { success: false, error: 'Site ID is required' },
        { status: 400 }
      );
    }

    // For legacy support or explicit title
    const popupTitle = title || (settings ? 'New Popup' : undefined);

    // Create popup
    const popup = await Popup.create({
      siteId,
      userId: (session.user as any).id,
      // Legacy fields (optional or defaults)
      title: popupTitle || 'Untitled Popup',
      description: description || '',
      ctaText: ctaText || 'Subscribe',
      type: type || 'popup',
      customCode: customCode || { html: '', css: '', js: '' },

      // New Structure
      components: components || [],
      settings: settings || {
        width: '500px',
        height: 'auto',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '2rem',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
      },

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

