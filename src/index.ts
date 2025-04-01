import express from "express";
import jwt from "jsonwebtoken";
import { ContentModel, UserModel, LinkModel } from "./db";
import { JWT_SECRET } from "./config";
//for middlware need cors
import { userMiddleware } from "./middleware";
import cors from "cors";
import { random } from "./utils";
import {z} from "zod"
const app = express();
app.use(express.json());
app.use(cors());

// Zod Schemas
const signupSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const signinSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const contentSchema = z.object({
  link: z.string().url(),
  type: z.string().min(1),
  title: z.string().min(1),
});
//signup
app.post("/api/v1/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues.map((issue) => issue.message).join(", "),
    });
  }
  const { username, password } = parsed.data;

  try {
    await UserModel.create({ username, password });
    res.json({ message: "User signed up" });
  } catch (e) {
    res.status(409).json({ message: "User already exists" });
  }
});

//signin
app.post("/api/v1/signin", async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues.map((issue) => issue.message).join(", "),
    });
  }
  const { username, password } = parsed.data;

  const existingUser = await UserModel.findOne({ username, password });
  if (existingUser) {
    const token = jwt.sign({ id: existingUser._id }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(403).json({ msg: "Incorrect credentials" });
  }
});

//add content
app.post("/api/v1/content", userMiddleware, async (req, res) => {
  const parsed = contentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues.map((issue) => issue.message).join(", "),
    });
  }
  const { link, type, title } = parsed.data;

  await ContentModel.create({
    link,
    type,
    title,
    userId: req.userId,
    tags: [],
  });
  res.json({ message: "Content added" });
});

//now get the content
app.get("/api/v1/content", userMiddleware, async (req, res) => {
  const userId = req.userId;
  const content = await ContentModel.find({ userId: userId }).populate(
    "userId",
    "username"
  );
  res.status(200).json({
    content,
  });
});

//delte the content
app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  const contentId = req.body.contentId;
  await ContentModel.deleteOne({
    _id: contentId,
    userId: req.userId,
  });
  res.status(200).json({
    msg: "Deleted",
  });
});

//Share Content Link
app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  const { share } = req.body;
  if (share) {
    const existingUser = await LinkModel.findOne({ userId: req.userId });
    if (existingUser) {
      res.status(200).json({ hash: existingUser.hash });
      return;
    }
    const hash = random(10);
    await LinkModel.create({ userId: req.userId, hash });
    res.status(200).json({ hash });
  } else {
    await LinkModel.deleteOne({ userId: req.userId });
    res.status(200).json({ message: "Removed Link" });
  }
});

//Get Shared Content
app.get("/api/v1/brain/:shareLink", async (req, res) => {
  const hash = req.params.shareLink;
  const link = await LinkModel.findOne({ hash });
  if (!link) {
    res.status(404).json({ message: "Invaild share link" });
    return;
  }
  const content = await ContentModel.find({ userId: link.userId });
  const user = await UserModel.findOne({ _id: link.userId });
  if(!user){
    res.status(404).json({message:"User not found"})
    return
  }
  res.json({
    username:user.username,
    content
  })
});

app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});
