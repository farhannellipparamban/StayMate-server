import mongoose from "mongoose";

const offerSchema = mongoose.Schema({
  rooms: {
    type: String,
  },
  offerName: {
    type: String,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
  },
});

export default mongoose.model("offer", offerSchema);
