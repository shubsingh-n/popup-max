import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Popup from '@/models/Popup';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/embed/[siteId]
 * Fetch active popup configuration for embed script
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const { searchParams } = new URL(request.url);
  const lastVariantId = searchParams.get('lastVariantId');

  try {
    await connectDB();

    // Fetch ALL active popups for this site
    const activePopups = await Popup.find({
      siteId: params.siteId,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!activePopups || activePopups.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active popup found for this site' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Grouping Logic: Separate standalone popups from A/B test groups
    const standalonePopups = activePopups.filter(p => !p.testGroupId);
    const groupedPopups = activePopups.filter(p => p.testGroupId);

    // Group the grouped popups by their testGroupId
    const groups: Record<string, any[]> = {};
    groupedPopups.forEach(p => {
      if (!groups[p.testGroupId!]) groups[p.testGroupId!] = [];
      groups[p.testGroupId!].push(p);
    });

    const selectedPopups: any[] = [];

    // Add all standalone popups
    standalonePopups.forEach(p => selectedPopups.push(p));

    // For each group, select one variant (Round Robin)
    Object.keys(groups).forEach(groupId => {
      const variants = groups[groupId].sort((a, b) => (a.variantLabel || '').localeCompare(b.variantLabel || ''));
      let selectedVariant = variants[0];

      if (variants.length > 1) {
        let nextIndex = 0;
        if (lastVariantId) {
          // Note: This logic assumes lastVariantId is globally unique, but it might only match one group.
          // We might need to pass multiple lastVariantIds if we really want to track precisely per group,
          // but for now we'll stick to a simpler approach or just try to find it.
          const currentIndex = variants.findIndex(v => v._id.toString() === lastVariantId);
          if (currentIndex !== -1) {
            nextIndex = (currentIndex + 1) % variants.length;
          }
        }
        selectedVariant = variants[nextIndex];
      }
      selectedPopups.push(selectedVariant);
    });

    // Format the response data
    const responseData = selectedPopups.map(popup => ({
      popupId: popup._id.toString(),
      testGroupId: popup.testGroupId,
      variantLabel: popup.variantLabel,
      title: popup.title,
      description: popup.description,
      ctaText: popup.ctaText,
      styles: popup.styles,
      components: popup.components,
      settings: popup.settings,
      type: popup.type || 'popup', // Include type
    }));

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FCM_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FCM_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FCM_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FCM_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FCM_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FCM_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FCM_MEASUREMENT_ID,
      vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        firebaseConfig
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error fetching embed config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch embed config' },
      { status: 500, headers: corsHeaders }
    );
  }
}

