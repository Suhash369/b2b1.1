import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavedProduct extends Document {
  buyerId: mongoose.Types.ObjectId | number | string;
  productId: mongoose.Types.ObjectId | string;
  supplierId?: mongoose.Types.ObjectId | number | string | null;
  createdAt: Date;
}

const SavedProductSchema = new Schema<ISavedProduct>(
  {
    buyerId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "savedproducts",
    timestamps: false,
  }
);

// Prevent duplicate bookmarks by same buyer for same product
SavedProductSchema.index({ buyerId: 1, productId: 1 }, { unique: true });

export const SavedProduct: Model<ISavedProduct> =
  mongoose.models.SavedProduct ||
  mongoose.model<ISavedProduct>("SavedProduct", SavedProductSchema);
