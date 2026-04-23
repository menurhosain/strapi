"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

async function assertContractor(ctx, strapi) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.unauthorized("Login required");
  }

  const fullUser = await strapi.db
    .query("plugin::users-permissions.user")
    .findOne({ where: { id: user.id }, populate: ["role"] });

  if (!fullUser?.role || fullUser.role.type !== "contractor") {
    return ctx.forbidden("Only contractors can access this resource");
  }

  return user;
}

module.exports = createCoreController(
  "api::subcontractor.subcontractor",
  ({ strapi }) => ({
    async create(ctx) {
      const user = await assertContractor(ctx, strapi);
      if (!user) return;

      const { companyName, email, phone, documents, experienceYears, location } =
        ctx.request.body.data ?? {};

      const entity = await strapi.entityService.create(
        "api::subcontractor.subcontractor",
        {
          data: {
            companyName,
            email,
            phone,
            documents,
            experienceYears,
            location,
            appliedAt: new Date(),
            user: user.id,
          },
        },
      );

      return this.transformResponse(entity);
    },

    async find(ctx) {
      const user = await assertContractor(ctx, strapi);
      if (!user) return;

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
