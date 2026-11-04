import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string | null;
  role: "buyer" | "supplier" | "seller" | "admin";
  accountStatus: "active" | "pending" | "suspended";
  emailVerified: boolean;
  lastLogin?: Date | null;
  // Backward compatibility & profile link fields
  openId?: string | null;
  numericId?: number;
  phone?: string | null;
  companyName?: string | null;
  gstNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  isVerified: boolean;
  loginMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["buyer", "supplier", "seller", "admin"],
      default: "buyer",
    },
    accountStatus: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    openId: {
      type: String,
      unique: true,
      sparse: true,
    },
    numericId: {
      type: Number,
      sparse: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    companyName: {
      type: String,
      default: null,
      trim: true,
    },
    gstNumber: {
      type: String,
      default: null,
      trim: true,
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    city: {
      type: String,
      default: null,
      trim: true,
    },
    state: {
      type: String,
      default: null,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    loginMethod: {
      type: String,
      default: "credentials",
    },
  },
  {
    collection: "users",
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret.numericId || ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes
UserSchema.index({ role: 1, accountStatus: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
