import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRfq extends Document {
  id?: string;
  rfqNumber: string;
  buyerId?: mongoose.Types.ObjectId | number | string | null;
  productId?: mongoose.Types.ObjectId | string | null;
  requirementTitle: string;
  specifications?: any;
  quantity: number;
  unit: string;
  targetPrice?: string | null;
  currency: string;
  deliveryLocation?: string | null;
  requiredDeliveryDate?: Date | string | null;
  selectedSupplierIds: (mongoose.Types.ObjectId | number | string)[];
  status: "open" | "quoted" | "awarded" | "closed" | "cancelled" | "accepted";
  // Compatibility fields
  title?: string;
  description?: string;
  category?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string | null;
  destinationCity?: string | null;
  requiredDate?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const RfqSchema = new Schema<IRfq>(
  {
    id: {
      type: String,
      index: true,
      sparse: true,
    },
    rfqNumber: {
      type: String,
      required: true,
      unique: true,
    },
    buyerId: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
    productId: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
    requirementTitle: {
      type: String,
      required: true,
      trim: true,
    },
    specifications: {
      type: Schema.Types.Mixed,
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    unit: {
      type: String,
      default: "Units",
    },
    targetPrice: {
      type: String,
      default: null,
    },
    currency: {
      type: String,
      default: "INR",
    },
    deliveryLocation: {
      type: String,
      default: null,
    },
    requiredDeliveryDate: {
      type: Schema.Types.Mixed,
      default: null,
    },
    selectedSupplierIds: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    status: {
      type: String,
      enum: ["open", "quoted", "awarded", "closed", "cancelled", "accepted"],
      default: "open",
      index: true,
    },
    // Compatibility fields
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    category: { type: String, trim: true },
    buyerName: { type: String, trim: true },
    buyerEmail: { type: String, trim: true, index: true },
    buyerPhone: { type: String, trim: true, default: null },
    destinationCity: { type: String, trim: true, default: null },
    requiredDate: { type: String, trim: true, default: null },
  },
  {
    collection: "rfqs",
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret.id || ret._id?.toString();
        ret.title = ret.title || ret.requirementTitle;
        ret.requirementTitle = ret.requirementTitle || ret.title;
        delete ret.__v;
        return ret;
      },
    },
  }
);

RfqSchema.index({ buyerId: 1, status: 1 });
RfqSchema.index({ buyerEmail: 1, createdAt: -1 });

RfqSchema.pre("save", function () {
  if (!this.title) this.title = this.requirementTitle;
  if (!this.requirementTitle) this.requirementTitle = this.title;
  if (!this.destinationCity && this.deliveryLocation) this.destinationCity = this.deliveryLocation;
  if (!this.deliveryLocation && this.destinationCity) this.deliveryLocation = this.destinationCity;
});

export const Rfq: Model<IRfq> =
  mongoose.models.Rfq || mongoose.model<IRfq>("Rfq", RfqSchema);
