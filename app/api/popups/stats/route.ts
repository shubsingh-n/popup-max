import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Popup from '@/models/Popup';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const siteId = searchParams.get('siteId');

        if (!siteId) {
            return NextResponse.json({ success: false, error: 'siteId is required' }, { status: 400 });
        }

        await connectDB();

        // Fetch all popups for the site and return their pre-aggregated stats
        const popups = await Popup.find({ siteId }, '_id stats');

        const formattedStats: any = {};
        popups.forEach(popup => {
            formattedStats[popup._id.toString()] = {
                visitors: popup.stats?.visitors || 0,
                triggered: popup.stats?.views || 0,
                submitted: popup.stats?.submissions || 0,
            };
        });

        return NextResponse.json({ success: true, data: formattedStats });
    } catch (error: any) {
        console.error('Error fetching popup stats:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
