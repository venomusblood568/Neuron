import express, { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { UserModel } from "./db";

const app = express();
app.use(express.json())

app.post("/api/v1/signup", async (req, res) => {
  // TODO: Use zod
  // TODO: Hash the password before storing it in the database.
  const username = req.body.username;
  const password = req.body.password;

  try {
    await UserModel.create({ username, password });
    console.log(`username: ${username} and password:${password}`)
    res.json({ message: "User signed up" });
  } catch (e) {
    res.status(409).json({ message: "User already exists" });
  }
});

app.post("/api/v1/signin", (req, res) => {});
app.post("/api/v1/content", (req, res) => {});
app.get("/api/v1/content", (req, res) => {});
app.delete("/api/v1/content", (req, res) => {});
app.post("/api/v1/brain/share", (req, res) => {});
app.get("/api/v1/brain/shareLink", (req, res) => {});

app.listen(3000)