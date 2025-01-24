import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";

export const userMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    const header = req.headers["authorization"]
    const decoded = jwt.verify(header as string, JWT_SECRET)
    if(decoded){
        //have to make custom class for userId => override.d.ts
        // @ts-ignore
        req.userId = decoded.id;
        next()
    }else{
        res.status(401).json({msg:"Unauthorized User"})
    }
};
