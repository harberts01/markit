import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { users, refreshTokens, marketManagers, markets } from "../models/schema.js";
import { authConfig } from "../config/auth.js";
import { AppError } from "../middleware/errorHandler.js";

export async function registerUser(
  username: string,
  email: string,
  password: string
) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError(409, "Username already taken");
  }

  const existingEmail = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingEmail.length > 0) {
    throw new AppError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, authConfig.bcryptRounds);

  const [user] = await db
    .insert(users)
    .values({
      username,
      email,
      passwordHash,
      displayName: username,
    })
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
    });

  return user;
}

export async function loginUser(username: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    throw new AppError(401, "Invalid username or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid username or password");
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);

  const managedMarkets = await db
    .select({ id: markets.id, name: markets.name, slug: markets.slug })
    .from(marketManagers)
    .innerJoin(markets, eq(marketManagers.marketId, markets.id))
    .where(eq(marketManagers.userId, user.id));

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      managedMarkets,
    },
  };
}

export async function refreshAccessToken(token: string) {
  const tokenHash = hashToken(token);

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!stored || new Date(stored.expiresAt) < new Date()) {
    if (stored) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
    }
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, stored.userId))
    .limit(1);

  if (!user) {
    throw new AppError(401, "User not found");
  }

  // Rotate refresh token
  await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));

  const accessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = await generateRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(token: string) {
  const tokenHash = hashToken(token);
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
}

function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, authConfig.jwtSecret, {
    expiresIn: authConfig.accessTokenExpiry as string,
  } as jwt.SignOptions);
}

async function generateRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(64).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + authConfig.refreshTokenExpiryMs);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return token;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
