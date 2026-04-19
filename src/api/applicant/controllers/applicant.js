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
  }),
);
