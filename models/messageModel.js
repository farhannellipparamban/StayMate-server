// import mongoose from "mongoose";

// const messageSchema = new mongoose.Schema(
//   {
//     chatId: {
//       type: String,
//     },
//     senderId: {
//       type: String,
//     },
//     text: {
//       type: String,
//     },
//     audioPath: {
//       type: String,
//     },
//     images: [
//       {
//         type: String,
//       },
//     ],
//     videos: [
//       {
//         type: String,
//       },
//     ],
//     files: [
//       {
//         fileName: String,
//         filePath: String,
//         fileType: String,
//       },
//     ],
//   },
//   { timestamps: true }
// );

// export default mongoose.model("message", messageSchema);

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: String },
    senderId: { type: String },
    text: { type: String },
    audio: {
      public_id: { type: String },
      url: { type: String },
    },
    images: [
      {
        public_id: { type: String },
        url: { type: String },
      },
    ],
    videos: [
      {
        public_id: { type: String },
        url: { type: String },
      },
    ],
    files: [
      {
        fileName: String,
        fileExtension: String,
        public_id: { type: String },
        url: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("message", messageSchema);