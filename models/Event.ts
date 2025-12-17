import mongoose, { Schema, Document } from 'mongoose';

/**
 * Event Model
 * Tracks analytics events (views, conversions, etc.)
 */
export type EventType = 'view' | 'conversion';

export interface IEvent extends Document {
  siteId: string;
  popupId: string;
  type: EventType;
  createdAt: Date;
}

const EventSchema: Schema = new Schema(
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
    type: {
      type: String,
      enum: ['view', 'conversion'],
      required: [true, 'Event type is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
EventSchema.index({ popupId: 1, type: 1, createdAt: -1 });

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

