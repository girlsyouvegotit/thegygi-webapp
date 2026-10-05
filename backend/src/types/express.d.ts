import { IUser } from "../models/user.model.js";
import { IRecording } from "../models/recording.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
      recording?: IRecording;
    }
  }
}

export {};
