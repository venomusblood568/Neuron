import mongoose, { model, Schema } from "mongoose";

//connect th mongoose
mongoose
  .connect("mongodb://localhost:27017/neuron")
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));
const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: String,
});

export const UserModel = model("User", UserSchema);
