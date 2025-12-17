import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Site from '@/models/Site';

/**
 * DELETE /api/sites/[id]
 * Delete a site
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const site = await Site.findByIdAndDelete(params.id);

    if (!site) {
      return NextResponse.json(
        { success: false, error: 'Site not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: site }, { status: 200 });
  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete site' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sites/[id]
 * Update a site
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, domain } = body;

    const site = await Site.findByIdAndUpdate(
      params.id,
      { name, domain },
      { new: true, runValidators: true }
    );

    if (!site) {
      return NextResponse.json(
        { success: false, error: 'Site not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: site }, { status: 200 });
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update site' },
      { status: 500 }
    );
  }
}

