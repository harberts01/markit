import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { authenticate } from "../middleware/authenticate.js";

const uploadDir = process.env.UPLOAD_DIR || "./uploads";

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomBytes(16).toString("hex");
    cb(null, `${name}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const router = Router();

router.post(
  "/image",
  authenticate,
  upload.single("image"),
  (req: Request, res: Response, _next: NextFunction) => {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ data: { url, filename: req.file.filename } });
  }
);

export default router;
