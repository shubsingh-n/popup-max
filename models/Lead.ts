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
      trim: true,
      lowercase: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

