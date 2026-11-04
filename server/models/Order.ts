import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderProduct {
  productId: mongoose.Types.ObjectId | string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IOrder extends Document {
  id?: string;
  orderNumber: string;
  buyerId: mongoose.Types.ObjectId | number | string;
  supplierId?: mongoose.Types.ObjectId | number | string | null;
  quotationId?: mongoose.Types.ObjectId | string | null;
  products: IOrderProduct[];
  totalAmount: string;
  currency: string;
  orderStatus:
    | "pending"
    | "placed"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentStatus: "pending" | "paid" | "credit_term" | "failed";
  // Compatibility fields
  buyerName?: string;
  gstAmount?: string;
  items?: any[];
  status?: string;
  shippingAddress?: any;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    id: {
      type: String,
      index: true,
      sparse: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    buyerId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
    quotationId: {
      type: Schema.Types.Mixed,
      default: null,
    },
    products: {
      type: [
        {
          productId: Schema.Types.Mixed,
          productName: String,
          quantity: Number,
          unitPrice: Number,
          totalPrice: Number,
        },
      ],
      default: [],
    },
    totalAmount: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "placed", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "credit_term", "failed"],
      default: "pending",
      index: true,
    },
    // Compatibility fields
    buyerName: { type: String, trim: true },
    gstAmount: { type: String, default: "0" },
    items: { type: Schema.Types.Mixed, default: [] },
    status: { type: String, default: "placed" },
    shippingAddress: { type: Schema.Types.Mixed, default: null },
    paymentMethod: { type: String, default: "GST Proforma Wire" },
  },
  {
    collection: "orders",
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret.id || ret._id?.toString();
        ret.status = ret.status || ret.orderStatus;
        ret.orderStatus = ret.orderStatus || ret.status;
        delete ret.__v;
        return ret;
      },
    },
  }
);

OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ supplierId: 1, orderStatus: 1 });

OrderSchema.pre("save", function () {
  if (!this.status) this.status = this.orderStatus;
  if (!this.orderStatus && this.status) {
    this.orderStatus = this.status as any;
  }
});

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
