/**
 * Promote an existing user to super_admin.
 *
 * Usage (from backend/):
 *   npx tsx src/scripts/promote-super-admin.ts user@email.com
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User, {
  ALL_SUPER_ADMIN_CAPABILITIES,
} from "../models/user.model.js";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx src/scripts/promote-super-admin.ts <email>");
    process.exit(1);
  }

  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  user.role = "super_admin";
  user.capabilities = [...ALL_SUPER_ADMIN_CAPABILITIES];
  user.isActive = true;
  await user.save();

  console.log(`✓ ${user.email} is now super_admin`);
  console.log(`  capabilities: ${user.capabilities.join(", ")}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
