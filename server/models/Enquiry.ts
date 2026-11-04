import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEnquiry extends Document {
  buyerId: mongoose.Types.ObjectId | number | string;
  supplierId: mongoose.Types.ObjectId | number | string;
  productId?: mongoose.Types.ObjectId | string | null;
  message: string;
  quantity?: number;
  status: "new" | "replied" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    buyerId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["new", "replied", "closed"],
      default: "new",
      index: true,
    },
  },
  {
    collection: "enquiries",
    timestamps: true,
  }
);

EnquirySchema.index({ supplierId: 1, status: 1 });
EnquirySchema.index({ buyerId: 1, createdAt: -1 });

export const Enquiry: Model<IEnquiry> =
  mongoose.models.Enquiry ||
  mongoose.model<IEnquiry>("Enquiry", EnquirySchema);

