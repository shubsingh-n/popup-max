import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import Popup from '@/models/Popup';

export async function PUT(
  request: NextRequest,
  { params }: { params: { testGroupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { testGroupName, distributionType, weights } = body;

    // Verify ownership
    const firstPopup = await Popup.findOne({ testGroupId: params.testGroupId });
    if (!firstPopup) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }
    
    if (firstPopup.userId.toString() !== (session.user as any).id) {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Update group-level fields for all popups in the group
    const updateQuery: any = {};
    if (testGroupName !== undefined) updateQuery.testGroupName = testGroupName;
    if (distributionType !== undefined) updateQuery.distributionType = distributionType;

    if (Object.keys(updateQuery).length > 0) {
      await Popup.updateMany(
        { testGroupId: params.testGroupId },
        { $set: updateQuery }
      );
    }

    // Update weights for specific variants
    if (weights && Array.isArray(weights)) {
      for (const item of weights) {
        if (item.id && item.weight !== undefined) {
          await Popup.updateOne(
            { _id: item.id, testGroupId: params.testGroupId },
            { $set: { variantWeight: item.weight } }
          );
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Group updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update group' },
      { status: 500 }
    );
  }
}
