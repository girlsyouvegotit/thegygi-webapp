import { createContext } from "react";
import type { user, category } from "@/types";
import type { ImpersonationSession } from "@/lib/impersonation";

export type ImpersonationInfo = {
  active: boolean;
  mode: "act_as";
  actor: ImpersonationSession["actor"];
  watermark?: string;
  home?: string;
} | null;

export interface AuthContextType {
  user: user | null;
  setUser: React.Dispatch<React.SetStateAction<user | null>>;
  loading: boolean;
  categories: category[];
  impersonation: ImpersonationInfo;
  signIn: (email: string, password: string) => Promise<user>;
  signUp: (
    name: string,
    email: string,
    password: string,
    categoryId: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  beginImpersonation: (userId: string) => Promise<string>;
  endImpersonation: () => Promise<string>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
