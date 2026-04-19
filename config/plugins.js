module.exports = () => ({
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
