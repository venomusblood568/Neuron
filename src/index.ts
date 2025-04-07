import express from "express";
import jwt from "jsonwebtoken";
import { ContentModel, UserModel, LinkModel } from "./db";
import { JWT_SECRET } from "./config";
//for middlware need cors
import { userMiddleware } from "./middleware";
import cors from "cors";
import { random } from "./utils";
import { Request, Response } from "express";
const app = express();
app.use(express.json());
app.use(cors());

//signup
app.post("/api/v1/signup", async (req: Request, res: Response) => {
  // TODO: Use zod
  // TODO: Hash the password before storing it in the database.
  const username = req.body.username;
  const password = req.body.password;

  try {
    await UserModel.create({ username, password });
    console.log(`username: ${username} and password:${password}`);
    res.json({ message: "User signed up" });
  } catch (e) {
    res.status(409).json({ message: "User already exists" });
  }
});

//signin
app.post("/api/v1/signin", async (req: Request, res: Response) => {
  const username = req.body.username;
  const password = req.body.password;

  const existingUser = await UserModel.findOne({ username, password });
  if (existingUser) {
    const token = jwt.sign(
      {
        id: existingUser._id,
      },
      JWT_SECRET
    );
    res.json({ token });
  } else {
    res.status(403).json({
      msg: "Incorrect credentials",
    });
  }
});

//add content
app.post(
  "/api/v1/content",
  userMiddleware,
  async (req: Request, res: Response) => {
    const { link, type, title, tag } = req.body;

    await ContentModel.create({
      link,
      type,
      title,
      tag,
      userId: req.userId,
    });
    res.json({ message: "Content added" });
  }
);

//now get the content
app.get(
  "/api/v1/content",
  userMiddleware,
  async (req: Request, res: Response) => {
    const content = await ContentModel.find({ userId: req.userId })
      .select("link type title tag createdAt")
      .populate("userId", "username");

    res.status(200).json({ content });
  }
);

//delte the content
app.delete(
  "/api/v1/content",
  userMiddleware,
  async (req: Request, res: Response) => {
    const contentId = req.body.contentId;
    await ContentModel.deleteOne({
      _id: contentId,
      userId: req.userId,
    });
    res.status(200).json({
      msg: "Deleted",
    });
  }
);

//Share Content Link
app.post(
  "/api/v1/brain/share",
  userMiddleware,
  async (req: Request, res: Response) => {
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
  }
);

//Get Shared Content
app.get("/api/v1/brain/:shareLink", async (req: Request, res: Response) => {
  const hash = req.params.shareLink;
  const link = await LinkModel.findOne({ hash });
  if (!link) {
    res.status(404).json({ message: "Invaild share link" });
    return;
  }
  const content = await ContentModel.find({ userId: link.userId }).select(
    "link type title tag createdAt"
  );
  const user = await UserModel.findOne({ _id: link.userId });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({
    username: user.username,
    content,
  });
});

app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});
