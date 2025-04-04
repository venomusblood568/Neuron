"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const config_1 = require("./config");
//for middlware need cors
const middleware_1 = require("./middleware");
const cors_1 = __importDefault(require("cors"));
const utils_1 = require("./utils");
const zod_1 = require("zod");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Zod Schemas
const signupSchema = zod_1.z.object({
    username: zod_1.z.string().min(3),
    password: zod_1.z.string().min(6),
});
const signinSchema = zod_1.z.object({
    username: zod_1.z.string().min(3),
    password: zod_1.z.string().min(6),
});
const contentSchema = zod_1.z.object({
    link: zod_1.z.string().url(),
    type: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
});
//signup
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: parsed.error.issues.map((issue) => issue.message).join(", "),
        });
    }
    const { username, password } = parsed.data;
    try {
        yield db_1.UserModel.create({ username, password });
        res.json({ message: "User signed up" });
    }
    catch (e) {
        res.status(409).json({ message: "User already exists" });
    }
}));
//signin
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: parsed.error.issues.map((issue) => issue.message).join(", "),
        });
    }
    const { username, password } = parsed.data;
    const existingUser = yield db_1.UserModel.findOne({ username, password });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({ id: existingUser._id }, config_1.JWT_SECRET);
        res.json({ token });
    }
    else {
        res.status(403).json({ msg: "Incorrect credentials" });
    }
}));
//add content
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = contentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: parsed.error.issues.map((issue) => issue.message).join(", "),
        });
    }
    const { link, type, title } = parsed.data;
    yield db_1.ContentModel.create({
        link,
        type,
        title,
        userId: req.userId,
        tags: [],
    });
    res.json({ message: "Content added" });
}));
//now get the content
app.get("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const content = yield db_1.ContentModel.find({ userId: userId }).populate("userId", "username");
    res.status(200).json({
        content,
    });
}));
//delte the content
app.delete("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contentId = req.body.contentId;
    yield db_1.ContentModel.deleteOne({
        _id: contentId,
        userId: req.userId,
    });
    res.status(200).json({
        msg: "Deleted",
    });
}));
//Share Content Link
app.post("/api/v1/brain/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { share } = req.body;
    if (share) {
        const existingUser = yield db_1.LinkModel.findOne({ userId: req.userId });
        if (existingUser) {
            res.status(200).json({ hash: existingUser.hash });
            return;
        }
        const hash = (0, utils_1.random)(10);
        yield db_1.LinkModel.create({ userId: req.userId, hash });
        res.status(200).json({ hash });
    }
    else {
        yield db_1.LinkModel.deleteOne({ userId: req.userId });
        res.status(200).json({ message: "Removed Link" });
    }
}));
//Get Shared Content
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.shareLink;
    const link = yield db_1.LinkModel.findOne({ hash });
    if (!link) {
        res.status(404).json({ message: "Invaild share link" });
        return;
    }
    const content = yield db_1.ContentModel.find({ userId: link.userId });
    const user = yield db_1.UserModel.findOne({ _id: link.userId });
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    res.json({
        username: user.username,
        content
    });
}));
app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});
