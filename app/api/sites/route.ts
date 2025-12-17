import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Site from '@/models/Site';

/**
 * GET /api/sites
 * Fetch all sites
 */
export async function GET() {
  try {
    await connectDB();
    const sites = await Site.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: sites }, { status: 200 });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sites
 * Create a new site
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, domain } = body;

    if (!name || !domain) {
      return NextResponse.json(
        { success: false, error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    // Generate siteId if not provided (fallback, though pre-validate hook should handle this)
    const generateSiteId = () => {
      const timestamp = Date.now().toString(36);
      const randomPart1 = Math.random().toString(36).substring(2, 10);
      const randomPart2 = Math.random().toString(36).substring(2, 10);
      return `${timestamp}${randomPart1}${randomPart2}`;
    };

    const site = await Site.create({ name, domain, siteId: generateSiteId() });
    return NextResponse.json({ success: true, data: site }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating site:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Site ID already exists. Please try again.' },
        { status: 400 }
      );
    }
    
    // Return more detailed error message for debugging
    const errorMessage = error.message || 'Failed to create site';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

