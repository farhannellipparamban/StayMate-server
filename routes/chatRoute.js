import express from "express";
import { ownerData, userChats, userData } from "../controllers/chatController.js";

const chatRoute = express.Router();

chatRoute.get("/ownerData/:id", ownerData);
chatRoute.get("/userData/:id", userData);
chatRoute.get("/:userId", userChats);

export default chatRoute;
