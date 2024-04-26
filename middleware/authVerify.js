import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Owner from "../models/ownerModel.js";
import dotenv from "dotenv";

dotenv.config();

const userSecret = process.env.USER_SECRET;
const ownerSecret = process.env.OWNER_SECRET;
const adminSecret = process.env.ADMIN_SECRET;

export const userTokenVerify = async (req, res, next) => {
  try {
    let token = req.headers.autherization;
    if (!token) {
      return res.status(403).json({ message: "Access Denide" });
    }
    if (token.startsWith("Bearer")) {
      token = token.slice(7, token.length).trimLeft();
    }
    const verified = jwt.verify(token, userSecret);
    req.user = verified;
    if (verified.role == "user") {
      const user = await User.findOne({ email: verified.email });
      if (user.isBlocked) {
        return res.status(403).json({ message: "User is blocked" });
      } else {
        next();
      }
    } else {
      return res.status(403).json({ message: "Access Denied" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

export const ownerTokenVerify = async (req, res, next) => {
  try {
    let token = req.headers.autherization;
    if (!token) {
      return res.status(403).json({ message: "Access Denied" });
    }
    if (token.startsWith("Bearer")) {
      token = token.slice(7, token.length).trimLeft();
    }
    const verified = jwt.verify(token, ownerSecret);
    req.owner = verified;
    if (verified.role == "owner") {
      const owner = await Owner.findOne({ email: verified.email });
      if (owner.isBlocked) {
        return res.status(403).json({ message: "Owner Is Blocked" });
      } else {
        next();
      }
    } else {
      return res.status(403).json({ message: "Access Denied" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

export const adminTokenVerify = async (req, res, next) => {
  try {
    let token = req.headers.autherization;
    if (!token) {
      return res.status(403).json({ message: "Access Denied" });
    }
    if (token.startsWith("Bearer")) {
      token = token.slice(7, token.length).trimLeft();
    }
    const verified = jwt.verify(token, adminSecret);
    req.admin = verified;
    if (verified.role == "admin") {
      next();
    } else {
      return res.status(403).json({ message: "Access Denied" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
