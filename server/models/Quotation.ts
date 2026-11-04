import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuotation extends Document {
  id?: string;
  quoteNumber: string;
  rfqId: mongoose.Types.ObjectId | string;
  buyerId?: mongoose.Types.ObjectId | number | string | null;
  supplierId: mongoose.Types.ObjectId | number | string;
  productId?: mongoose.Types.ObjectId | string | null;
  unitPrice: string | number;
  quantity: number;
  currency: string;
  discount: number;
  deliveryCharges: number;
  leadTime?: string | null;
  validity?: string | null;
  commercialTerms?: string | null;
  status: "submitted" | "pending" | "accepted" | "rejected" | "expired";
  // Compatibility fields
  supplierName?: string;
  totalAmount?: string;
  moq?: number;
  deliveryDays?: number;
  validUntil?: string;
  paymentTerms?: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    id: {
      type: String,
      index: true,
      sparse: true,
    },
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
    },
    rfqId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    buyerId: {
      type: Schema.Types.Mixed,
      default: null,
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
    },
    unitPrice: {
      type: Schema.Types.Mixed,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    currency: {
      type: String,
      default: "INR",
    },
    discount: {
      type: Number,
      default: 0,
    },
    deliveryCharges: {
      type: Number,
      default: 0,
    },
    leadTime: {
      type: String,
      default: null,
    },
    validity: {
      type: String,
      default: null,
    },
    commercialTerms: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["submitted", "pending", "accepted", "rejected", "expired"],
      default: "submitted",
      index: true,
    },
    // Compatibility fields
    supplierName: { type: String, trim: true },
    totalAmount: { type: String, trim: true },
    moq: { type: Number, default: 1 },
    deliveryDays: { type: Number, default: 7 },
    validUntil: { type: String, trim: true },
    paymentTerms: { type: String, trim: true },
    notes: { type: String, trim: true, default: null },
  },
  {
    collection: "quotations",
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret.id || ret._id?.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

QuotationSchema.index({ rfqId: 1, supplierId: 1 });
QuotationSchema.index({ supplierId: 1, status: 1 });

export const Quotation: Model<IQuotation> =
  mongoose.models.Quotation ||
  mongoose.model<IQuotation>("Quotation", QuotationSchema);
