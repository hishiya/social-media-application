import { Router } from "express";

import { uploadFile } from "../controllers/upload";
import { authMiddleware } from "../middlewares/auth";

import { upload } from "../utils/upload";

const router = Router();

router.post("/", authMiddleware, upload.single("file"), uploadFile);

export default router;
