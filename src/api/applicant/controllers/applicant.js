"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

const HIDDEN_FIELDS = ["createdAt", "updatedAt", "publishedAt", "adminNotes"];

const PHOTO_MIME_TYPES = ["image/jpeg", "image/png"];
const DOC_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const REQUIRED = {
  fullName: "Full name",
  currentLocation: "Current location",
  gccExperience: "Experience in GCC",
  email: "Email",
  phone: "Phone",
  experienceYears: "Years of experience",
  nationality: "Nationality",
  photo: "Photo",
  cv: "CV",
};

function sanitize(entity) {
  const result = { ...entity };
  for (const field of HIDDEN_FIELDS) delete result[field];
  return result;
}

async function validateMediaMime(strapi, id, allowedMimes, fieldLabel) {
  if (!id) return null;
  const file = await strapi.db
    .query("plugin::upload.file")
    .findOne({ where: { id }, select: ["id", "mime"] });
  if (!file) return `${fieldLabel}: file not found.`;
  if (!allowedMimes.includes(file.mime))
    return `${fieldLabel}: invalid file type (${file.mime}).`;
  return null;
}

module.exports = createCoreController(
  "api::applicant.applicant",
  ({ strapi }) => ({
    async create(ctx) {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Login required");
      if (!user.confirmed) return ctx.forbidden("Please confirm your email address before submitting an application.");
      if (user.blocked) return ctx.forbidden("Your account has been blocked. Please contact support.");

      const {
        fullName,
        currentLocation,
        gccExperience,
        email,
        phone,
        experienceYears,
        nationality,
        photo,
        cv,
        coverLetter,
        jobSlug,
      } = ctx.request.body.data ?? {};

      // jobSlug required
      if (!jobSlug) {
        return ctx.badRequest("A job must be selected to submit an application.");
      }

      const job = await strapi.db.query("api::job.job").findOne({ where: { slug: jobSlug } });
      if (!job) return ctx.badRequest("Job not found.");

      // Duplicate check
      const existing = await strapi.db.query("api::applicant.applicant").findOne({
        where: { user: { id: user.id }, applied_job: { id: job.id } },
      });
      if (existing) return ctx.badRequest("You have already applied for this job.");

      // Required field validation
      const missing = [];
      for (const [field, label] of Object.entries(REQUIRED)) {
        const val = ctx.request.body.data?.[field];
        const empty = val === undefined || val === null || val === "";
        if (empty) missing.push(label);
      }
      if (missing.length > 0) {
        return ctx.badRequest(`Missing required fields: ${missing.join(", ")}.`);
      }

      // gccExperience must be yes or no
      if (!["yes", "no"].includes(gccExperience)) {
        return ctx.badRequest("Experience in GCC must be 'yes' or 'no'.");
      }

      // experienceYears range
      const expYears = Number(experienceYears);
      if (!Number.isInteger(expYears) || expYears < 0 || expYears > 50) {
        return ctx.badRequest("Years of experience must be an integer between 0 and 50.");
      }

      // Photo mime validation (jpg/jpeg/png only)
      const photoError = await validateMediaMime(strapi, photo, PHOTO_MIME_TYPES, "Photo");
      if (photoError) return ctx.badRequest(photoError);

      // CV mime validation (pdf/doc/docx only)
      const cvError = await validateMediaMime(strapi, cv, DOC_MIME_TYPES, "CV");
      if (cvError) return ctx.badRequest(cvError);

      // Cover letter mime validation if provided
      if (coverLetter) {
        const clError = await validateMediaMime(strapi, coverLetter, DOC_MIME_TYPES, "Cover letter");
        if (clError) return ctx.badRequest(clError);
      }

      const entity = await strapi.documents("api::applicant.applicant").create({
        data: {
          fullName,
          currentLocation,
          gccExperience,
          email,
          phone,
          experienceYears: expYears,
          nationality,
          photo,
          cv,
          coverLetter: coverLetter ?? null,
          appliedAt: new Date(),
          user: { connect: [{ id: user.id }] },
          applied_job: { connect: [{ documentId: job.documentId }] },
        },
      });

      return this.transformResponse(entity);
    },

    async update(ctx) {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Login required");

      const allowedFields = [
        "fullName",
        "currentLocation",
        "gccExperience",
        "email",
        "phone",
        "experienceYears",
        "nationality",
        "photo",
        "cv",
        "coverLetter",
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
      if (!user) return ctx.unauthorized("Login required");
      if (!user.confirmed) return ctx.forbidden("Please confirm your email address before submitting an application.");
      if (user.blocked) return ctx.forbidden("Your account has been blocked. Please contact support.");

      const { query } = ctx;

      const data = await strapi.entityService.findMany("api::applicant.applicant", {
        ...query,
        filters: { user: { id: user.id } },
      });

      return this.transformResponse(data.map(sanitize));
    },

    async findOne(ctx) {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Login required");
      if (!user.confirmed) return ctx.forbidden("Please confirm your email address before submitting an application.");
      if (user.blocked) return ctx.forbidden("Your account has been blocked. Please contact support.");

      const { id } = ctx.params;

      const entity = await strapi.db
        .query("api::applicant.applicant")
        .findOne({ where: { documentId: id }, populate: ["user"] });

      if (!entity) return ctx.notFound("Applicant not found");

      if (String(entity.user?.id) !== String(user.id)) {
        return ctx.forbidden("You can only view your own applicants");
      }

      const data = await strapi.entityService.findOne(
        "api::applicant.applicant",
        entity.id,
        ctx.query,
      );

      if (!data) return ctx.notFound("Applicant not found");

      return this.transformResponse(sanitize(data));
    },

    async delete(ctx) {
      return ctx.forbidden("Deleting applicants is not allowed via the API");
    },
  }),
);
