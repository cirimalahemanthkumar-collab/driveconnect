const { randomUUID } = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const defaultBucket = "school-documents";

let supabaseClient;

function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for document uploads.");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  return supabaseClient;
}

function documentsBucket() {
  return process.env.SUPABASE_DOCUMENTS_BUCKET || defaultBucket;
}

async function ensureDocumentsBucket(client, bucket) {
  const { data, error } = await client.storage.getBucket(bucket);
  if (!error && data) return;

  const createResult = await client.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "application/pdf"],
  });

  if (createResult.error) {
    throw new Error(`Supabase Storage bucket "${bucket}" is not available.`);
  }
}

function fileExtension(file) {
  if (file.mimetype === "image/png") return "png";
  if (file.mimetype === "image/jpeg") return "jpg";
  if (file.mimetype === "application/pdf") return "pdf";
  return "bin";
}

function cleanPathPart(value) {
  return String(value || "document")
    .replace(/[^a-z0-9_-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function uploadSchoolDocumentFile({ file, ownerUserId, schoolId, fieldName }) {
  if (!file) return null;

  const client = getSupabaseClient();
  const bucket = documentsBucket();
  await ensureDocumentsBucket(client, bucket);

  const path = [
    cleanPathPart(schoolId || ownerUserId || "pending-school"),
    `${cleanPathPart(fieldName)}-${randomUUID()}.${fileExtension(file)}`,
  ].join("/");

  const { error } = await client.storage.from(bucket).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new Error("Document upload failed. Please try again.");
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);

  return {
    path,
    url: data?.publicUrl || path,
    mimeType: file.mimetype,
  };
}

module.exports = {
  uploadSchoolDocumentFile,
};
