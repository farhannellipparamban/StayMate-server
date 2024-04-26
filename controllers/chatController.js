import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";
import Owner from "../models/ownerModel.js";

export const ownerData = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Owner.findOne({ _id: id });
    res.status(200).json(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error " });
  }
};

export const userData = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await User.findOne({ _id: id });

    res.status(200).json(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const userChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.aggregate([
      { $match: { members: userId } },
      {
        $lookup: {
          from: "messages",
          let: { chatIdToString: { $toString: "$_id" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$chatId", "$$chatIdToString"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: "messages"
        }
      },
      {
        $addFields: {
          lastMessageTimeStamp: { $ifNull: [{ $first: "$messages.createdAt" }, null] }
        }
      },
      { $sort: { lastMessageTimeStamp: -1 } },
    ]);

    res.status(200).json(chats);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
