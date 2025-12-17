import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Event from '@/models/Event';

/**
 * GET /api/leads
 * Fetch all leads with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get('siteId');
    const popupId = searchParams.get('popupId');

    const query: any = {};
    if (siteId) query.siteId = siteId;
    if (popupId) query.popupId = popupId;

    const leads = await Lead.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: leads }, { status: 200 });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 * Create a new lead (email submission)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { siteId, popupId, email } = body;

    if (!siteId || !popupId || !email) {
      return NextResponse.json(
        { success: false, error: 'Site ID, popup ID, and email are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Try to create lead (will fail if duplicate)
    let lead;
    try {
      lead = await Lead.create({ siteId, popupId, email });
    } catch (error: any) {
      if (error.code === 11000) {
        return NextResponse.json(
          { success: false, error: 'Email already submitted for this popup' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Track conversion event
    await Event.create({
      siteId,
      popupId,
      type: 'conversion',
    });

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

