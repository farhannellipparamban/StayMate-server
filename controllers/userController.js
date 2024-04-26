import User from "../models/userModel.js";
import Rooms from "../models/roomModel.js";
// import Bookings from "../models/bookingModel.js";
import securePassword from "../utils/securePassword.js";
import sendMailOtp from "../utils/nodeMailer.js";
import Otp from "../models/otpModel.js";
import Offer from "../models/offerModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

let otpId;
export const userSignup = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    const userExist = await User.findOne({ email: email });
    const hashedPassword = await securePassword(password);

    if (userExist) {
      return res
        .status(401)
        .json({ message: "User already registered with this email" });
    }

    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      password: hashedPassword,
    });
    const userData = await user.save();
    otpId = await sendMailOtp(userData.name, userData.email, userData._id);

    return res.status(201).json({
      message: `Otp has been send to ${email}`,
      user: userData,
      otpId: otpId,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const emailOtpVerification = async (req, res) => {
  try {
    const { otp, userId } = req.body;
    const otpData = await Otp.find({ userId: userId });
    const { expiresAt } = otpData[otpData.length - 1];
    const correctOtp = otpData[otpData.length - 1].otp;
    if (otpData && expiresAt < Date.now) {
      return res.status(401).json({ message: "Email OTP has expired" });
    }
    if (correctOtp === otp) {
      await Otp.deleteMany({ userId: userId });
      await User.updateOne({ _id: userId }, { $set: { isVerified: true } });
      res.status(200).json({
        status: true,
        message: "User registered successfully,You can login now",
      });
    } else {
      res.status(400).json({ status: false, message: "Incorrect OTP" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { userEmail } = req.body;
    const { _id, name, email } = await User.findOne({ email: userEmail });
    const otpId = sendMailOtp(name, email, _id);
    if (otpId) {
      res.status(200).json({ message: `An OTP has been resent to ${email}` });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Failed to send OTP. Please try again later.",
    });
  }
};

export const loginVerification = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: "User not registered" });
    }
    if (user.isVerified) {
      if (user.isBlocked === false) {
        const correctPassword = await bcrypt.compare(password, user.password);
        if (correctPassword) {
          const token = jwt.sign(
            { name: user.name, email: user.email, id: user._id, role: "user" },
            process.env.USER_SECRET,
            {
              expiresIn: "1h",
            }
          );
          res
            .status(200)
            .json({ user, token, message: `Welcome ${user.name}` });
        } else {
          return res.status(403).json({ message: "Incorrect Password" });
        }
      } else {
        return res.status(403).json({ message: "User is blocked by Admin" });
      }
    } else {
      return res.status(401).json({ message: "Email is not verified" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const userGoogleLogin = async (req, res) => {
  try {
    const { email, displayName, photoURL } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: "User Is not registered" });
    } else {
      if (user.isBlocked === true) {
        return res.status(403).json({ message: "User is blocked" });
      }
    }
    if (user) {
      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email, role: "user" },
        process.env.USER_SECRET,
        {
          expiresIn: "1h",
        }
      );
      const { password, ...userData } = user._doc;

      res.status(200).json({
        user: userData,
        token,
        message: `Welome ${user.name}`,
      });
    } else {
      const generatedPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await securePassword(generatedPassword);
      const newUser = new User({
        name:
          displayName.split(" ").join("").toLowerCase() +
          Math.random().toString(36).slice(-4),
        email: email,
        password: hashedPassword,
        profileImage: photoURL,
        isVerified: true,
      });

      await newUser.save();

      const token = jwt.sign({ id: newUser._id }, process.env.USER_SECRET);
      const { password, ...userData } = newUser._doc;

      return res
        .status(200)
        .json({ user: userData, token, message: "User created successfully." });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { userEmail } = req.body;
    const secret = process.env.PASSWORD_SECRET;
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(401).json({ message: "User is not registered" });
    }
    const token = jwt.sign({ _id: user._id }, secret, { expiresIn: "5m" });
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: userEmail,
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
            <a class="button" href="https://staymate.vercel.app/resetPassword/${user._id}/${token}">Reset Password</a>
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

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { id, token } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    try {
      const verify = jwt.verify(token, process.env.PASSWORD_SECRET);
      if (verify) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(
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

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await User.findOne({ _id: id });
    res.status(200).json({ userData });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const { email, name, mobile } = req.body.values;
    const userData = await User.findOneAndUpdate(
      { email: email },
      { $set: { name, mobile } },
      { new: true }
    );
    return res.status(200).json({ userData });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const HomeRoomListing = async (req, res) => {
  try {
    const roomData = await Rooms.find({ verificationStatus: "Approved" })
      .populate("ownerId")
      .limit(3);
    if (roomData) {
      res.status(200).json({ rooms: roomData });
    } else {
      res
        .status(500)
        .json({ message: "Somthing wrong with finding room data" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const allRoomList = async (req, res) => {
  try {
    const roomData = await Rooms.find({
      verificationStatus: "Approved",
      is_Blocked: false,
    }).populate("ownerId");
    if (roomData) {
      res.status(200).json({ rooms: roomData });
    } else {
      res
        .status(500)
        .json({ message: "Somthing wrong with finding room data" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const loadOffer = async (req, res) => {
  try {
    const offers = await Offer.find();
    if (offers) {
      res.status(200).json(offers);
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const addRoomsReview = async (req, res) => {
  try {
    const { roomId, userId, rating, review } = req.body;
    const roomData = await Rooms.findById(roomId);
    const alreadyRated = roomData.ratings.find(
      (user) => user.postedBy.toString() === userId.toString()
    );
    if (alreadyRated) {
      await Rooms.updateOne(
        { ratings: { $elemMatch: alreadyRated } },
        {
          $set: {
            "ratings.$.star": rating,
            "ratings.$.description": review,
            "ratings.$.postedDate": Date.now(),
          },
        }
      );
    } else {
      await Rooms.findByIdAndUpdate(roomId, {
        $push: {
          ratings: { star: rating, description: review, postedBy: userId },
        },
      });
    }

    const getAllRatings = await Rooms.findById(roomId);
    const totalRating = getAllRatings.ratings.length;
    const ratingSum = getAllRatings.ratings
      .map((rating) => rating.star)
      .reduce((prev, curr) => prev + curr, 0);

    const actualRating = (ratingSum / totalRating).toFixed(1);
    await Rooms.findByIdAndUpdate(roomId, {
      $set: { totalRating: actualRating },
    });

    res
      .status(200)
      .json({ message: "Thank you so much.Your review has been recieved" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const reviewList = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Rooms.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      { $unwind: "$ratings" },
      { $sort: { "ratings.postedDate": -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "ratings.postedBy",
          foreignField: "_id",
          as: "ratings.postedBy",
        },
      },
      { $unwind: "$ratings.postedBy" },
      {
        $group: {
          _id: "$_id",
          ratings: { $push: "$ratings" },
        },
      },
    ]);

    const ratings = room.length > 0 ? room[0].ratings : [];

    res.status(200).json(ratings);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
