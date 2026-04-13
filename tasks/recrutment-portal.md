You are a senior Strapi v5 backend developer.

## Task
Create the Applicant collection type schema file for a recruitment portal built on Strapi v5 with PostgreSQL.

## Output
Generate the file at this exact path:
src/api/applicant/content-types/applicant/schema.json

## Schema Requirements
The Applicant collection must include the following fields:

- firstName         → string, required
- lastName          → string, required
- email             → email, required, unique
- phone             → string, optional
- cvFile            → media (single file), allowed types: [pdf, doc, docx], required
- skills            → json (array of strings)
- experienceYears   → integer, min: 0, max: 50
- location          → string, optional
- status            → enumeration, values: [new, shortlisted, interview, hired, rejected], default: "new", required
- adminNotes        → text, optional (admin-only internal notes)
- appliedAt         → datetime, required
- user              → relation, oneToOne → plugin::users-permissions.user (linked candidate login account)

## Rules
- kind must be "collectionType"
- collectionName must be "applicants"
- singularName: "applicant", pluralName: "applicants", displayName: "Applicant"
- Do not use the Content-Type Builder UI — output the raw schema.json only
- Follow Strapi v5 schema.json syntax exactly
- Do not include createdAt / updatedAt / publishedAt — Strapi adds these automatically
- For the cvFile media field, use allowedTypes array to restrict file types
- The status field must have a default value of "new"

## Constraints
- No controllers, no routes, no services — schema.json file only
- Do not invent fields not listed above
- Output must be valid JSON — no comments, no trailing commas

## Expected Output Format
A single valid JSON file. Start your response with the file path as a comment, then the JSON content. Example:

// src/api/applicant/content-types/applicant/schema.json
{
  ...
}
