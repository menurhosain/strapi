"use strict";

const crypto = require("crypto");

module.exports = (plugin) => {
  const originalUser = plugin.controllers.user;

  plugin.controllers.user = ({ strapi }) => {
    const base =
      typeof originalUser === "function"
        ? originalUser({ strapi })
        : originalUser;

    return {
      ...base,

      update: async (ctx) => {
        const { id } = ctx.params;
        const authenticatedUser = ctx.state.user;

        if (!authenticatedUser) {
          return ctx.unauthorized("You must be logged in.");
        }

        if (String(authenticatedUser.id) !== String(id)) {
          return ctx.forbidden("You can only update your own profile.");
        }

        const allowedFields = [
          "first_name",
          "last_name",
          "phone",
          "location",
          "profile_picture",
        ];

        const body = ctx.request.body;
        const filtered = {};
        for (const field of allowedFields) {
          if (Object.prototype.hasOwnProperty.call(body, field)) {
            filtered[field] = body[field];
          }
        }
        ctx.request.body = filtered;

        return base.update(ctx);
      },
    };
  };

  const originalAuth = plugin.controllers.auth;

  plugin.controllers.auth = ({ strapi }) => ({
    ...originalAuth({ strapi }),

    register: async (ctx) => {
      const {
        username,
        email,
        password,
        type,
        first_name,
        last_name,
        phone,
        location,
      } = ctx.request.body;

      // ── Required fields ──────────────────────────────────────────
      const missing = [];
      if (!username) missing.push("username");
      if (!email) missing.push("email");
      if (!password) missing.push("password");
      if (!type) missing.push("type");
      if (!first_name) missing.push("first_name");
      if (!phone) missing.push("phone");

      if (missing.length > 0) {
        return ctx.badRequest(
          `Missing required fields: ${missing.join(", ")}.`,
        );
      }

      // ── Type validation ──────────────────────────────────────────
      if (!["applicant", "contractor"].includes(type)) {
        return ctx.badRequest(
          "Invalid type. Must be 'applicant' or 'contractor'.",
        );
      }

      // ── minLength validation ─────────────────────────────────────
      if (username.length < 3) {
        return ctx.badRequest("username must be at least 3 characters.");
      }

      if (email.length < 6) {
        return ctx.badRequest("email must be at least 6 characters.");
      }

      if (password.length < 6) {
        return ctx.badRequest("password must be at least 6 characters.");
      }

      // ── Email format validation ──────────────────────────────────
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ctx.badRequest("email format is invalid.");
      }

      // ── Unique: email ────────────────────────────────────────────
      const existingEmail = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { email: email.toLowerCase() } });

      if (existingEmail) {
        return ctx.badRequest("Email is already taken.");
      }

      // ── Unique: username ─────────────────────────────────────────
      const existingUsername = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { username } });

      if (existingUsername) {
        return ctx.badRequest("Username is already taken.");
      }

      // ── Find role by type ────────────────────────────────────────
      const role = await strapi.db
        .query("plugin::users-permissions.role")
        .findOne({ where: { type } });

      if (!role) {
        return ctx.badRequest(`Role '${type}' not found.`);
      }

      if (type === "applicant") {
        // ── Create applicant user (unconfirmed until email is verified) ──
        const confirmationToken = crypto.randomBytes(20).toString("hex");

        const user = await strapi.service("plugin::users-permissions.user").add({
          username,
          email: email.toLowerCase(),
          password,
          first_name,
          last_name,
          phone,
          location,
          type,
          role: role.id,
          confirmed: false,
          confirmationToken,
          provider: "local",
        });

        // ── Send confirmation email ───────────────────────────────────
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const confirmationUrl = `${frontendUrl}/api/confirm-email?token=${confirmationToken}`;

        try {
          await strapi
            .plugin("email")
            .service("email")
            .send({
              to: user.email,
              subject: "Confirm your email address",
              html: `
                <p>Hi ${first_name},</p>
                <p>Please confirm your email address by clicking the link below:</p>
                <p><a href="${confirmationUrl}">Confirm Email</a></p>
                <p>If you did not create an account, you can safely ignore this email.</p>
              `,
            });
        } catch (emailError) {
          await strapi.db
            .query("plugin::users-permissions.user")
            .delete({ where: { id: user.id } });
          strapi.log.error("Failed to send confirmation email", emailError);
          return ctx.internalServerError(
            "Failed to send confirmation email. Please try again later.",
          );
        }

        return ctx.send({
          message:
            "A confirmation email has been sent to your email address. Please check your inbox.",
        });
      }

      // ── Create contractor user (auto-confirmed) ───────────────────
      const user = await strapi.service("plugin::users-permissions.user").add({
        username,
        email: email.toLowerCase(),
        password,
        first_name,
        last_name,
        phone,
        location,
        type,
        role: role.id,
        confirmed: true,
        provider: "local",
      });

      // ── Generate JWT ─────────────────────────────────────────────
      const jwt = strapi
        .service("plugin::users-permissions.jwt")
        .issue({ id: user.id });

      [
        "password",
        "resetPasswordToken",
        "confirmationToken",
        "confirmed",
        "blocked",
      ].forEach((cur) => {
        delete user[cur];
      });

      ctx.send({ jwt, user });
    },
  });

  return plugin;
};
