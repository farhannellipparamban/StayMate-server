import Message from "../models/messageModel.js";
import cloudinary from "../utils/cloudinary.js";
import { Buffer } from "buffer";
import fs from "fs";
import path from "path";
import os from "os";

const ALLOWED_FILE_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

export const addMessage = async (req, res) => {
  try {
    const { chatId, text, senderId } = req.body;
    const message = new Message({
      chatId,
      text,
      senderId,
      createdAt: Date.now(),
    });
    const result = await message.save();
    res.status(200).json(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await Message.find({ chatId });
    res.status(200).json(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const addAudioMessage = async (req, res) => {
  try {
    const { chatId, senderId, audio } = req.body;
    if (!audio) {
      return res.status(400).json({ error: "Audio file not provided" });
    }

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audio.split(",")[1], "base64");

    // Create a temporary file from the buffer
    const tempFilePath = path.join(os.tmpdir(), `${Date.now()}.mp3`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    // Upload audio to Cloudinary
    const audioUpload = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: "auto",
      folder: "chat/audio",
    });

    // Remove the temporary file
    fs.unlinkSync(tempFilePath);

    // Create a new message record with the audio details from Cloudinary
    const message = new Message({
      chatId,
      senderId,
      audio: {
        public_id: audioUpload.public_id,
        url: audioUpload.secure_url,
      },
    });
    await message.save();

    res.status(201).json({ message: "Audio message sent successfully" });
  } catch (error) {
    console.error("Error adding audio message:", error);
    res.status(500).json({ error: error.message });
  }
};

export const imageSendingMessage = async (req, res) => {
  try {
    const { chatId, senderId, images } = req.body;

    if (!images) {
      return res.status(400).json({ error: "Image file not provided" });
    }

    // Extract the base64 image URL from the request body
    const base64Image = images[0].url;
    
    // Upload image to Cloudinary
    const imageUpload = await cloudinary.uploader.upload(base64Image, {
      resource_type: "image",
      folder: "chat/images",
    });

    // Create a new message record with the image details from Cloudinary
    const message = new Message({
      chatId,
      senderId,
      images: [
        {
          public_id: imageUpload.public_id,
          url: imageUpload.secure_url,
        },
      ],
    });

    // Save the message to the database
    await message.save();

    res.status(201).json({ message: "Image message sent successfully" });
  } catch (error) {
    console.error("Error adding image message:", error);
    res.status(500).json({ error: error.message });
  }
};

export const videoSendingMessage = async (req, res) => {
  try {
    const { chatId, senderId, videos } = req.body;
    if (!videos) {
      return res.status(400).json({ error: "Video file not provided" });
    }

    // Extract the base64 video URL from the request body
    const base64Videos = videos[0].url;

    // Upload video to Cloudinary
    const videoUpload = await cloudinary.uploader.upload(base64Videos, {
      resource_type: "video",
      folder: "chat/videos",
      timeout: 120000, 
    });

    // Create a new message record with the video details from Cloudinary
    const message = new Message({
      chatId,
      senderId,
      videos: [
        {
          public_id: videoUpload.public_id,
          url: videoUpload.secure_url,
        },
      ],
    });

    await message.save();
    res.status(201).json({ message: "video message sent successfully" });
  } catch (error) {
    console.error("Error adding video message:", error);
    res.status(500).json({ error: error.message });
  }
};

export const fileSendingMessage = async (req, res) => {
  try {
    const { chatId, senderId, files } = req.body;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Files not provided' });
    }

    const file = files[0];
    const base64Files = file.url;
    const fileExtension = file.fileExtension.toLowerCase();

    // Check if the file type is allowed
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      return res.status(400).json({ error: 'File type not allowed' });
    }

    // Upload file to Cloudinary
    const fileUpload = await cloudinary.uploader.upload(base64Files, {
      resource_type: fileExtension === 'pdf' ? 'pdf' : 'raw',
      folder: 'chat/files',
      timeout: 120000,
    });

    // Create a new message record with the file details from Cloudinary
    const message = new Message({
      chatId,
      senderId,
      files: [
        {
          public_id: fileUpload.public_id,
          url: fileUpload.secure_url,
          fileName: file.fileName,
          fileExtension,
        },
      ],
    });
    await message.save();

    res.status(201).json({ message: 'File message sent successfully' });
  } catch (error) {
    console.error('Error adding file message:', error);
    res.status(500).json({ error: error.message });
  }
};
