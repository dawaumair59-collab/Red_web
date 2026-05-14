import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ADMIN_EMAIL = process.env["ADMIN_EMAIL"] ?? "";
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "";
const SESSION_SECRET = process.env["SESSION_SECRET"] ?? "fallback-secret-change-me";

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function signToken(payload: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");
}

function createToken(email: string): string {
  const expires = Date.now() + TOKEN_EXPIRY_MS;
  const payload = `${email}:${expires}`;
  const sig = signToken(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function verifyToken(token: string): { email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);

    const expectedSig = signToken(payload);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }

    const colonIdx = payload.lastIndexOf(":");
    const expires = Number(payload.slice(colonIdx + 1));
    if (Date.now() > expires) return null;

    const email = payload.slice(0, colonIdx);
    return { email };
  } catch {
    return null;
  }
}

router.post("/admin/auth/login", (req: Request, res: Response): void => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    logger.error("ADMIN_EMAIL or ADMIN_PASSWORD env vars not set");
    res.status(500).json({ error: "Admin credentials not configured" });
    return;
  }

  const emailMatch = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const passwordBuf = Buffer.from(password);
  const adminPasswordBuf = Buffer.from(ADMIN_PASSWORD);
  const passwordMatch =
    passwordBuf.length === adminPasswordBuf.length &&
    crypto.timingSafeEqual(passwordBuf, adminPasswordBuf);

  if (!emailMatch || !passwordMatch) {
    logger.warn({ email }, "Failed admin login attempt");
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = createToken(email);
  logger.info({ email }, "Admin logged in");
  res.json({ token, email });
});

router.get("/admin/auth/verify", (req: Request, res: Response): void => {
  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  res.json({ email: payload.email });
});

export { verifyToken };
export default router;
