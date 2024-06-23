import User from "../models/userModel.js";
import Rooms from "../models/roomModel.js";
import Bookings from "../models/bookingModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import chatModel from "../models/chatModel.js";

export const checkRoomAvailability = async (req, res) => {
  try {
    const { roomId, startDate, endDate } = req.body;
    const existingBooking = await Bookings.findOne({
      room: roomId,
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        { startDate: { $gte: startDate, $lte: endDate } },
      ],
    });
    if (existingBooking) {
      return res
        .status(400)
        .json({ message: "The room is not available for the selected dates." });
    } else {
      return res.status(200).json({ message: "Room available" });
    }
  } catch (error) {
    console.error("Error checking room availability:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const roomBooking = async (req, res) => {
  try {
    const {
      _id,
      totalAmount,
      ownerId,
      startDate,
      endDate,
      userId,
      chooseLocation,
      walletChecked,
    } = req.body;

    const existingBookings = await Bookings.find({
      room: _id,
      $or: [
        {
          $and: [
            { startDate: { $lte: endDate } },
            { endDate: { $gte: startDate } },
          ],
        },
        {
          $and: [
            { startDate: { $gte: startDate } },
            { endDate: { $lte: endDate } },
          ],
        },
      ],
    });

    if (existingBookings.length > 0) {
      return res
        .status(400)
        .json({
          message: "This room is already booked for the selected dates.",
        });
    }

    let method = walletChecked ? "Wallet" : "Razorpay";

    const booking = new Bookings({
      user: userId,
      owner: ownerId,
      room: _id,
      totalBookingRent: totalAmount,
      startDate,
      endDate,
      chooseLocation,
      method,
    });
    const bookingData = await booking.save();
    if (walletChecked) {
      const user = await User.findByIdAndUpdate(
        { _id: userId },
        {
          $push: {
            walletHistory: {
              date: new Date(),
              amount: -totalAmount,
              description: "Payment using wallet",
            },
          },
          $inc: { wallet: -totalAmount },
        },
        { new: true }
      );
      const bookingDetails = await Bookings.findByIdAndUpdate(
        { _id: bookingData._id },
        { $set: { bookingStatus: "Success" } },
        { new: true }
      );
      const roomDetails = await Rooms.findByIdAndUpdate(
        { _id: _id },
        {
          $push: {
            bookingDates: {
              startDate: startDate,
              endDate: endDate,
            },
          },
        },
        { new: true }
      );
      const chatExist = await chatModel.findOne({
        members:{ $all :[userId.toString(), ownerId.toString()]}
      });
      if(!chatExist){
        const newChat = new chatModel({
          members: [userId.toString(), ownerId.toString()],
        })
        await newChat.save()
      }
      res.status(200).json({
        message: "Your booking Successfully Completed",
        roomDetails,
        user,
        bookingDetails,
      });
    } else {
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRET,
      });
      const options = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: "" + bookingData._id,
      };
      instance.orders.create(options, function (err, booking) {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: "Something went wrong" });
        }
        res.status(200).json({ bookingData: booking });
      });

    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyBooking = async (req, res) => {
  try {
    const { response, bookingData } = req.body;
    let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(
      response.razorpay_order_id + "|" + response.razorpay_payment_id
    );
    hmac = hmac.digest("hex");
    if (hmac === response.razorpay_signature) {
      const bookingDetails = await Bookings.findByIdAndUpdate(
        { _id: bookingData.receipt },
        { $set: { bookingStatus: "Success" } },
        { new: true }
      );
      const roomDetails = await Rooms.findByIdAndUpdate(
        { _id: bookingData.roomId },
        {
          $push: {
            bookingDates: {
              startDate: bookingData.startDate,
              endDate: bookingData.endDate,
            },
          },
        },
        { new: true }
      );

      res.status(200).json({
        message: "Your booking succeffully completed",
        roomDetails,
        bookingDetails,
      });
      
    } else {
      await Bookings.deleteOne({ _id: bookingData.receipt });
      res.status(400).json({ message: "Payment failed" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const filteredRooms = async (req, res) => {
  try {
    const { chooseLocation, CheckInDate, CheckOutDate, Persons } = req.body;
    const availableRooms = await Rooms.aggregate([
      {
        $match: {
          location: { $regex: new RegExp(chooseLocation, "i") },
          verificationStatus: "Approved",
          capacity: { $gte: Persons },
        },
      },
      {
        $lookup: {
          from: "owners",
          localField: "ownerId",
          foreignField: "_id",
          as: "owner",
        },
      },
    ]);
    // const availableRooms = await Rooms.find({})
// console.log(availableRooms,"wijf");
    const filteredRooms = availableRooms.filter((room) => {
      const bookingDates = room.bookingDates;
      if (!bookingDates || bookingDates.length === 0) {
        return true;
      }
      const checkIn = new Date(CheckInDate).getTime();
      const checkOut = new Date(CheckOutDate).getTime();
      for (const booking of bookingDates) {
        const startDate = booking.startDate?.getTime();
        const endDate = booking.endDate?.getTime();

        if (
          (checkIn >= startDate && checkIn < endDate) ||
          (checkOut > startDate && checkOut <= endDate)
        ) {
          return false;
        }
      }
      return true;
    });

    res.status(200).json({ rooms: filteredRooms });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const myBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookingList = await Bookings.find({ user: userId })
      .populate("room")
      .populate("owner")
      .sort({ createdAt: -1 });
    res.status(200).json({ bookingList });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Sever Error" });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    const updatedData = await Bookings.findByIdAndUpdate(
      { _id: bookingId },
      { $set: { cancelReason: reason, cancelStatus: "Pending" } },
      { new: true }
    );
    const userId = updatedData.user;
    const bookingList = await Bookings.find({ user: userId })
      .populate("room")
      .sort({ createdAt: -1 });
    res.status(200).json({
      bookingList,
      message:
        "Cancel request has been sent.We will verify and refound your amount",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const bookingListOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const bookingList = await Bookings.find({ owner: ownerId })
      .populate("room")
      .populate("user")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({ bookingList });
  } catch (error) {
    console.log(error.message);
  }
};
export const cancelBookingOwner = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    const updataedData = await Bookings.findByIdAndUpdate(
      { _id: bookingId },
      { $set: { cancelReason: reason, bookingStatus: "Cancelled" } },
      { new: true }
    );
    const owner = updataedData.owner;
    const userId = updataedData.user;
    const refoundAmount = 0.9 * updataedData.totalBookingRent;
    await User.findByIdAndUpdate(
      { _id: userId },
      {
        $inc: { wallet: refoundAmount },
        $push: {
          walletHistory: {
            date: new Date(),
            amount: +refoundAmount,
            description: `Refunded for cancel booking  - Booking Id: ${updataedData._id}`,
          },
        },
      }
    );
    await Rooms.findByIdAndUpdate(
      { _id: updataedData.room },
      {
        $pull: {
          bookingDates: {
            startDate: updataedData.startDate,
            endDate: updataedData.endDate,
          },
        },
      },
      { new: true }
    );
    const bookingList = await Bookings.find({ owner: owner })
      .populate("room")
      .sort({
        timestampField: -1,
      });

    res.status(200).json({
      bookingList,
      message: "Booking cancelled,Refound will be credited in your wallet",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const cancelRequests = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const totalRequests = await Bookings.find({
      cancelStatus: "Pending",
      owner: ownerId,
    })
      .populate("room")
      .populate("user")
      .sort({
        createdAt: -1,
      });
    res.status(200).json({ totalRequests: totalRequests });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
export const apporveCancelRequest = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    if (status === "Approved") {
      const updataedData = await Bookings.findByIdAndUpdate(
        { _id: bookingId },
        { $set: { bookingStatus: "Cancelled", cancelStatus: status } },
        { new: true }
      );
      const userId = updataedData.user;
      const refoundAmount = 0.9 * updataedData.totalBookingRent;
      await User.findByIdAndUpdate(
        { _id: userId },
        {
          $inc: { wallet: refoundAmount },
          $push: {
            walletHistory: {
              date: new Date(),
              amount: +refoundAmount,
              description: `Refunded for cancel booking  - Booking Id: ${updataedData._id}`,
            },
          },
        }
      );
      await Rooms.findByIdAndUpdate(
        { _id: updataedData.room },
        {
          $pull: {
            bookingDates: {
              startDate: updataedData.startDate,
              endDate: updataedData.endDate,
            },
          },
        },
        { new: true }
      );

      const totalRequests = await Bookings.find({ cancelStatus: "Pending" })
        .populate("room")
        .sort({
          createdAt: -1,
        });
      res.status(200).json({
        totalRequests: totalRequests,
        message: "Cancel reuest has been appoved",
      });
    } else if (status === "Rejected") {
      await Bookings.findByIdAndUpdate(
        { _id: bookingId },
        { $set: { cancelStatus: status } },
        { new: true }
      );
      const totalRequests = await Bookings.find({ cancelStatus: "Pending" })
        .populate("room")
        .sort({
          createdAt: -1,
        });
      res.status(200).json({
        totalRequests: totalRequests,
        message: "Cancel reuest has been rejected",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const changeBookingStatus = async (req, res) => {
  try {
    const { status, bookingId, startDate, endDate, roomId } = req.body;
    await Bookings.findByIdAndUpdate(
      { _id: bookingId },
      { $set: { bookingStatus: status } }
    );
    if (status === "Checked Out") {
      const start = new Date(startDate);
      const end = new Date(endDate);
      await Rooms.findByIdAndUpdate(
        { _id: roomId._id },
        { $pull: { bookingDates: { startDate: start, endDate: end } } }
      );
    }
    res.status(200).json({ message: `Rooms Successfully Boocked` });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
