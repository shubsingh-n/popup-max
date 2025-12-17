import mongoose, { Schema, Document } from 'mongoose';

/**
 * Popup Model
 * Represents a popup configuration
 */
export interface IPopup extends Document {
  siteId: string; // Reference to Site
  title: string;
  description: string;
  ctaText: string;
  styles: {
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
  };
  triggers: {
    timeDelay?: number; // seconds
    exitIntent: boolean;
  };
  isActive: boolean;
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
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    ctaText: {
      type: String,
      required: [true, 'CTA text is required'],
      default: 'Subscribe',
      trim: true,
    },
    styles: {
      backgroundColor: {
        type: String,
        default: '#ffffff',
      },
      textColor: {
        type: String,
        default: '#000000',
      },
      buttonColor: {
        type: String,
        default: '#007bff',
      },
    },
    triggers: {
      timeDelay: {
        type: Number,
        default: null, // null means disabled
      },
      exitIntent: {
        type: Boolean,
        default: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Popup || mongoose.model<IPopup>('Popup', PopupSchema);

