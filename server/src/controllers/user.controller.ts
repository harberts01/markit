import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db } from "../config/database.js";
import { users, marketManagers, markets } from "../models/schema.js";
import { AppError } from "../middleware/errorHandler.js";

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const managedMarkets = await db
      .select({ id: markets.id, name: markets.name, slug: markets.slug })
      .from(marketManagers)
      .innerJoin(markets, eq(marketManagers.marketId, markets.id))
      .where(eq(marketManagers.userId, req.user!.userId));

    res.json({ data: { ...user, managedMarkets } });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { displayName, avatarUrl } = req.body;

    const [user] = await db
      .update(users)
      .set({
        ...(displayName !== undefined && { displayName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.userId))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        role: users.role,
      });

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "currentPassword and newPassword are required" });
      return;
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }

    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);

    if (!user) throw new AppError(404, "User not found");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError(401, "Current password is incorrect");

    const hash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, req.user!.userId));

    res.json({ data: { changed: true } });
  } catch (error) {
    next(error);
  }
}
