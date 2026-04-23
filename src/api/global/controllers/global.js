'use strict';

/**
 * @openapi
 * tags:
 *   - name: Global
 *     description: Global site settings (single type)
 *
 * components:
 *   schemas:
 *     GlobalInput:
 *       type: object
 *       required: [siteName, siteDescription]
 *       properties:
 *         siteName:
 *           type: string
 *           example: "My Site"
 *         siteDescription:
 *           type: string
 *           example: "A headless CMS powered site"
 *         favicon:
 *           type: integer
 *           description: Strapi media file ID
 *         defaultSeo:
 *           type: object
 *           description: Shared SEO component
 *           properties:
 *             metaTitle:
 *               type: string
 *             metaDescription:
 *               type: string
 *             shareImage:
 *               type: integer
 *
 * /api/global:
 *   get:
 *     tags: [Global]
 *     summary: Get global settings
 *     parameters:
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *         example: "favicon,defaultSeo.shareImage"
 *     responses:
 *       200:
 *         description: Global settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     attributes:
 *                       $ref: '#/components/schemas/GlobalInput'
 *                 meta:
 *                   type: object
 *
 *   put:
 *     tags: [Global]
 *     summary: Update global settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 $ref: '#/components/schemas/GlobalInput'
 *     responses:
 *       200:
 *         description: Settings updated
 *       403:
 *         description: Forbidden
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::global.global');
