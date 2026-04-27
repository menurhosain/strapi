"use strict";

const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

module.exports = {
  async googleLogin(ctx) {
    const { credential } = ctx.request.body;

    if (!credential) {
      return ctx.badRequest("Missing Google credential.");
    }

    // Verify the Google ID token
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

    // Find matching Strapi admin user
    const adminUser = await strapi.db.query("admin::user").findOne({
      where: { email },
      populate: ["roles"],
    });

    if (!adminUser) {
      return ctx.unauthorized("No admin account is associated with this Google account.");
    }

    if (!adminUser.isActive) {
      return ctx.unauthorized("This admin account is inactive.");
    }

    // Issue admin JWT using the same secret Strapi uses internally
    const secret = strapi.config.get("admin.auth.secret");
    const token = jwt.sign({ id: adminUser.id }, secret, { expiresIn: "1d" });

    ctx.send({
      data: {
        token,
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
  },
};
