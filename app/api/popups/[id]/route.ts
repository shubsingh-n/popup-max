import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Popup from '@/models/Popup';

/**
 * GET /api/popups/[id]
 * Fetch a single popup
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const popup = await Popup.findById(params.id);

    if (!popup) {
      return NextResponse.json(
        { success: false, error: 'Popup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: popup }, { status: 200 });
  } catch (error) {
    console.error('Error fetching popup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch popup' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/popups/[id]
 * Update a popup
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();

    const popup = await Popup.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!popup) {
      return NextResponse.json(
        { success: false, error: 'Popup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: popup }, { status: 200 });
  } catch (error) {
    console.error('Error updating popup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update popup' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/popups/[id]
 * Delete a popup
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const popup = await Popup.findByIdAndDelete(params.id);

    if (!popup) {
      return NextResponse.json(
        { success: false, error: 'Popup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: popup }, { status: 200 });
  } catch (error) {
    console.error('Error deleting popup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete popup' },
      { status: 500 }
    );
  }
}

