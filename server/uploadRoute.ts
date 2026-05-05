// Product image upload route — uses multer (memory storage) + storagePut
import { Router } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export function registerUploadRoute(app: Router) {
  app.post(
    "/api/upload-product-image",
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: "No file provided" });
          return;
        }
        const ext = req.file.originalname.split(".").pop() ?? "jpg";
        const key = `product-images/${Date.now()}.${ext}`;
        const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
        res.json({ url });
      } catch (err) {
        console.error("[Upload] Error:", err);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );
}
