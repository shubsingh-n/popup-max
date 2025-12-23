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
    const body = await request.json();
    const { siteId, popupId, email, data, leadId } = body;

    if (!siteId || !popupId) {
      return NextResponse.json(
        { success: false, error: 'Site ID and popup ID are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic email validation if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email !== 'anonymous@upload' && !emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    let lead;
    if (leadId) {
      // UPDATE existing lead
      lead = await Lead.findById(leadId);
      if (lead) {
        if (email) lead.email = email;
        if (data) {
          lead.data = { ...(lead.data || {}), ...data };
          lead.markModified('data');
        }
        await lead.save();
      } else {
        // Fallback to create if leadId was invalid/missing from DB
        lead = await Lead.create({ siteId, popupId, email, data });
      }
    } else {
      // CREATE new lead
      lead = await Lead.create({ siteId, popupId, email, data });
    }

    // Track conversion event (only once per lead? maybe on first step or final submit)
    // For now, track on every partial save or just if it's new?
    if (!leadId) {
      await Event.create({
        siteId,
        popupId,
        type: 'conversion',
      });

      // Increment pre-aggregated counter for submissions
      try {
        await Popup.findByIdAndUpdate(popupId, { $inc: { 'stats.submissions': 1 } });
      } catch (err) {
        console.error('Failed to increment popup submissions stat:', err);
      }
    }

    return NextResponse.json({ success: true, data: lead }, { status: leadId ? 200 : 201, headers: corsHeaders });
  } catch (error) {
    console.error('Error handling lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process lead' },
      { status: 500, headers: corsHeaders }
    );
  }
}

