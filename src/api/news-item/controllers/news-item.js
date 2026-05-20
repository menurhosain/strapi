"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::news-item.news-item", ({ strapi }) => ({
    async adjacent(ctx) {
        const { slug } = ctx.params;
        const locale = ctx.query.locale ?? "en";

        const current = await strapi.documents("api::news-item.news-item").findFirst({
            filters: { slug: { $eq: slug } },
            locale,
            status: "published",
        });

        if (!current) {
            return ctx.notFound("News item not found");
        }

        const pick = (doc) =>
            doc ? { slug: doc.slug, title: doc.title, documentId: doc.documentId } : null;

        const [prev, next] = await Promise.all([
            strapi.documents("api::news-item.news-item").findFirst({
                filters: { publishedAt: { $lt: current.publishedAt } },
                sort: { publishedAt: "desc" },
                locale,
                status: "published",
            }),
            strapi.documents("api::news-item.news-item").findFirst({
                filters: { publishedAt: { $gt: current.publishedAt } },
                sort: { publishedAt: "asc" },
                locale,
                status: "published",
            }),
        ]);

        ctx.body = { prev: pick(prev), next: pick(next) };
    },
}));
