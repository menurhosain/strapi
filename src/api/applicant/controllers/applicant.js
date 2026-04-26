"use strict";

/**
 * @openapi
 * tags:
 *   - name: Applicants
 *     description: Job applicant submissions (authenticated users only)
 *
 * components:
 *   schemas:
 *     ApplicantInput:
 *       type: object
 *       required: [firstName, lastName, email, cvFile, label, appliedAt]
 *       properties:
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         cvFile:
 *           type: integer
 *           description: Strapi media file ID
 *           example: 1
 *         skills:
 *           type: string
 *           example: "JavaScript, Node.js"
 *         experienceYears:
 *           type: integer
 *           minimum: 0
 *           maximum: 50
 *           example: 3
 *         location:
 *           type: string
 *           example: "New York"
 *         label:
 *           type: string
 *           enum: [new, shortlisted, interview, hired, rejected]
 *           default: new
 *         adminNotes:
 *           type: string
 *         appliedAt:
 *           type: string
 *           format: date-time
 *
 *     ApplicantResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             attributes:
 *               $ref: '#/components/schemas/ApplicantInput'
 *         meta:
 *           type: object
 *
 * /api/applicants:
 *   post:
 *     tags: [Applicants]
 *     summary: Submit a new applicant
 *     description: Creates an applicant entry linked to the authenticated user. `label` and `adminNotes` are set by the admin panel.
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
 *                 required: [firstName, lastName, email, cvFile]
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: John
 *                   lastName:
 *                     type: string
 *                     example: Doe
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: john@example.com
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   cvFile:
 *                     type: integer
 *                     description: Strapi media file ID
 *                     example: 1
 *                   skills:
 *                     type: string
 *                     example: "JavaScript, Node.js"
 *                   experienceYears:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 50
 *                     example: 3
 *                   location:
 *                     type: string
 *                     example: "New York"
 *     responses:
 *       200:
 *         description: Applicant created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicantResponse'
 *       401:
 *         description: Login required
 *
 *   get:
 *     tags: [Applicants]
 *     summary: List applicants for the authenticated user
 *     description: Returns only applicants belonging to the logged-in user. Client-side filters are ignored.
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
 *         example: cvFile
 *     responses:
 *       200:
 *         description: List of applicants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApplicantInput'
 *                 meta:
 *                   type: object
 *       401:
 *         description: Login required
 *
 * /api/applicants/{id}:
 *   get:
 *     tags: [Applicants]
 *     summary: Get a single applicant by ID
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
 *         description: Applicant found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicantResponse'
 *       404:
 *         description: Not found
 *
 *   put:
 *     tags: [Applicants]
 *     summary: Update an applicant
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
 *                   firstName:
 *                     type: string
 *                     example: John
 *                   lastName:
 *                     type: string
 *                     example: Doe
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: john@example.com
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   cvFile:
 *                     type: integer
 *                     description: Strapi media file ID
 *                     example: 1
 *                   skills:
 *                     type: string
 *                     example: "JavaScript, Node.js"
 *                   experienceYears:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 50
 *                     example: 3
 *                   location:
 *                     type: string
 *                     example: "New York"
 *     responses:
 *       200:
 *         description: Applicant updated
 *       401:
 *         description: Login required
 *       403:
 *         description: You can only update your own applicants
 *       404:
 *         description: Not found
 */

const { createCoreController } = require("@strapi/strapi").factories;

const HIDDEN_FIELDS = ["createdAt", "updatedAt", "publishedAt", "adminNotes"];

function sanitize(entity) {
  const result = { ...entity };
  for (const field of HIDDEN_FIELDS) delete result[field];
  return result;
}

module.exports = createCoreController(
  "api::applicant.applicant",
  ({ strapi }) => ({
    async create(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("Login required");
      }

      const {
        firstName,
        lastName,
        email,
        phone,
        cvFile,
        skills,
        experienceYears,
        location,
      } = ctx.request.body.data ?? {};

      const entity = await strapi.entityService.create(
        "api::applicant.applicant",
        {
          data: {
            firstName,
            lastName,
            email,
            phone,
            cvFile,
            skills,
            experienceYears,
            location,
            appliedAt: new Date(),
            user: user.id,
          },
        },
      );

      return this.transformResponse(entity);
    },

    async update(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("Login required");
      }

      const allowedFields = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "cvFile",
        "skills",
        "experienceYears",
        "location",
      ];

      const body = ctx.request.body.data ?? {};
      const filtered = {};
      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
          filtered[field] = body[field];
        }
      }
      ctx.request.body = { data: filtered };

      return super.update(ctx);
    },

    async find(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("Login required");
      }

      const { query } = ctx;

      const data = await strapi.entityService.findMany(
        "api::applicant.applicant",
        {
          ...query,
          filters: {
            user: {
              id: user.id,
            },
          },
        },
      );

      return this.transformResponse(data.map(sanitize));
    },

    async findOne(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("Login required");
      }

      const { id } = ctx.params;

      const entity = await strapi.db
        .query("api::applicant.applicant")
        .findOne({ where: { documentId: id }, populate: ["user"] });

      if (!entity) {
        return ctx.notFound("Applicant not found");
      }

      if (String(entity.user?.id) !== String(user.id)) {
        return ctx.forbidden("You can only view your own applicants");
      }

      const response = await super.findOne(ctx);
      if (response?.data) {
        response.data = sanitize(response.data);
      }
      return response;
    },

    async delete(ctx) {
      return ctx.forbidden("Deleting applicants is not allowed via the API");
    },
  }),
);
