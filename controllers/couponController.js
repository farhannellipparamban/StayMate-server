import Coupon from "../models/couponModel.js";

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountAmount,
      maxUsers,
      expiryDate,
      discountType,
      roomId,
      minRoomRent,
      maxDiscount,
    } = req.body;

    const existingCoupon = await Coupon.findOne({ code });

    if (existingCoupon) {
      return res
        .status(400)
        .json({ errormessage: "This Coupon code already exists" });
    }
    await Coupon.create({
      code,
      discountAmount,
      maxUsers,
      expiryDate,
      discountType,
      roomId,
      minRoomRent,
      maxDiscount,
    });
    res.status(201).json({ message: "Coupon Added Successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error " });
  }
};

export const couponList = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    if (coupons) {
      return res.status(200).json({ coupons });
    } else {
      return res
        .status(200)
        .json({ message: "something happened with finding coupon data" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error " });
  }
};

export const editCouponDetails = async (req, res) => {
  try {
    const { couponId } = req.params;
    const coupon = await Coupon.findById(couponId);
    if (couponId) {
      return res.status(200).json({ coupon });
    }
    return res.status(404).json({ message: "Coupon Not Found" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error " });
  }
};

export const editCoupons = async (req, res) => {
  try {
    const {
      couponId,
      code,
      discountAmount,
      maxUsers,
      expiryDate,
      discountType,
      minRoomRent,
      maxDiscount,
    } = req.body;

    await Coupon.findByIdAndUpdate(
      { _id: couponId },
      {
        $set: {
          code,
          discountAmount,
          maxUsers,
          expiryDate,
          discountType,
          minRoomRent,
          maxDiscount,
        },
      }
    );

    res.status(200).json({ message: "Coupon Upadated" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const deleteCoupons = async (req, res) => {
  try {
    const { couponId } = req.params;
    await Coupon.findByIdAndDelete(couponId);
    res.status(200).json({ message: "Coupon delete" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { couponCode, userId } = req.body;

    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return res.status(400).json({ message: "Coupon not found" });
    }
    if (coupon.user.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You have already used this coupon" });
    }

    if (coupon.maxUsers <= 0) {
      return res
        .status(400)
        .json({ message: "This coupon has been fully redeemed" });
    }

    coupon.user.push(userId);
    coupon.maxUsers--;
    await coupon.save();

    return res.status(200).json({ message: "Coupon applied successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error " });
  }
};
