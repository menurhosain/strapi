"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::project.project", ({ strapi }) => ({
    async adjacent(ctx) {
        const { slug } = ctx.params;
        const locale = ctx.query.locale ?? "en";

        const current = await strapi.documents("api::project.project").findFirst({
            filters: { slug: { $eq: slug } },
            locale,
            status: "published",
        });

        if (!current) {
            return ctx.notFound("Project not found");
        }

        const pick = (doc) =>
            doc ? { slug: doc.slug, title: doc.title, documentId: doc.documentId } : null;

        const [prev, next] = await Promise.all([
            strapi.documents("api::project.project").findFirst({
                filters: { createdAt: { $lt: current.createdAt } },
                sort: { createdAt: "desc" },
                locale,
                status: "published",
            }),
            strapi.documents("api::project.project").findFirst({
                filters: { createdAt: { $gt: current.createdAt } },
                sort: { createdAt: "asc" },
                locale,
                status: "published",
            }),
        ]);

        ctx.body = { prev: pick(prev), next: pick(next) };
    },
}));
