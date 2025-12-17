import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Popup from '@/models/Popup';

/**
 * GET /api/embed/[siteId]
 * Fetch active popup configuration for embed script
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    await connectDB();
    const popup = await Popup.findOne({
      siteId: params.siteId,
      isActive: true,
    }).sort({ createdAt: -1 }); // Get the most recent active popup

    if (!popup) {
      return NextResponse.json(
        { success: false, error: 'No active popup found for this site' },
        { status: 404 }
      );
    }

    // Return only the data needed for the embed script
    return NextResponse.json(
      {
        success: true,
        data: {
          popupId: popup._id.toString(),
          title: popup.title,
          description: popup.description,
          ctaText: popup.ctaText,
          styles: popup.styles,
          triggers: popup.triggers,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching embed config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch embed config' },
      { status: 500 }
    );
  }
}

