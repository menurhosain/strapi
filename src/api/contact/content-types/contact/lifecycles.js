"use strict";

module.exports = {
  async afterCreate(event) {
    const { firstName, lastName, email, phone, message } = event.result;

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM;

    if (!adminEmail) return;

    try {
      await strapi.service("plugin::email.email").send({
        to: adminEmail,
        subject: `New Contact Form Submission from ${firstName} ${lastName}`,
        html: `
                    <h2>New Contact Form Submission</h2>
                    <table cellpadding="8" style="border-collapse:collapse;width:100%;max-width:600px">
                        <tr><td><strong>Name</strong></td><td>${firstName} ${lastName}</td></tr>
                        <tr><td><strong>Email</strong></td><td>${email || "—"}</td></tr>
                        <tr><td><strong>Phone</strong></td><td>${phone || "—"}</td></tr>
                        <tr><td><strong>Message</strong></td><td style="white-space:pre-line">${message}</td></tr>
                    </table>
                `,
      });
    } catch (err) {
      strapi.log.error(
        "[contact] Failed to send admin notification email:",
        err,
      );
    }
  },
};
