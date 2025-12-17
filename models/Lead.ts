import mongoose, { Schema, Document } from 'mongoose';

/**
 * Lead Model
 * Stores email submissions from popups
 */
export interface ILead extends Document {
  siteId: string;
  popupId: string; // Reference to Popup
  email: string;
  createdAt: Date;
}

const LeadSchema: Schema = new Schema(
  {
    siteId: {
      type: String,
      required: [true, 'Site ID is required'],
      index: true,
    },
    popupId: {
      type: String,
      required: [true, 'Popup ID is required'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate emails per popup
LeadSchema.index({ popupId: 1, email: 1 }, { unique: true });

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

