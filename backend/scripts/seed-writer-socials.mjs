import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGO_URL);
const User = mongoose.connection.collection("users");

const ada = await User.updateOne(
  { name: "Ada", role: "writer" },
  {
    $set: {
      bio: "Writer covering learning, dignity, and community impact across GYGI programs.",
      socialLinks: {
        twitter: "https://twitter.com/girlsyougotit",
        linkedin: "https://www.linkedin.com/company/girls-youve-got-it",
        instagram: "https://www.instagram.com/girlsyougotit",
        website: "https://girlsyougotit.org",
        facebook: null,
      },
    },
  },
);

const uncle = await User.updateOne(
  { name: "uncle" },
  {
    $set: {
      bio: "GYGI editorial — stories of vocational skills, mentorship, and free excellent education.",
      socialLinks: {
        twitter: "https://twitter.com/girlsyougotit",
        linkedin: "https://www.linkedin.com/company/girls-youve-got-it",
        website: "https://girlsyougotit.org",
        instagram: "https://www.instagram.com/girlsyougotit",
        facebook: "https://www.facebook.com/girlsyougotit",
      },
    },
  },
);

console.log({ ada: ada.modifiedCount || ada.matchedCount, uncle: uncle.modifiedCount || uncle.matchedCount });

const writers = await User.find(
  { $or: [{ role: "writer" }, { name: "uncle" }] },
  { projection: { name: 1, bio: 1, socialLinks: 1, role: 1 } },
).toArray();
console.log(JSON.stringify(writers, null, 2));

await mongoose.disconnect();
