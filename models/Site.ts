import mongoose, { Schema, Document } from 'mongoose';

/**
 * Site Model
 * Represents a website where popups can be embedded
 */
export interface ISite extends Document {
  name: string;
  domain: string;
  siteId: string; // Unique identifier for embed script
  createdAt: Date;
  updatedAt: Date;
}

const SiteSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      trim: true,
    },
    siteId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique siteId before validation
SiteSchema.pre('validate', function (next) {
  if (!this.siteId) {
    // Generate a more unique ID using timestamp + random string
    const timestamp = Date.now().toString(36);
    const randomPart1 = Math.random().toString(36).substring(2, 10);
    const randomPart2 = Math.random().toString(36).substring(2, 10);
    this.siteId = `${timestamp}${randomPart1}${randomPart2}`;
    
    // If there's a duplicate (very unlikely), MongoDB's unique constraint will catch it
    // and we'll handle it in the API route with error code 11000
  }
  next();
});

export default mongoose.models.Site || mongoose.model<ISite>('Site', SiteSchema);

