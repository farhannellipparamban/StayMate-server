import express from "express";
import { userTokenVerify } from "../middleware/authVerify.js";
import {
  HomeRoomListing,
  addRoomsReview,
  allRoomList,
  emailOtpVerification,
  forgetPassword,
  getUserDetails,
  loadOffer,
  loginVerification,
  resendOtp,
  resetPassword,
  reviewList,
  updateProfile,
  userGoogleLogin,
  userSignup,
} from "../controllers/userController.js";
import {
  cancelBooking,
  checkRoomAvailability,
  filteredRooms,
  myBookings,
  roomBooking,
  verifyBooking,
} from "../controllers/bookingController.js";
import { applyCoupon, couponList } from "../controllers/couponController.js";

const userRoute = express();

userRoute.post("/signup", userSignup);
userRoute.post("/otp", emailOtpVerification);
userRoute.post("/resendOtp", resendOtp);
userRoute.post("/login", loginVerification);
userRoute.post("/googleLogin", userGoogleLogin);
userRoute.post("/forgetPassword", forgetPassword);
userRoute.put("/resetPassword/:id/:token", resetPassword);
userRoute.get("/homeRoomList", HomeRoomListing);
userRoute.get("/allRooms", allRoomList);
userRoute.post("/filterRooms", filteredRooms);
userRoute.put("/editProfile", userTokenVerify, updateProfile);
userRoute.get("/userDetails/:id", userTokenVerify, getUserDetails);
userRoute.post("/checkAvailable", userTokenVerify,checkRoomAvailability);
userRoute.post("/roomBooking", userTokenVerify, roomBooking);
userRoute.post("/verifyPayment", userTokenVerify, verifyBooking);
userRoute.get("/myBookings/:userId", userTokenVerify, myBookings);
userRoute.post("/cancelBooking", userTokenVerify, cancelBooking);
userRoute.get("/allCoupons", userTokenVerify, couponList);
userRoute.post("/applyCoupon", userTokenVerify, applyCoupon);
userRoute.get("/loadOffer", userTokenVerify, loadOffer);
userRoute.put("/addRoomsReview",userTokenVerify,addRoomsReview)
userRoute.get("/reviewList/:id",userTokenVerify,reviewList)

export default userRoute;
