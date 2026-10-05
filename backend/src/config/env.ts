import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

// Define environment schema
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("5000"),
  MONGO_URL: z.string().min(1, "MONGO_URL is required"),
  JWT_SECRET: z.string().min(10, "JWT_SECRET must be at least 10 characters"),
  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL"),

  // Google AI
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),

  // Email
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_SECURE: z.string().optional(),

  // Cloud Storage
  STORAGE_PROVIDER: z.enum(["local", "cloudinary", "aws-s3"]).default("local"),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),

  // Socket.io
  SOCKET_CORS_ORIGIN: z.string().optional(),

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // Inngest
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // Recording
  RECORDING_STORAGE_PATH: z.string().default("./recordings"),
  MAX_RECORDING_DURATION: z.string().default("10800"), // 3 hours in seconds

  // Rate Limiting — SPA dashboards issue many parallel requests; 100/15m is too low
  RATE_LIMIT_WINDOW_MS: z.string().default("900000"), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default("2000"),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:");
  parsedEnv.error.errors.forEach((error) => {
    console.error(`  - ${error.path.join(".")}: ${error.message}`);
  });
  process.exit(1);
}

// Export typed environment
export const env = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parseInt(parsedEnv.data.PORT, 10),
  mongoUrl: parsedEnv.data.MONGO_URL,
  jwtSecret: parsedEnv.data.JWT_SECRET,
  clientUrl: parsedEnv.data.CLIENT_URL,

  googleAIKey: parsedEnv.data.GOOGLE_GENERATIVE_AI_API_KEY,

  email: {
    host: parsedEnv.data.EMAIL_HOST,
    port: parseInt(parsedEnv.data.EMAIL_PORT || "587", 10),
    user: parsedEnv.data.EMAIL_USER,
    pass: parsedEnv.data.EMAIL_PASS,
    from: parsedEnv.data.EMAIL_FROM,
    secure: parsedEnv.data.EMAIL_SECURE === "true",
  },

  storage: {
    provider: parsedEnv.data.STORAGE_PROVIDER,
    bucket: parsedEnv.data.STORAGE_BUCKET,
    region: parsedEnv.data.STORAGE_REGION,
    accessKey: parsedEnv.data.STORAGE_ACCESS_KEY,
    secretKey: parsedEnv.data.STORAGE_SECRET_KEY,
    cloudinaryCloudName: parsedEnv.data.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: parsedEnv.data.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: parsedEnv.data.CLOUDINARY_API_SECRET,
    uploadthingToken: parsedEnv.data.UPLOADTHING_TOKEN,
    recordingPath: parsedEnv.data.RECORDING_STORAGE_PATH,
    maxRecordingDuration: parseInt(parsedEnv.data.MAX_RECORDING_DURATION, 10),
  },

  socket: {
    // May be a single origin or comma-separated list; HTTP + Socket share parsing.
    corsOrigin: parsedEnv.data.SOCKET_CORS_ORIGIN || parsedEnv.data.CLIENT_URL,
  },

  vapid: {
    publicKey: parsedEnv.data.VAPID_PUBLIC_KEY || "",
    privateKey: parsedEnv.data.VAPID_PRIVATE_KEY || "",
    subject: parsedEnv.data.VAPID_SUBJECT || "mailto:ops@gygi.org",
  },

  inngest: {
    eventKey: parsedEnv.data.INNGEST_EVENT_KEY,
    signingKey: parsedEnv.data.INNGEST_SIGNING_KEY,
  },

  rateLimit: {
    windowMs: parseInt(parsedEnv.data.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(parsedEnv.data.RATE_LIMIT_MAX_REQUESTS, 10),
  },
} as const;

export default env;
