import mongoose, { Schema, Document } from 'mongoose';

/**
 * Popup Model
 * Represents a popup configuration
 */
export interface IPopup extends Document {
  siteId: string;
  // Legacy
  title?: string;
  description?: string;
  ctaText?: string;

  // New
  settings: {
    width: string;
    height: string;
    backgroundColor: string;
    borderRadius: string;
    padding: string;
    overlayColor: string;
    position?: {
      desktop: string;
      mobile: string;
    };
    animation?: {
      desktop: string;
      mobile: string;
    };
    overState?: {
      enabled: boolean;
      text: string;
      showClose: boolean;
      style: any;
      triggers: {
        positionDesktop: string;
        positionMobile: string;
        displayMode: 'always' | 'closed_not_filled' | 'after_delay';
        delay?: number;
      };
    };
  };
  components: Array<{
    id: string;
    type: string;
    label?: string;
    content: any;
    style: any;
  }>;

  styles: {
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
  };
  triggers: {
    timeDelay?: number;
    exitIntent: boolean;
    // Advanced
    visitorType?: 'all' | 'unique' | 'repeater';
    visitorCount?: number;
    clickTrigger?: string;

    pageUrl?: Array<{ matchType: string; value: string }>;
    pageTitle?: Array<{ matchType: string; value: string }>;
    jsVariable?: Array<{ name: string; matchType: string; value: string }>;
    scrollPercentage?: number | null;
    clickElement?: string | null;
    inactivityTime?: number | null;
    visitedPage?: Array<{ matchType: string; value: string }>;
  };
  isActive: boolean;
  testGroupId?: string;   // New: For A/B Testing
  variantLabel?: string; // New: e.g., 'A', 'B', 'C'
  stats?: {
    visitors: number;
    views: number;
    submissions: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PopupSchema: Schema = new Schema(
  {
    siteId: {
      type: String,
      required: [true, 'Site ID is required'],
      index: true,
    },
    // Legacy fields - kept for backward compatibility but might be unused in new editor
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    ctaText: {
      type: String,
      default: 'Subscribe',
      trim: true,
    },

    // Global Popup Settings
    settings: {
      width: { type: String, default: '500px' },
      height: { type: String, default: 'auto' },
      backgroundColor: { type: String, default: '#ffffff' },
      borderRadius: { type: String, default: '8px' },
      padding: { type: String, default: '2rem' },
      overlayColor: { type: String, default: 'rgba(0, 0, 0, 0.5)' },
      backgroundImage: { type: String, default: '' },
      position: {
        desktop: { type: String, default: 'center' }, // center, top-left, top-right, bottom-left, bottom-right
        mobile: { type: String, default: 'center' }
      },
      animation: {
        desktop: { type: String, default: 'fade' }, // fade, slide-in, zoom
        mobile: { type: String, default: 'fade' }
      },
      overState: {
        enabled: { type: Boolean, default: false },
        text: { type: String, default: 'Open Offer' },
        showClose: { type: Boolean, default: true },
        style: { type: Schema.Types.Mixed, default: {} },
        triggers: {
          positionDesktop: { type: String, default: 'bottom-left' },
          positionMobile: { type: String, default: 'bottom-left' },
          displayMode: { type: String, enum: ['always', 'closed_not_filled', 'after_delay'], default: 'always' },
          delay: { type: Number, default: 0 }
        }
      },
      closeButton: {
        show: { type: Boolean, default: true },
        position: { type: String, default: 'top-right' },
        color: { type: String, default: '#000000' }
      },
      closeOnOverlayClick: { type: Boolean, default: true }
    },

    // Dynamic Components List
    components: [{
      id: { type: String, required: true },
      type: { type: String, required: true }, // 'text', 'button', 'image', etc.
      pageIndex: { type: Number, default: 0 }, // Step/Page number
      label: { type: String, default: '' }, // For internal labeling
      content: { type: Schema.Types.Mixed, default: {} }, // text content, image src, placeholder, etc.
      style: { type: Schema.Types.Mixed, default: {} }, // Specific styles for this component
    }],

    styles: {
      backgroundColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#000000' },
      buttonColor: { type: String, default: '#007bff' },
    },
    triggers: {
      // Legacy simple triggers (kept for backward compatibility)
      timeDelay: { type: Number, default: null },
      autoCloseDelay: { type: Number, default: null }, // New
      exitIntent: { type: Boolean, default: false },

      // Advanced Triggers
      visitorType: { type: String, enum: ['all', 'unique', 'repeater'], default: 'all' },
      visitorCount: { type: Number, default: 0 }, // 0 = any, 1 = first visit, >1 = returning count
      clickTrigger: { type: String, default: null }, // CSS Selector for button click trigger

      pageUrl: [{
        matchType: { type: String, enum: ['exact', 'contains', 'startsWith', 'endsWith', 'notContains'], default: 'contains' },
        value: { type: String, required: true }
      }],
      pageTitle: [{
        matchType: { type: String, enum: ['exact', 'contains', 'notContains'], default: 'contains' },
        value: { type: String, required: true }
      }],
      jsVariable: [{
        name: { type: String, required: true },
        matchType: { type: String, enum: ['equals', 'contains', 'greaterThan', 'lessThan'], default: 'equals' },
        value: { type: String, required: true }
      }],
      scrollPercentage: { type: Number, min: 0, max: 100, default: null },
      clickElement: { type: String, default: null }, // Deprecated in favor of clickTrigger but keeping for now
      inactivityTime: { type: Number, default: null }, // Seconds
      visitedPage: [{
        matchType: { type: String, default: 'contains' },
        value: { type: String, required: true }
      }]
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    testGroupId: { type: String, default: null, index: true },
    variantLabel: { type: String, default: null },
    stats: {
      visitors: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      submissions: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Popup || mongoose.model<IPopup>('Popup', PopupSchema);

