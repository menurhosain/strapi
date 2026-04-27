module.exports = () => ({
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      settings: {
        defaultFrom: process.env.SMTP_FROM,
        defaultReplyTo: process.env.SMTP_FROM,
      },
    },
  },
  upload: {
    config: {
      sizeLimit: 5 * 1024 * 1024, //5mb
    },
    security: {
      allowedTypes: ["images"],
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        // PDF
        "application/pdf",
        // Word
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      ],
    },
  },
});
