"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::subcontractor.subcontractor",
  ({ strapi }) => ({
    async create(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("Login required");
      }

      const body = ctx.request.body;

      const entity = await strapi.entityService.create(
        "api::subcontractor.subcontractor",
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

      const { query } = ctx;

      const data = await strapi.entityService.findMany(
        "api::subcontractor.subcontractor",
        {
          ...query,
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
