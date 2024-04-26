import express from "express";
import {
  addAudioMessage,
  addMessage,
  fileSendingMessage,
  getMessages,
  imageSendingMessage,
  videoSendingMessage,
} from "../controllers/messageController.js";

const messageRoute = express.Router();

messageRoute.post("/", addMessage);
messageRoute.get("/:chatId", getMessages);
messageRoute.post("/audioMessage", addAudioMessage);
messageRoute.post("/imageMessage", imageSendingMessage);
messageRoute.post("/videoMessage", videoSendingMessage);
messageRoute.post("/fileMessage", fileSendingMessage);
export default messageRoute;
