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
 *       required: [fullName, title, phone, email, companyName, registrationNumber, foundingYear, mainTrades, country, state, city, address, postalCode, companyPhone, taxId, description]
 *       properties:
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         title:
 *           type: string
 *           example: "Project Manager"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         email:
 *           type: string
 *           format: email
 *           example: contact@acme.com
 *         companyName:
 *           type: string
 *           example: "Acme Construction Ltd"
 *         registrationNumber:
 *           type: string
 *           example: "CR-123456"
 *         foundingYear:
 *           type: integer
 *           minimum: 1800
 *           maximum: 2100
 *           example: 2005
 *         mainTrades:
 *           type: string
 *           example: "Electrical, Plumbing"
 *         country:
 *           type: string
 *           example: "United States"
 *         state:
 *           type: string
 *           example: "Illinois"
 *         city:
 *           type: string
 *           example: "Chicago"
 *         address:
 *           type: string
 *           example: "123 Main St"
 *         postalCode:
 *           type: string
 *           example: "60601"
 *         companyPhone:
 *           type: string
 *           example: "+13125550100"
 *         ext:
 *           type: string
 *           example: "42"
 *         taxId:
 *           type: string
 *           example: "12-3456789"
 *         documents:
 *           type: array
 *           items:
 *             type: integer
 *           description: Strapi media file IDs (pdf, docx, doc)
 *         description:
 *           type: string
 *           example: "Specialised in commercial fit-outs."
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
 *                 $ref: '#/components/schemas/SubcontractorInput'
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
 *                 $ref: '#/components/schemas/SubcontractorInput'
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

const HIDDEN_FIELDS = ["createdAt", "updatedAt", "publishedAt", "adminNotes"];

function sanitize(entity) {
  const result = { ...entity };
  for (const field of HIDDEN_FIELDS) delete result[field];
  return result;
}

module.exports = createCoreController(
  "api::subcontractor.subcontractor",
  ({ strapi }) => ({
    async create(ctx) {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Login required");
      if (!user.confirmed) return ctx.forbidden("Please confirm your email address before submitting an application.");
      if (user.blocked) return ctx.forbidden("Your account has been blocked. Please contact support.");

      const {
        fullName,
        title,
        phone,
        email,
        companyName,
        registrationNumber,
        foundingYear,
        mainTrades,
        country,
        state,
        city,
        address,
        postalCode,
        companyPhone,
        ext,
        taxId,
        documents,
        description,
        subcontractedSlug,
      } = ctx.request.body.data ?? {};

      const REQUIRED = {
        fullName,
        title,
        phone,
        email,
        companyName,
        registrationNumber,
        foundingYear,
        mainTrades,
        country,
        state,
        city,
        address,
        postalCode,
        companyPhone,
        taxId,
        description,
      };

      const missing = Object.entries(REQUIRED)
        .filter(([, v]) => v === undefined || v === null || v === "")
        .map(([k]) => k);

      if (!Array.isArray(documents) || documents.length === 0) {
        missing.push("documents");
      }

      if (missing.length > 0) {
        return ctx.badRequest(`Missing required fields: ${missing.join(", ")}`);
      }

      const ALLOWED_MIME_TYPES = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      const files = await strapi.db.query("plugin::upload.file").findMany({
        where: { id: { $in: documents } },
        select: ["id", "mime"],
      });

      const invalidFiles = files.filter((f) => !ALLOWED_MIME_TYPES.includes(f.mime));
      if (invalidFiles.length > 0) {
        return ctx.badRequest("Only PDF, DOC, and DOCX files are allowed for documents.");
      }

      let projectDocumentId = null;

      if (subcontractedSlug) {
        const project = await strapi
          .documents("api::subcontracted.subcontracted")
          .findFirst({ filters: { slug: subcontractedSlug } });

        if (!project) {
          return ctx.badRequest("Project not found.");
        }

        const existing = await strapi
          .documents("api::subcontractor.subcontractor")
          .findFirst({
            filters: {
              user: { id: user.id },
              applied_on_project: { documentId: project.documentId },
            },
          });

        if (existing) {
          return ctx.badRequest("You have already applied for this project.");
        }

        projectDocumentId = project.documentId;
      }

      const entity = await strapi
        .documents("api::subcontractor.subcontractor")
        .create({
          data: {
            fullName,
            title,
            phone,
            email,
            companyName,
            registrationNumber,
            foundingYear,
            mainTrades,
            country,
            state,
            city,
            address,
            postalCode,
            companyPhone,
            ext,
            taxId,
            documents,
            description,
            appliedAt: new Date(),
            user: user.id,
            ...(projectDocumentId && { applied_on_project: projectDocumentId }),
          },
        });

      return this.transformResponse(entity);
    },

    async find(ctx) {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Login required");
      if (!user.confirmed) return ctx.forbidden("Please confirm your email address before submitting an application.");
      if (user.blocked) return ctx.forbidden("Your account has been blocked. Please contact support.");

      const { populate, sort, fields, pagination } = ctx.query;

      const filters = { user: { id: user.id } };

      const [data, total] = await Promise.all([
        strapi.documents("api::subcontractor.subcontractor").findMany({
          filters,
          populate,
          sort,
          fields,
          pagination,
        }),
        strapi.documents("api::subcontractor.subcontractor").count({ filters }),
      ]);

      const pageSize = pagination?.pageSize ?? 25;
      const page = pagination?.page ?? 1;

      return {
        data: data.map(sanitize),
        meta: {
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            pageCount: Math.ceil(total / pageSize),
            total,
          },
        },
      };
    },

    async findOne(ctx) {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Login required");
      if (!user.confirmed) return ctx.forbidden("Please confirm your email address before submitting an application.");
      if (user.blocked) return ctx.forbidden("Your account has been blocked. Please contact support.");

      const { id } = ctx.params;

      const entity = await strapi
        .documents("api::subcontractor.subcontractor")
        .findOne({ documentId: id, populate: ["user"] });

      if (!entity) {
        return ctx.notFound("Subcontractor not found");
      }

      if (String(entity.user?.id) !== String(user.id)) {
        return ctx.forbidden("You can only view your own subcontractors");
      }

      const response = await super.findOne(ctx);
      if (response?.data) {
        response.data = sanitize(response.data);
      }
      return response;
    },

    async delete(ctx) {
      return ctx.forbidden(
        "Deleting subcontractors is not allowed via the API",
      );
    },
  }),
);
