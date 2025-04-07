import mongoose, { model, Schema } from "mongoose";
import dotenv from "dotenv";
dotenv.config();
//connect th mongoose
mongoose  
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

//USER SCHEMA
const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: String,
});

export const UserModel = model("User", UserSchema);

//CONTENT SCHEMA
const contentSchema = new Schema({
  title: String,
  link: String,
  type: String,
  tag: String,
  userId: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
});

export const ContentModel = model('Content',contentSchema)

//LINK SCHEMA
const LinkSchema = new Schema({
  hash:String,
  userId:{ 
    type: mongoose.Types.ObjectId, 
    ref: "User",
    required:true,
    unique:true },
});

export const LinkModel = model("Links",LinkSchema)