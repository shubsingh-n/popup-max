import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const siteId = searchParams.get('siteId');

        if (!siteId) {
            return NextResponse.json({ success: false, error: 'siteId is required' }, { status: 400 });
        }

        await connectDB();

        // Aggregate events by popupId and type
        const stats = await Event.aggregate([
            { $match: { siteId } },
            {
                $group: {
                    _id: { popupId: "$popupId", type: "$type" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format stats into a more usable object: { [popupId]: { visitors, triggered, submitted } }
        const formattedStats: any = {};

        stats.forEach(stat => {
            const { popupId, type } = stat._id;
            if (!formattedStats[popupId]) {
                formattedStats[popupId] = { visitors: 0, triggered: 0, submitted: 0 };
            }

            if (type === 'visit') formattedStats[popupId].visitors = stat.count;
            if (type === 'view') formattedStats[popupId].triggered = stat.count;
            if (type === 'conversion') formattedStats[popupId].submitted = stat.count;
        });

        return NextResponse.json({ success: true, data: formattedStats });
    } catch (error: any) {
        console.error('Error fetching popup stats:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
