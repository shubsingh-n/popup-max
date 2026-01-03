import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriber extends Document {
    siteId: string;
    token: string;
    userAgent?: string;
    ip?: string;
    createdAt: Date;
}

const SubscriberSchema: Schema = new Schema(
    {
        siteId: {
            type: String,
            required: true,
            index: true,
        },
        token: {
            type: String,
            required: true,
            unique: true, // Prevent duplicate tokens
        },
        userAgent: {
            type: String,
        },
        ip: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);
