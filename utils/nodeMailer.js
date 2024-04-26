import Otp from "../models/otpModel.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const sendMailOtp = async (name, email, userId) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });
    let otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    const options = {
      from: process.env.USER_EMAIL,
      to: email,
      subject: "for email verification",
      html: `
      <div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2">
        <div style="margin: 50px auto; width: 70%; padding: 20px 0">
          <div style="border-bottom: 1px solid #eee">
            <a href="" style="font-size: 1.4em; color: red; text-decoration: none; font-weight: 600">
              StayMate
            </a>
          </div>
          <p style="font-size: 1.1em">Hi,${name}</p>
          <p>Thank you for choosing StayMate. Use the following OTP to complete your Sign Up procedures. OTP is valid for a few minutes</p>
          <h2 style="background: red; margin: 0 auto; width: max-content; padding: 0 10px; color: white; border-radius: 4px;">
            ${otp}
          </h2>
          <p style="font-size: 0.9em;">Regards,<br />StayMate</p>
          <hr style="border: none; border-top: 1px solid #eee" />
          <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300">
            <p>StayMate</p>
            <p>1600 Ocean Of Heaven</p>
            <p>Pacific</p>
          </div>
        </div>
      </div>
    `,
    };
    const verificationOtp = new Otp({
      userId: userId,
      otp: otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000,
    });
    let verified = await verificationOtp.save();
    transporter.sendMail(options, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(otp);
        console.log("email has been sent to :-", info.response);
      }
    });
    return verified._id;
  } catch (error) {
    console.log(error.message);
  }
};

export default sendMailOtp;
