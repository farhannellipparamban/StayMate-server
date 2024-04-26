import express from "express";
import cors from "cors";
import http from "http";
import userRoute from "./routes/userRoute.js";
import ownerRoute from "./routes/ownerRoute.js";
import adminRoute from "./routes/adminRoute.js";
import dbConnect from "./config/mongodb.js";
import chatRoute from "./routes/chatRoute.js";
import messageRoute from "./routes/messageRoute.js";
import socketConnection from "./sockeIo.js";
import dotenv from "dotenv"

dotenv.config()
dbConnect();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: "https://staymate.vercel.app",
    methods: ["GET", "POST", "PUT", "PATCH", 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true, limit: 100000000000 }));
app.use(express.json({ limit: 100000000000 }));


app.use(express.static('public'));

app.use("/", userRoute);
app.use("/owner", ownerRoute);
app.use('/admin',adminRoute)
app.use('/chat',chatRoute)
app.use('/message',messageRoute)

const server = http.createServer(app)
socketConnection(server)

server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
