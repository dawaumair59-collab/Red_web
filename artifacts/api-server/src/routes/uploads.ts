import { Router, type IRouter } from "express";
import crypto from "crypto";
import { GetUploadSignatureBody } from "@workspace/api-zod";

const router: IRouter = Router();

const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

router.post("/uploads/sign", async (req, res): Promise<void> => {
  const parsed = GetUploadSignatureBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = parsed.data.folder;

  const toSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  res.json({
    signature,
    timestamp,
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    folder,
  });
});

export default router;
