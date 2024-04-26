import User from "../models/userModel.js";
import Owner from "../models/ownerModel.js";
import Room from "../models/roomModel.js";
import Bookings from "../models/bookingModel.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const adminLogin = (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const userName = "Admin";
  try {
    const { email, password } = req.body;
    if (adminEmail === email) {
      if (adminPassword === password) {
        const token = jwt.sign(
          {
            name: userName,
            email: adminEmail,
            role: "admin",
          },
          process.env.ADMIN_SECRET,
          {
            expiresIn: "1h",
          }
        );
        res
          .status(200)
          .json({ userName, token, message: `Welome ${userName}` });
      } else {
        res.status(403).json({ message: "Incorrect Password" });
      }
    } else {
      res.status(401).json({ message: "Incorrect email" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const userList = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const userBlock = async (req, res) => {
  try {
    const { userId, status } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const updatedStatus = !status;

    await User.findByIdAndUpdate(
      { _id: userId },
      { $set: { isBlocked: updatedStatus } }
    );

    let message = "";
    if (updatedStatus) {
      message = "User is Blocked.";
    } else {
      message = "User is Unblocked.";
    }

    res.status(200).json({ message });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const ownerList = async (req, res) => {
  try {
    const owners = await Owner.find();
    res.status(200).json({ owners });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const ownerBlock = async (req, res) => {
  try {
    const { ownerId, status } = req.body;
    const owner = await Owner.findById(ownerId);

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const updatedStatus = !status;

    await Owner.findByIdAndUpdate(
      { _id: ownerId },
      { $set: { isBlocked: updatedStatus } }
    );

    let message = "";
    if (updatedStatus) {
      message = "Owner is Blocked.";
    } else {
      message = "Owner is Unblocked.";
    }

    res.status(200).json({ message });
  } catch (error) {
    console.log(error, message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const roomList = async (req, res) => {
  try {
    const rooms = await Room.find().populate("ownerId");
    res.status(200).json({ rooms });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const singleRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId).populate("ownerId");
    res.status(200).json({ room });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const roomAddRequests = async (req, res) => {
  try {
    const totalRequests = await Room.find({
      verificationStatus: "Pending",
    }).sort({ createdAt: -1 });
    res.status(200).json({ totalRequests: totalRequests });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const verifyRoomDetails = async (req, res) => {
  try {
    const { roomId, status } = req.body;

    if (status === "approve") {
      const room = await Room.findByIdAndUpdate(
        { _id: roomId },
        { $set: { verificationStatus: "Approved" } },
        { new: true }
      );
      res.status(200).json({ succMessage: "Approved", room });
    } else {
      const room = await Room.findByIdAndUpdate(
        { _id: roomId },
        { $set: { verificationStatus: "Rejected" } },
        { new: true }
      );
      res.status(200).json({ errMessage: "Rejected", room });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const dashboardReport = async (req, res) => {
  try {
    const totalRevenue = await Bookings.aggregate([
      {
        $match: {
          bookingStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: {
            $sum: {
              $multiply: ["$totalBookingRent", 0.2], // 20% of totalBookingCharge
            },
          },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const earningsByMonth = await Bookings.aggregate([
      {
        $match: {
          bookingStatus: { $ne: "Cancelled" },
          $expr: { $eq: [{ $month: "$createdAt" }, currentMonth] },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          monthlyEarnings: {
            $sum: { $multiply: ["$totalBookingRent", 0.2] },
          },
        },
      },
    ]);

    const currentMonthEarnings = earningsByMonth.find(
      (monthEarnings) => monthEarnings._id === currentMonth
    );

    const monthName = currentDate.toLocaleString("default", { month: "long" });

    let date = new Date();
    let year = date.getFullYear();
    let currentYear = new Date(year, 0, 1);
    let users = [];
    let usersByYear = await User.aggregate([
      {
        $match: { createdAt: { $gte: currentYear }, isBlocked: { $ne: true } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    for (let i = 1; i <= 12; i++) {
      let result = true;
      for (let j = 0; j < usersByYear.length; j++) {
        result = false;
        if (usersByYear[j]._id == i) {
          users.push(usersByYear[j]);
          break;
        } else {
          result = true;
        }
      }
      if (result) users.push({ _id: i, count: 0 });
    }
    let usersData = [];

    for (let i = 0; i < users.length; i++) {
      usersData.push(users[i].count);
    }
    let owners = [];
    let ownersByYear = await Owner.aggregate([
      {
        $match: { createdAt: { $gte: currentYear }, isBlocked: { $ne: true } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    for (let i = 1; i <= 12; i++) {
      let result = true;
      for (let j = 0; j < ownersByYear.length; j++) {
        result = false;
        if (ownersByYear[j]._id == i) {
          owners.push(ownersByYear[j]);
          break;
        } else {
          result = true;
        }
      }
      if (result) owners.push({ _id: i, count: 0 });
    }
    let ownersData = [];
    for (let i = 0; i < owners.length; i++) {
      ownersData.push(owners[i].count);
    }

    const trendingRoomDetails = await Bookings.aggregate([
      {
        $match: {
          bookingStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: "$room",
          totalBookings: { $sum: 1 },
        },
      },
      {
        $sort: {
          totalBookings: -1,
        },
      },
      {
        $limit: 4,
      },
      {
        $lookup: {
          from: "rooms",
          localField: "_id",
          foreignField: "_id",
          as: "roomDetails",
        },
      },
      {
        $unwind: "$roomDetails",
      },
      {
        $project: {
          _id: "$roomDetails._id",
          totalBookings: 1,
          roomDetails: {
            roomName: "$roomDetails.roomName",
            roomImage: "$roomDetails.roomImages",
            rent: "$roomDetails.rent",
          },
        },
      },
    ]);

    const result = {
      totalRevenue: totalRevenue[0] || { totalEarnings: 0, totalBookings: 0 },
      currentMonthEarnings: currentMonthEarnings || { monthlyEarnings: 0 },
      currentMonthName: monthName,
      ownersData,
      usersData,
      trendingRoomDetails,
    };
    res.status(200).json(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error " });
  }
};
