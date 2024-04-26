import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Types.ObjectId,
    ref: "owner",
    required: true,
  },
  // offers: [
  //   {
  //     type: mongoose.Types.ObjectId,
  //     ref: "offer",
  //   },
  // ],
  roomName: {
    type: String,
    required: true,
  },
  rent: {
    type: Number,
    required: true,
  },
  is_Blocked: {
    type: Boolean,
    default: false,
  },
  is_Available: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  roomType: {
    type: String,
  },
  model: {
    type: String,
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
  },
  acType: {
    type: String,
    required: true,
  },
  roomImages: {
    type: Array,
    required: true,
  },
  verificationStatus: {
    type: String,
    default: "Pending",
  },
  capacity: {
    type: Number,
    required: true,
  },
  ratings: [
    {
      star: Number,
      description: String,
      postedBy: { type: mongoose.Types.ObjectId, ref: "user" },
      postedDate: { type: Date },
    },
  ],
  totalRating: {
    type: String,
    default: 0,
  },
  bookingDates: [
    {
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
    },
  ],
});

export default mongoose.model("room", roomSchema);
