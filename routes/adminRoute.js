import express from "express";
const adminRoute = express();
import { adminTokenVerify } from "../middleware/authVerify.js";
import {
  adminLogin,
  dashboardReport,
  ownerBlock,
  ownerList,
  roomAddRequests,
  roomList,
  singleRoomDetails,
  userBlock,
  userList,
  verifyRoomDetails,
} from "../controllers/adminController.js";
import { couponList, createCoupon, deleteCoupons, editCouponDetails, editCoupons } from "../controllers/couponController.js";

adminRoute.post("/login", adminLogin);
adminRoute.get("/userList", adminTokenVerify, userList);
adminRoute.patch("/blockUser", adminTokenVerify, userBlock);
adminRoute.get("/ownerList", adminTokenVerify, ownerList);
adminRoute.patch("/blockOwner", adminTokenVerify, ownerBlock);
adminRoute.get("/roomList",adminTokenVerify,roomList)
adminRoute.get("/singleRoomDetails/:roomId",adminTokenVerify,singleRoomDetails)
adminRoute.get("/roomAddRequest", adminTokenVerify, roomAddRequests);
adminRoute.patch('/verifyRoom',adminTokenVerify,verifyRoomDetails)
adminRoute.get("/report",adminTokenVerify,dashboardReport)
adminRoute.post("/addCoupon",adminTokenVerify,createCoupon)
adminRoute.get("/couponList",adminTokenVerify,couponList)
adminRoute.get("/editCouponDetails/:couponId",adminTokenVerify,editCouponDetails)
adminRoute.put("/editCoupon",adminTokenVerify,editCoupons)
adminRoute.patch("/deleteCoupon/:couponId",adminTokenVerify,deleteCoupons)

export default adminRoute;
