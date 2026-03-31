import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import http from "http";
import { initSocket } from "./socket";

import chatRoutes from "./routes/chat";
import authRoutes from "./routes/auth";
import tweetRoutes from "./routes/tweet";
import userRoutes from "./routes/user";
import replyRoutes from "./routes/reply";
import searchRoutes from "./routes/search";
import uploadRoutes from "./routes/upload";

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  next();
});

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/tweets", tweetRoutes);
app.use("/api/users", userRoutes);
app.use("/api/replies", replyRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT ?? 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) throw new Error("MONGO_URI is not defined in .env");

const httpServer = http.createServer(app);

const io = initSocket(httpServer);

app.set("io", io);

mongoose
  .connect(MONGO_URI)
  .then(() =>
    httpServer.listen(PORT, () =>
      console.log(`Server running on port http://localhost:${PORT}`),
    ),
  )
  .catch((err) => {
    console.error("Startup error:", err);
    process.exit(1);
  });
