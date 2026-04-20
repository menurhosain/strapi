"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::applicant.applicant",
  ({ strapi }) => ({
    async create(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("Login required");
      }

      const body = ctx.request.body;

      const entity = await strapi.entityService.create(
        "api::applicant.applicant",
        {
          data: { ...body.data, user: user.id },
        },
      );

      return this.transformResponse(entity);
    },

    async find(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("Login required");
      }

      // Ignore incoming filters from client (important)
      const { query } = ctx;

      const data = await strapi.entityService.findMany(
        "api::applicant.applicant",
        {
          ...query, // keep pagination, populate, etc.
          filters: {
            user: {
              id: user.id,
            },
          },
        },
      );

      return this.transformResponse(data);
    },
  }),
);
