import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  id?: string;
  userId: mongoose.Types.ObjectId | number | string;
  notificationType: string;
  title: string;
  message: string;
  relatedRecordId?: string | null;
  relatedRecordType?: string | null;
  isRead: boolean;
  type?: string;
  link?: string | null;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    id: {
      type: String,
      index: true,
      sparse: true,
    },
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    notificationType: {
      type: String,
      default: "general",
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedRecordId: {
      type: String,
      default: null,
    },
    relatedRecordType: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    type: {
      type: String,
      default: "general",
    },
    link: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: "notifications",
    timestamps: false,
    id: false,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret.id || ret._id?.toString();
        ret.type = ret.type || ret.notificationType;
        ret.notificationType = ret.notificationType || ret.type;
        delete ret.__v;
        return ret;
      },
    },
  }
);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

NotificationSchema.pre("save", function () {
  if (!this.type) this.type = this.notificationType;
  if (!this.notificationType) this.notificationType = this.type;
});

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
