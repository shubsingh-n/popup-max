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

    // Filter by schedule (startTime / endTime)
    const now = new Date();
    const scheduledPopups = activePopups.filter(popup => {
      if (popup.isFallback) return true; // Fallback always survives initial time filtering
      if (!popup.triggers?.schedule) return true;
      const { startTime, endTime } = popup.triggers.schedule;
      if (startTime && new Date(startTime) > now) return false;
      if (endTime && new Date(endTime) < now) return false;
      return true;
    });

    if (scheduledPopups.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active popup found for this site at this time' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Grouping Logic: Separate standalone popups from A/B test groups
    const standalonePopups = scheduledPopups.filter(p => !p.testGroupId);
    const groupedPopups = scheduledPopups.filter(p => p.testGroupId);

    // Group the grouped popups by their testGroupId
    const groups: Record<string, any[]> = {};
    groupedPopups.forEach(p => {
      if (!groups[p.testGroupId!]) groups[p.testGroupId!] = [];
      groups[p.testGroupId!].push(p);
    });

    const selectedPopups: any[] = [];

    // Add all standalone popups
    standalonePopups.forEach(p => selectedPopups.push(p));

    // For each group, select one variant (Round Robin or Skewed)
    Object.keys(groups).forEach(groupId => {
      const groupPopups = groups[groupId];
      const fallbackVariant = groupPopups.find(p => p.isFallback);
      const normalVariants = groupPopups.filter(p => !p.isFallback);

      // If all normal variants are exhausted/invalid, show fallback if it exists
      if (normalVariants.length === 0) {
        if (fallbackVariant) {
          selectedPopups.push(fallbackVariant);
        }
        return; // Proceed to next group
      }

      const variants = normalVariants.sort((a, b) => (a.variantLabel || '').localeCompare(b.variantLabel || ''));
      let selectedVariant = variants[0];

      const distributionType = variants[0].distributionType || 'round_robin';

      if (variants.length > 1) {
        if (distributionType === 'skewed') {
          // Weighted random selection
          const totalWeight = variants.reduce((sum, v) => sum + (v.variantWeight || 0), 0);
          if (totalWeight > 0) {
            let random = Math.random() * totalWeight;
            for (const v of variants) {
              const weight = v.variantWeight || 0;
              if (random < weight) {
                selectedVariant = v;
                break;
              }
              random -= weight;
            }
          }
        } else {
          // Round Robin
          let nextIndex = 0;
          if (lastVariantId) {
            const currentIndex = variants.findIndex(v => v._id.toString() === lastVariantId);
            if (currentIndex !== -1) {
              nextIndex = (currentIndex + 1) % variants.length;
            }
          }
          selectedVariant = variants[nextIndex];
        }
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
      customCode: popup.customCode, // Include custom code
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

