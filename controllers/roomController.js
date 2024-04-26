import Room from "../models/roomModel.js";
import cloudinary from "../utils/cloudinary.js";

export const addRoom = async (req, res) => {
  try {
    const {
      ownerId,
      roomName,
      rent,
      mobile,
      description,
      location,
      imgAfterCrop,
      roomType,
      acType,
      model,
      capacity,
    } = req.body;
    const uploadPromises = imgAfterCrop.map((image) => {
      return cloudinary.uploader.upload(image, {
        folder: "RoomImages",
      });
    });
    const uploadImages = await Promise.all(uploadPromises);
    let roomImages = uploadImages.map((image) => image.secure_url);
    await Room.create({
      ownerId,
      roomName,
      description,
      location,
      mobile,
      rent,
      roomType,
      roomImages,
      acType,
      model,
      capacity,
    });
    res.status(201).json({ message: "Room added Successfully " });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const RoomListDetails = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const rooms = await Room.find({ ownerId: ownerId });
    if (rooms) {
      return res.status(200).json({ rooms });
    } else {
      return res
        .status(200)
        .json({ message: "something happened with finding room data" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const editRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    if (roomId) {
      return res.status(200).json({ room });
    }
    return res.status(404).json({ message: "Room not Found" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const editRoom = async (req, res) => {
  try {
    const {
      roomId,
      roomName,
      roomImage,
      rent,
      model,
      acType,
      description,
      roomType,
      mobile,
      location,
      capacity,
    } = req.body;

    let existingImage = [];
    const existingRoom = await Room.findById(roomId);
    if (roomImage.length === 0) {
      existingImage = existingImage.roomImages;
    } else {
      const uploadPromises = roomImage.map((image) => {
        // Specify cropping parameters
        const croppedImage = {
          folder: "RoomImages",
          crop: "fill", // Specify crop mode (e.g., "fill", "limit", "fit", "crop", etc.)
          width: 500, // Specify the width of the cropped image
          height: 500, // Specify the height of the cropped image
        };
        return cloudinary.uploader.upload(image, croppedImage);
      });
      const uploadImages = await Promise.all(uploadPromises);

      if (
        existingRoom &&
        existingRoom.roomImages &&
        existingRoom.roomImages.length > 0
      ) {
        existingImage = existingRoom.roomImages;
      }

      let roomImages = uploadImages.map((image) => image.secure_url);
      for (let i = 0; i < roomImages.length; i++) {
        existingImage.push(roomImages[i]);
      }
    }
    await Room.findByIdAndUpdate(
      { _id: roomId },
      {
        $set: {
          roomName,
          roomType,
          mobile,
          location,
          acType,
          model,
          rent,
          description,
          capacity,
          roomImages: existingImage,
        },
      }
    );
    res.status(200).json({ message: "Room updated" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const deleteRoomImage = async (req, res) => {
  try {
    const { imageUrl, roomId } = req.body;
    const publicId = imageUrl.match(/\/v\d+\/(.+?)\./)[1]; // Extract public ID from URL

    const deletionResult = await cloudinary.uploader.destroy(publicId, {
      folder: "RoomImages",
    });

    if (deletionResult.result === "ok") {
      const updatedData = await Room.findByIdAndUpdate(
        { _id: roomId },
        { $pull: { roomImages: imageUrl } },
        { new: true }
      );
      if (!updatedData) {
        return res.status(404).json({ message: "Room not found" });
      }
      return res
        .status(200)
        .json({ message: "Image removed successfully", updatedData });
    } else {
      console.error(
        `Failed to delete image at ${imageUrl} in RoomImages from Cloudinary.`
      );
      return res.status(500).json({ message: "image not found in cloudinary" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const roomBlock = async (req, res) => {
  try {
    const { roomId, status } = req.body;
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const updatedStatus = !status;
    await Room.findByIdAndUpdate(
      { _id: roomId },
      { $set: { is_Blocked: updatedStatus } }
    );

    let message = "";
    if (updatedStatus) {
      message = "Room is Blocked.";
    } else {
      message = "Room is Unblocked.";
    }

    res.status(200).json({ message });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
