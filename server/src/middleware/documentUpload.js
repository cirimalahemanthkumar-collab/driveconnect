const multer = require("multer");

const maxFileSizeBytes = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/png", "image/jpeg", "application/pdf"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeBytes,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error("Only PNG, JPEG, and PDF files are allowed."));
    }

    return callback(null, true);
  },
});

function schoolDocumentUpload(req, res, next) {
  const middleware = upload.fields([
    { name: "license_document_file", maxCount: 1 },
    { name: "owner_id_proof_file", maxCount: 1 },
    { name: "registration_document_file", maxCount: 1 },
    { name: "pan_document_file", maxCount: 1 },
    { name: "gst_document_file", maxCount: 1 },
    { name: "bank_proof_file", maxCount: 1 },
    { name: "document_file", maxCount: 1 },
  ]);

  middleware(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File must be less than 5 MB.",
      });
    }

    if (error.message === "Only PNG, JPEG, and PDF files are allowed.") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Unable to upload document file.",
    });
  });
}

module.exports = {
  allowedMimeTypes,
  maxFileSizeBytes,
  schoolDocumentUpload,
};
