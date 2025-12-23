import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Popup from '@/models/Popup';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/events
 * Fetch events with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get('siteId');
    const popupId = searchParams.get('popupId');
    const type = searchParams.get('type');

    const query: any = {};
    if (siteId) query.siteId = siteId;
    if (popupId) query.popupId = popupId;
    if (type) query.type = type;

    const events = await Event.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: events }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/events
 * Track an analytics event (view, conversion, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { siteId, popupId, type } = body;

    if (!siteId || !popupId || !type) {
      return NextResponse.json(
        { success: false, error: 'Site ID, popup ID, and type are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['view', 'conversion', 'visit'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event type' },
        { status: 400, headers: corsHeaders }
      );
    }

    const event = await Event.create({ siteId, popupId, type });

    // Increment pre-aggregated counters for performance
    try {
      const incField = type === 'visit' ? 'stats.visitors' : (type === 'view' ? 'stats.views' : null);
      if (incField) {
        await Popup.findByIdAndUpdate(popupId, { $inc: { [incField]: 1 } });
      }
    } catch (err) {
      console.error('Failed to increment popup stats:', err);
    }

    return NextResponse.json({ success: true, data: event }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500, headers: corsHeaders }
    );
  }
}

