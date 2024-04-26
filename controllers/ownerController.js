import Owner from "../models/ownerModel.js";
import Customers from "../models/userModel.js";
import Otp from "../models/otpModel.js";
import Rooms from "../models/roomModel.js";
import Bookings from "../models/bookingModel.js";
import securePassword from "../utils/securePassword.js";
import sendMailOtp from "../utils/nodeMailer.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();
let otpId;
export const ownerRegister = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const hashedPassword = await securePassword(password);
    const emailExist = await Owner.findOne({ email: email });
    if (emailExist) {
      return res
        .status(409)
        .json({ status: "Owner already registered with this email" });
    }
    const owner = new Owner({
      name: name,
      email: email,
      mobile: mobile,
      password: hashedPassword,
    });

    const ownerData = await owner.save();
    otpId = await sendMailOtp(ownerData.name, ownerData.email, ownerData._id);

    res.status(201).json({
      status: `Otp has sent to ${email}`,
      owner: ownerData,
      otpId: otpId,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const ownerEmailVerify = async (req, res) => {
  try {
    const { otp, ownerId } = req.body;
    const otpData = await Otp.find({ userId: ownerId });
    const { expiresAt } = otpData[otpData.length - 1];
    const correctOtp = otpData[otpData.length - 1].otp;
    if (otpData && expiresAt < Date.now()) {
      return res.status(401).json({ message: "Email OTP has expired" });
    }

    if (correctOtp === otp) {
      await Otp.deleteMany({ userId: ownerId });
      await Owner.updateOne({ _id: ownerId }, { $set: { isVerified: true } });
      res.status(200).json({
        status: true,
        message: "Owner registered successfully,You can login now",
      });
    } else {
      res.status(400).json({ status: false, message: "Incorrect OTP" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const ownerResendOtp = async (req, res) => {
  try {
    const { ownerEmail } = req.body;
    const { _id, name, email } = await Owner.findOne({ email: ownerEmail });
    const otpId = sendMailOtp(name, email, _id);
    if (otpId) {
      res.status(200).json({ message: `An OTP has been resent to ${email}.` });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const ownerLoginVerify = async (req, res) => {
  try {
    const { email, password } = req.body;
    const owner = await Owner.findOne({ email: email });
    if (!owner) {
      return res.status(401).json({ message: "Owner not registered" });
    }
    if (owner.isVerified) {
      if (owner.isBlocked === false) {
        const correctPassword = await bcrypt.compare(password, owner.password);
        if (correctPassword) {
          const token = jwt.sign(
            {
              name: owner.name,
              email: owner.email,
              id: owner._id,
              role: "owner",
            },
            process.env.OWNER_SECRET,
            {
              expiresIn: "1h",
            }
          );
          res
            .status(200)
            .json({ owner, token, message: `Welome ${owner.name}` });
        } else {
          return res.status(403).json({ message: "Incorrect Password" });
        }
      } else {
        return res.status(403).json({ message: "Owner is blocked by admin" });
      }
    } else {
      return res.status(401).json({ message: "Email is not verified" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const ownerGoogleLogin = async (req, res) => {
  try {
    const { email, displayName, photoURL } = req.body;
    const owner = await Owner.findOne({ email: email });
    if (!owner) {
      return res.status(401).json({ message: "Owner Is not registered" });
    } else {
      if (owner.isBlocked === true) {
        return res.status(403).json({ message: "Owner is blocked" });
      }
    }
    if (owner) {
      const token = jwt.sign(
        { id: owner._id, name: owner.name, email: owner.email, role: "owner" },
        process.env.OWNER_SECRET,
        {
          expiresIn: "1h",
        }
      );
      const { password, ...ownerData } = owner._doc;

      res.status(200).json({
        owner: ownerData,
        token,
        message: `Welome ${owner.name}`,
      });
    } else {
      const generatedPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await securePassword(generatedPassword);
      const newOwner = new Owner({
        name:
          displayName.split(" ").join("").toLowerCase() +
          Math.random().toString(36).slice(-4),
        email: email,
        password: hashedPassword,
        profileImage: photoURL,
        isVerified: true,
      });

      await newOwner.save();

      const token = jwt.sign({ id: newOwner._id }, process.env.OWNER_SECRET);
      const { password, ...ownerData } = newOwner._doc;

      return res.status(200).json({
        owner: ownerData,
        token,
        message: "Owner created successfully.",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const ownerForgetPassword = async (req, res) => {
  try {
    const { ownerEmail } = req.body;
    const secret = process.env.PASSWORD_SECRET_OWNER;
    const owner = await Owner.findOne({ email: ownerEmail });
    if (!owner) {
      return res.status(401).json({ message: "Owner is not registered" });
    }
    const token = jwt.sign({ _id: owner._id }, secret, { expiresIn: "5m" });
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: ownerEmail,
      subject: "Forget Password",
      html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f2f3f8;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 670px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            border-radius: 8px;
              text-align: center;
              box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06);
              max-width: 670px;
            }
            h1 {
              color: #1e1e2d;
              font-weight: 500;
              margin: 0;
              font-size: 32px;
              font-family: 'Rubik', sans-serif;
            }
            p {
              color: #455056;
              font-size: 15px;
              line-height: 24px;
              margin: 0;
            }
            a.button {
              background: red;
              text-decoration: none !important;
              font-weight: 500;
              margin-top: 35px;
              color: #fff;
              text-transform: uppercase;
              font-size: 14px;
              padding: 10px 24px;
              display: inline-block;
              border-radius: 50px;
            }
          </style>
        </head>
        <body>
        <div style='border-bottom:1px solid #eee'>
      <a href='' style='font-size:1.4em;color: #f30d0d;text-decoration:none;font-weight:600'>Stay<a style='color: #f30d0d;'></a>Mate</a>
      </div>
          <div class="container">
            <h1>You have requested to reset your password</h1>
            <div style="margin: 20px auto; width: 100px; height: 3px; background-color: #f30d0d;"></div>
            <p>We cannot simply send you your old password. A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions.</p>
            <a class="button" href="https://staymate.vercel.app/owner/ownerResetPass/${owner._id}/${token}">Reset Password</a>
          </div>
        </body>
      </html>
    `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Error sending email :", error);
        return res
          .status(500)
          .json({ message: "Failed to send email for password reset. " });
      } else {
        console.log("Email sent ", info.response);
        return res
          .status(200)
          .json({ message: "Email sent successfully for password rest. " });
      }
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const ownerResetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { id, token } = req.params;
    const owner = await Owner.findById(id);
    if (!owner) {
      return res.status(401).json({ message: "Owner not found" });
    }

    try {
      const verify = jwt.verify(token, process.env.PASSWORD_SECRET_OWNER);
      if (verify) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await Owner.findByIdAndUpdate(
          { _id: id },
          { $set: { password: hashedPassword } }
        );
        return res
          .status(200)
          .json({ message: "Successfully Changed Paasword" });
      }
    } catch (error) {
      console.log(error.message);
      return res.status(400).json({ message: "Somthing wrong with token" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

export const updateOwnerProfile = async (req, res) => {
  try {
    const { email, mobile, name } = req.body;
    console.log(req.body);
    const ownerData = await Owner.findOneAndUpdate(
      { email: email },
      { $set: { name, mobile } },
      { new: true }
    );
    return res.status(200).json({ ownerData });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const customersList = async (req, res) => {
  try {
    const customers = await Customers.find();
    res.status(200).json({ customers });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const BlockCustomer = async (req, res) => {
  try {
    const { customerId, status } = req.body;
    const customer = await Customers.findById(customerId);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const updatedStatus = !status;
    await Customers.findByIdAndUpdate(
      { _id: customerId },
      { $set: { isBlocked: updatedStatus } }
    );

    let message = "";
    if (updatedStatus) {
      message = "Customer is Blocked.";
    } else {
      message = "Customer is Unblocked.";
    }
    res.status(200).json({ message });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const dashboardReport = async (req, res) => {
  try {
    const { ownerId } = req.params;
    // room Count
    const rooms = await Rooms.find({ ownerId: ownerId });

    // total revenue
    const totalRevenue = await Bookings.aggregate([
      {
        $match: {
          bookingStatus: { $ne: "Cancelled" },
          owner: new mongoose.Types.ObjectId(ownerId),
        },
      },
      {
        $group: {
          _id: null,
          totalEarning: {
            $sum: {
              $multiply: ["$totalBookingRent", 0.8], // 80% of totalBookingCharge
            },
          },
          totalBookings: { $sum: 1 }, // Counting the number of bookings
        },
      },
    ]);

    //current month revenue
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const earningsByMonth = await Bookings.aggregate([
      {
        $match: {
          bookingStatus: { $ne: "Cancelled" },
          owner: new mongoose.Types.ObjectId(ownerId),
          $expr: { $eq: [{ $month: "$createdAt" }, currentMonth] },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          monthlyEarnings: {
            $sum: {
              $multiply: ["$totalBookingRent", 0.8], // 80% of totalBookingCharge
            },
          },
        },
      },
    ]);

    const currentMonthEarnings = earningsByMonth.find(
      (monthEarnings) => monthEarnings._id === currentMonth
    );

    const monthName = currentDate.toLocaleString("default", { month: "long" });

    //current Day revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRevenue = await Bookings.aggregate([
      {
        $match: {
          bookingStatus: { $ne: "Cancelled" },
          owner: new mongoose.Types.ObjectId(ownerId),
          createdAt: { $gte: today }, // Filter by today's date
        },
      },
      {
        $group: {
          _id: null,
          todayEarnings: {
            $sum: {
              $multiply: ["$totalBookingRent", 0.8], // 80% of totalBookingCharge
            },
          },
          todayBookings: { $sum: 1 }, // Counting the number of bookings
        },
      },
    ]);

    let sales = [];
    let date = new Date();
    let year = date.getFullYear();
    let currentYear = new Date(year, 0, 1);
    let salesByYear = await Bookings.aggregate([
      {
        $match: {
          createdAt: { $gte: currentYear },
          bookingStatus: { $ne: "Cancelled" },
          owner: new mongoose.Types.ObjectId(ownerId),
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%m", date: "$createdAt" } },
          total: { $sum: { $multiply: ["$totalBookingRent", 0.8] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    for (let i = 1; i <= 12; i++) {
      let result = true;
      for (let j = 0; j < salesByYear.length; j++) {
        result = false;
        if (salesByYear[j]._id == i) {
          sales.push(salesByYear[j]);
          break;
        } else {
          result = true;
        }
      }
      if (result) sales.push({ _id: i, total: 0, count: 0 });
    }
    let salesData = [];
    for (let i = 0; i < sales.length; i++) {
      salesData.push(sales[i].total);
    }

    /// booking status count
    const bookingStatusCount = await Bookings.aggregate([
      {
        $group: {
          _id: "$bookingStatus",
          count: { $sum: 1 },
        },
      },

      {
        $group: {
          _id: null,
          counts: {
            $push: {
              k: { $ifNull: ["$_id", "Unknown"] }, // Handle null _id values
              v: { $ifNull: ["$count", 0] }, // Handle null count values
            },
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $arrayToObject: "$counts",
          },
        },
      },

      {
        $project: {
          Cancelled: { $ifNull: ["$Cancelled", 0] },
          Success: { $ifNull: ["$Success", 0] },
          CheckedIn: { $ifNull: ["$CheckedIn", 0] },
          CheckedOut: { $ifNull: ["$CheckedOut", 0] },
        },
      },
    ]);

    const result = {
      totalRevenue: totalRevenue[0] || { totalEarnings: 0, totalBookings: 0 },
      currentMonthEarnings: currentMonthEarnings || { monthlyEarnings: 0 },
      currentMonthName: monthName,
      todayRevenue: todayRevenue[0] || { todayEarnings: 0, todayBookings: 0 },
      rooms,
      salesData,
      bookingStatusCount: bookingStatusCount[0] || {
        Cancelled: 0,
        Success: 0,
        CheckedIn: 0,
        CheckedOut: 0,
      },
    };
    res.status(200).json(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const roomData = await Rooms.findById(id).populate({
      path: "ratings.postedBy",
      select: "name",
    });
    res.status(200).json({ roomData });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
