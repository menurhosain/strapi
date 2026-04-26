"use strict";

/**
 * @openapi
 * tags:
 *   - name: Subcontractors
 *     description: Subcontractor profiles (contractor role required)
 *
 * components:
 *   schemas:
 *     SubcontractorInput:
 *       type: object
 *       required: [companyName, email, label]
 *       properties:
 *         companyName:
 *           type: string
 *           example: "Acme Construction Ltd"
 *         email:
 *           type: string
 *           format: email
 *           example: contact@acme.com
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         documents:
 *           type: array
 *           items:
 *             type: integer
 *           description: Strapi media file IDs
 *         experienceYears:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           example: 5
 *         location:
 *           type: string
 *           example: "Chicago"
 *         label:
 *           type: string
 *           enum: [New, Approved, Contacted, Rejected]
 *           default: New
 *         adminNotes:
 *           type: string
 *
 *     SubcontractorResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             attributes:
 *               allOf:
 *                 - $ref: '#/components/schemas/SubcontractorInput'
 *                 - type: object
 *                   properties:
 *                     appliedAt:
 *                       type: string
 *                       format: date-time
 *         meta:
 *           type: object
 *
 * /api/subcontractors:
 *   post:
 *     tags: [Subcontractors]
 *     summary: Register a new subcontractor
 *     description: Only users with the `contractor` role can create a subcontractor entry. `appliedAt`, `label`, and `adminNotes` are set automatically by the server.
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
 *                 type: object
 *                 required: [companyName, email]
 *                 properties:
 *                   companyName:
 *                     type: string
 *                     example: "Acme Construction Ltd"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: contact@acme.com
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   documents:
 *                     type: array
 *                     items:
 *                       type: integer
 *                     description: Strapi media file IDs
 *                   experienceYears:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 100
 *                     example: 5
 *                   location:
 *                     type: string
 *                     example: "Chicago"
 *     responses:
 *       200:
 *         description: Subcontractor created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubcontractorResponse'
 *       401:
 *         description: Login required
 *       403:
 *         description: Only contractors can access this resource
 *
 *   get:
 *     tags: [Subcontractors]
 *     summary: List subcontractors for the authenticated contractor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pagination[page]
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: pagination[pageSize]
 *         schema:
 *           type: integer
 *         example: 25
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *         example: documents
 *     responses:
 *       200:
 *         description: List of subcontractors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubcontractorInput'
 *                 meta:
 *                   type: object
 *       401:
 *         description: Login required
 *       403:
 *         description: Only contractors can access this resource
 *
 * /api/subcontractors/{id}:
 *   get:
 *     tags: [Subcontractors]
 *     summary: Get a single subcontractor by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subcontractor found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubcontractorResponse'
 *       404:
 *         description: Not found
 *
 *   put:
 *     tags: [Subcontractors]
 *     summary: Update a subcontractor
 *     description: Only the fields below can be updated. `label` and `adminNotes` are managed by the admin panel.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   companyName:
 *                     type: string
 *                     example: "Acme Construction Ltd"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: contact@acme.com
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   documents:
 *                     type: array
 *                     items:
 *                       type: integer
 *                     description: Strapi media file IDs
 *                   experienceYears:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 100
 *                     example: 5
 *                   location:
 *                     type: string
 *                     example: "Chicago"
 *     responses:
 *       200:
 *         description: Subcontractor updated
 *       401:
 *         description: Login required
 *       403:
 *         description: Only contractors can access this resource
 *       404:
 *         description: Not found
 */

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

      const {
        companyName,
        email,
        phone,
        documents,
        experienceYears,
        location,
      } = ctx.request.body.data ?? {};

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

    async findOne(ctx) {
      const user = await assertContractor(ctx, strapi);
      if (!user) return;

      const { id } = ctx.params;

      const entity = await strapi.db
        .query("api::subcontractor.subcontractor")
        .findOne({ where: { documentId: id }, populate: ["user"] });

      if (!entity) {
        return ctx.notFound("Subcontractor not found");
      }

      if (String(entity.user?.id) !== String(user.id)) {
        return ctx.forbidden("You can only view your own subcontractors");
      }

      return super.findOne(ctx);
    },

    async delete(ctx) {
      return ctx.forbidden(
        "Deleting subcontractors is not allowed via the API",
      );
    },
  }),
);
