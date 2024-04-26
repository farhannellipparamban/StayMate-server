import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "owner",
      required: true,
    },
    room: {
      type: mongoose.Types.ObjectId,
      ref: "room",
      required: true,
    },
    totalBookingRent: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    bookingStatus: {
      type: String,
      // required: true,
    },
    method: {
      type: String,
      required: true,
    },
    chooseLocation: {
      type: String,
      required: true,
    },
    cancelReason: {
      type: String,
    },
    cancelStatus: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("booking", bookingSchema);
