import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
  },
  roomId: {
    type: mongoose.Types.ObjectId,
    ref: "room",
    // required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  maxUsers: {
    type: Number,
  },
  expiryDate: {
    type: Date,
    required: true,
    expires: 0,
  },
  discountStatus: {
    type: Boolean,
    default: true,
  },
  discountType: {
    type: String,
    required: true,
  },
  minRoomRent: {
    type: Number,
    required:true,
  },
  maxDiscount: {
    type: Number, 
    required:true,
  },
  user: {
    type: Array,
    ref: "user",
    default: [],
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

couponSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("coupon", couponSchema);
