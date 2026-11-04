import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  id?: string;
  categoryName: string;
  slug: string;
  parentCategoryId?: mongoose.Types.ObjectId | null;
  description?: string;
  image?: string;
  status: "active" | "inactive";
  displayOrder: number;
  // Compatibility fields
  name?: string;
  department?: string;
  icon?: string;
  itemCount?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    id: {
      type: String,
      index: true,
      sparse: true,
    },
    categoryName: {
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
    parentCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    itemCount: {
      type: String,
      default: "No listings yet",
    },
  },
  {
    collection: "categories",
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.name = ret.name || ret.categoryName;
        ret.categoryName = ret.categoryName || ret.name;
        delete ret.__v;
        return ret;
      },
    },
  }
);

CategorySchema.pre("save", function () {
  if (!this.name) this.name = this.categoryName;
  if (!this.categoryName) this.categoryName = this.name;
});

export const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);
