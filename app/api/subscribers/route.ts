import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscriber from '@/models/Subscriber';

// CORS headers for public submission
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { siteId, token, userAgent } = body;

        if (!siteId || !token) {
            return NextResponse.json(
                { success: false, error: 'Site ID and Token are required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Upsert subscriber (avoid duplicates)
        await Subscriber.findOneAndUpdate(
            { token },
            {
                siteId,
                token,
                userAgent,
                ip: request.headers.get('x-forwarded-for') || 'unknown'
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true }, { status: 201, headers: corsHeaders });
    } catch (error: any) {
        console.error('Error saving subscriber:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save subscriber' },
            { status: 500, headers: corsHeaders }
        );
    }
}
