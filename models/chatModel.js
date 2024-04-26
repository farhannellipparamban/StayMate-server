import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    members:{
        type:Array,
    },
},{timestamps:true})

export default mongoose.model("chat",chatSchema)