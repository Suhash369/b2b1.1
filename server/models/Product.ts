import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPricingTier {
  minQuantity: number;
  pricePerUnit: number;
}

export interface IProduct extends Document {
  id?: string;
  supplierId: mongoose.Types.ObjectId | number | string;
  productName: string;
  slug: string;
  categoryId?: mongoose.Types.ObjectId | string | null;
  description?: string;
  specifications?: Record<string, any> | null;
  images: string[];
  minimumOrderQuantity: number;
  unit: string;
  price: number;
  currency: string;
  pricingTiers: IPricingTier[];
  availability: boolean;
  publicationStatus: "draft" | "published" | "archived";
  // Compatibility fields
  title?: string;
  department?: string;
  supplierName?: string;
  mrp?: string;
  discount?: string | null;
  moq?: number;
  inStock?: boolean;
  rating?: number | null;
  reviews?: number;
  sku?: string;
  badge?: string | null;
  badgeColor?: string | null;
  imageAlt?: string | null;
  imageUrl?: string;
  specs?: Record<string, string> | null;
  leadTime?: string | null;
  origin?: string | null;
  hsnCode?: string | null;
  isPublished?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    id: {
      type: String,
      index: true,
      sparse: true,
    },
    supplierId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    specifications: {
      type: Schema.Types.Mixed,
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
    minimumOrderQuantity: {
      type: Number,
      default: 1,
    },
    unit: {
      type: String,
      default: "Units",
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    pricingTiers: {
      type: [
        {
          minQuantity: Number,
          pricePerUnit: Number,
        },
      ],
      default: [],
    },
    availability: {
      type: Boolean,
      default: true,
    },
    publicationStatus: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    // Compatibility fields
    title: { type: String, trim: true },
    department: { type: String, trim: true },
    supplierName: { type: String, trim: true },
    mrp: { type: String, default: "0" },
    discount: { type: String, default: null },
    moq: { type: Number, default: 1 },
    inStock: { type: Boolean, default: true },
    rating: { type: Number, default: null },
    reviews: { type: Number, default: 0 },
    sku: { type: String, trim: true },
    badge: { type: String, default: null },
    badgeColor: { type: String, default: null },
    imageAlt: { type: String, default: null },
    imageUrl: { type: String, trim: true },
    specs: { type: Schema.Types.Mixed, default: null },
    leadTime: { type: String, default: null },
    origin: { type: String, default: null },
    hsnCode: { type: String, default: null },
    isPublished: { type: Boolean, default: true, index: true },
  },
  {
    collection: "products",
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret.id || ret._id?.toString();
        ret.title = ret.title || ret.productName;
        ret.productName = ret.productName || ret.title;
        ret.moq = ret.moq || ret.minimumOrderQuantity;
        ret.imageUrl = ret.imageUrl || (ret.images && ret.images[0]) || "";
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
ProductSchema.index({ productName: "text", title: "text", description: "text" });
ProductSchema.index({ publicationStatus: 1, availability: 1 });
ProductSchema.index({ isPublished: 1, inStock: 1 });
ProductSchema.index({ supplierId: 1, publicationStatus: 1 });

ProductSchema.pre("save", function () {
  if (!this.title) this.title = this.productName;
  if (!this.productName) this.productName = this.title;
  if (!this.moq) this.moq = this.minimumOrderQuantity || 1;
  if (!this.minimumOrderQuantity) this.minimumOrderQuantity = this.moq || 1;
  if (this.isPublished !== undefined) {
    this.publicationStatus = this.isPublished ? "published" : "draft";
  } else if (this.publicationStatus) {
    this.isPublished = this.publicationStatus === "published";
  }
  if (!this.images || this.images.length === 0) {
    if (this.imageUrl) this.images = [this.imageUrl];
  } else if (!this.imageUrl && this.images.length > 0) {
    this.imageUrl = this.images[0];
  }
});

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
