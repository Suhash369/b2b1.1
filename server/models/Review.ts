import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  buyerId: mongoose.Types.ObjectId | number | string;
  supplierId: mongoose.Types.ObjectId | number | string;
  productId?: mongoose.Types.ObjectId | string | null;
  rating: number;
  review?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "reviews",
    timestamps: false,
  }
);

ReviewSchema.index({ supplierId: 1, rating: -1 });
ReviewSchema.index({ productId: 1, createdAt: -1 });

export const Review: Model<IReview> =
  mongoose.models.Review ||
  mongoose.model<IReview>("Review", ReviewSchema);
