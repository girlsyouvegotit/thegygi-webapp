export interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  token: string;
  expiresIn: number;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "tutor" | "mentor" | "writer" | "admin" | "super_admin";
}

export type UserRole =
  | "student"
  | "tutor"
  | "mentor"
  | "writer"
  | "admin"
  | "super_admin";
