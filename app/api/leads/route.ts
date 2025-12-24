import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
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

    return NextResponse.json({ success: true, data: leads }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500, headers: corsHeaders }
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

    // One-time maintenance: Drop the legacy unique index if it exists
    try {
      if (Lead.collection) {
        await Lead.collection.dropIndex('popupId_1_email_1');
        console.log('[Leads-API] Dropped legacy unique index popupId_1_email_1');
      }
    } catch (e) {
      // Ignore error if index doesn't exist
    }

    const body = await request.json();
    const { siteId, popupId, email, data, leadId } = body;

    if (!siteId || !popupId) {
      return NextResponse.json(
        { success: false, error: 'Site ID and popup ID are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Email extracted from top-level or data object
    const emailToSave = email || data?.email || data?.Email || '';

    let lead;
    if (leadId) {
      // UPDATE existing lead for multi-step continuity
      lead = await Lead.findById(leadId);
      if (lead) {
        if (emailToSave) lead.email = emailToSave;
        if (data) {
          lead.data = { ...(lead.data || {}), ...data };
          lead.markModified('data');
        }
        await lead.save();
      } else {
        // Fallback: create if provided leadId is not found
        lead = await Lead.create({ siteId, popupId, email: emailToSave, data });
      }
    } else {
      // ALWAYS CREATE new lead if no leadId (new session/attempt)
      lead = await Lead.create({ siteId, popupId, email: emailToSave, data });
    }

    // Track conversion event and increment stats ONLY on first creation
    if (!leadId) {
      try {
        await Event.create({ siteId, popupId, type: 'conversion' });
        await Popup.findByIdAndUpdate(popupId, { $inc: { 'stats.submissions': 1 } });
      } catch (err) {
        console.error('Non-critical error updating stats:', err);
      }
    }

    return NextResponse.json({ success: true, data: lead }, { status: leadId ? 200 : 201, headers: corsHeaders });
  } catch (error: any) {
    console.error('Leads API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process lead', message: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

