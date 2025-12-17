import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Popup from '@/models/Popup';

/**
 * GET /api/popups/site/[siteId]
 * Fetch all popups for a specific site
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    await connectDB();
    const popups = await Popup.find({ siteId: params.siteId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ success: true, data: popups }, { status: 200 });
  } catch (error) {
    console.error('Error fetching popups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch popups' },
      { status: 500 }
    );
  }
}

