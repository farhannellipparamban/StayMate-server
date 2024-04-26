import express from "express";

const ownerRoute = express();
import { ownerTokenVerify } from "../middleware/authVerify.js";
import {
  BlockCustomer,
  customersList,
  dashboardReport,
  getAllReviews,
  ownerEmailVerify,
  ownerForgetPassword,
  ownerGoogleLogin,
  ownerLoginVerify,
  ownerRegister,
  ownerResendOtp,
  ownerResetPassword,
  updateOwnerProfile,
} from "../controllers/ownerController.js";
import {
  RoomListDetails,
  addRoom,
  deleteRoomImage,
  editRoom,
  editRoomDetails,
  roomBlock,
} from "../controllers/roomController.js";
import {
  apporveCancelRequest,
  bookingListOwner,
  cancelBookingOwner,
  cancelRequests,
  changeBookingStatus,
} from "../controllers/bookingController.js";
import { addOffer, deleteOffers, editOfferDetails, editOffers, offerList } from "../controllers/offerController.js";

ownerRoute.post("/signup", ownerRegister);
ownerRoute.post("/otp", ownerEmailVerify);
ownerRoute.post("/resendOtp", ownerResendOtp);
ownerRoute.post("/login", ownerLoginVerify);
ownerRoute.post("/googleLogin", ownerGoogleLogin);
ownerRoute.post("/ownerForget", ownerForgetPassword);
ownerRoute.patch("/ownerResetPass/:id/:token", ownerResetPassword);
ownerRoute.put("/editProfile", ownerTokenVerify, updateOwnerProfile);
ownerRoute.get("/customers", ownerTokenVerify, customersList);
ownerRoute.patch("/blockCustomers", ownerTokenVerify, BlockCustomer);
ownerRoute.post("/addRoom", ownerTokenVerify, addRoom);
ownerRoute.get("/roomList/:ownerId", ownerTokenVerify, RoomListDetails);
ownerRoute.get("/editRoomDetails/:roomId", ownerTokenVerify, editRoomDetails);
ownerRoute.put("/editRoom", ownerTokenVerify, editRoom);
ownerRoute.patch("/deleteImage", ownerTokenVerify, deleteRoomImage);
ownerRoute.patch("/blockRoom", ownerTokenVerify, roomBlock);
ownerRoute.get("/bookingsOwner/:ownerId", ownerTokenVerify, bookingListOwner);
ownerRoute.post("/cancelBooking", ownerTokenVerify, cancelBookingOwner);
ownerRoute.patch("/changeStatus", ownerTokenVerify, changeBookingStatus);
ownerRoute.get("/cancelRequests/:ownerId", ownerTokenVerify, cancelRequests);
ownerRoute.patch("/approveCancel", ownerTokenVerify, apporveCancelRequest);
ownerRoute.get("/report/:ownerId",ownerTokenVerify,dashboardReport)
ownerRoute.post("/addOffer",ownerTokenVerify,addOffer)
ownerRoute.get("/offerList",ownerTokenVerify,offerList)
ownerRoute.get("/editOfferDetails/:offerId",ownerTokenVerify,editOfferDetails)
ownerRoute.put("/editOffer",ownerTokenVerify,editOffers)
ownerRoute.patch("/deleteOffer/:offerId",ownerTokenVerify,deleteOffers)
ownerRoute.get("/reviewsList/:id",ownerTokenVerify,getAllReviews)

export default ownerRoute;
