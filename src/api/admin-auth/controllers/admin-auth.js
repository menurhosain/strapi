"use strict";

const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");

const REFRESH_COOKIE_NAME = "strapi_admin_refresh";
const DEFAULT_IDLE_REFRESH_SECONDS = 14 * 24 * 60 * 60; // 14 days

function buildRefreshCookieOptions(absoluteExpiresAtISO, secureRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const configuredSecure = strapi.config.get("admin.auth.cookie.secure");
  const domain =
    strapi.config.get("admin.auth.cookie.domain") ||
    strapi.config.get("admin.auth.domain");
  const path = strapi.config.get("admin.auth.cookie.path") || "/admin";
  const sameSite = strapi.config.get("admin.auth.cookie.sameSite") || "lax";

  let secure;
  if (typeof configuredSecure === "boolean") {
    secure = configuredSecure;
  } else {
    secure = isProduction && Boolean(secureRequest);
  }

  const idleExpiry = Date.now() + DEFAULT_IDLE_REFRESH_SECONDS * 1000;
  const absoluteExpiry = absoluteExpiresAtISO
    ? new Date(absoluteExpiresAtISO).getTime()
    : idleExpiry;
  const expiresAt = new Date(Math.min(idleExpiry, absoluteExpiry));

  return {
    httpOnly: true,
    secure,
    overwrite: true,
    domain,
    path,
    sameSite,
    expires: expiresAt,
    maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
  };
}

module.exports = {
  async googleLogin(ctx) {
    const { credential } = ctx.request.body;

    if (!credential) {
      return ctx.badRequest("Missing Google credential.");
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return ctx.unauthorized("Invalid or expired Google token.");
    }

    const { email } = payload;

    const adminUser = await strapi.db.query("admin::user").findOne({
      where: { email },
      populate: ["roles"],
    });

    if (!adminUser) {
      return ctx.unauthorized(
        "No admin account is associated with this Google account.",
      );
    }

    if (!adminUser.isActive) {
      return ctx.unauthorized("This admin account is inactive.");
    }

    // Strapi v5 uses a session manager — tokens must carry a sessionId or they
    // fail auth (strategies/admin.js checks validateAccessToken + isSessionActive)
    const sessionManager = strapi.sessionManager;
    if (!sessionManager) {
      strapi.log.error("strapi.sessionManager is not available");
      return ctx.internalServerError();
    }

    try {
      const userId = String(adminUser.id);
      const deviceId = crypto.randomUUID();

      const { token: refreshToken, absoluteExpiresAt } = await sessionManager(
        "admin",
      ).generateRefreshToken(userId, deviceId, { type: "refresh" });

      ctx.cookies.set(
        REFRESH_COOKIE_NAME,
        refreshToken,
        buildRefreshCookieOptions(absoluteExpiresAt, ctx.request.secure),
      );

      const accessResult =
        await sessionManager("admin").generateAccessToken(refreshToken);
      if ("error" in accessResult) {
        strapi.log.error("generateAccessToken failed", accessResult.error);
        return ctx.internalServerError();
      }

      const { token: accessToken } = accessResult;

      ctx.send({
        data: {
          token: accessToken,
          user: {
            id: adminUser.id,
            email: adminUser.email,
            firstname: adminUser.firstname,
            lastname: adminUser.lastname,
            isActive: adminUser.isActive,
            roles: adminUser.roles,
          },
        },
      });
    } catch (error) {
      strapi.log.error("Failed to create admin Google OAuth session", error);
      return ctx.internalServerError();
    }
  },
};
