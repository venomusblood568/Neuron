import mongoose, { model, Schema } from "mongoose";

//connect th mongoose
mongoose
  .connect("mongodb://localhost:27017/neuron")
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
  title:String,
  link:String,
  type:String,
  tags:[{
    type:mongoose.Types.ObjectId,
    ref:"tag"
  }],
  userId:[{
    type:mongoose.Types.ObjectId,
    ref:"User",
    required:true
  }]
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