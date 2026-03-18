import dotenv from "dotenv";

dotenv.config();

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
  accessTokenExpiry: "15m",
  refreshTokenExpiry: "7d",
  refreshTokenExpiryMs: 7 * 24 * 60 * 60 * 1000,
  bcryptRounds: 12,
};
