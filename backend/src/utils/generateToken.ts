import jwt from "jsonwebtoken";
import { type Response } from "express";

export const generateToken = (userId: string, res: Response) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
    algorithm: "HS512",
  });

  // attach token to http-only cookie
  res.cookie("jwt", token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      (process.env.CLIENT_URL || "").startsWith("https://"),
    sameSite:
      process.env.NODE_ENV === "production" ||
      (process.env.CLIENT_URL || "").startsWith("https://")
        ? "none"
        : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/", // cookie valid for entire site
  });
};
