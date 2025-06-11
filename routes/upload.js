const express = require("express");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Content = require("../models/content");
// const auth = require("../middleware/auth");

const uploadRouter = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "content-share",
    resource_type: "auto",
    format: "pdf",
    allowed_formats: ["pdf", "jpg", "jpeg", "png", "gif", "ppt", "pptx", "mp4", "mov", "avi", "mkv"],
    transformation: [
      { fetch_format: "auto" }
    ]
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|pdf|ppt|pptx|mp4|mov|avi|mkv/;
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
  ];

  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    return cb(new Error("Only image, PDF, PPT, and video files are allowed!"));
  }
};

// Multer Configuration
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter,
});

// Upload Route
uploadRouter.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ error: "No file uploaded or unsupported file type" });
  }

  try {
    const { originalname, mimetype, size } = req.file;
    // Get the secure URL from Cloudinary
    const fileUrl = req.file.path;
    
    // For PDFs and other documents, ensure we get the raw URL
    const secureUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');

    const newContent = new Content({
      filename: originalname,
      url: secureUrl,
      fileType: mimetype,
      fileSize: size,
    });
    await newContent.save();

    res.json({ id: newContent._id, url: newContent.url });
  } catch (err) {
    console.error("Upload failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

uploadRouter.get("/upload", async (req, res) => {
  try {
    const files = await Content.find().sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Route (Removes File from DB & Cloudinary)
uploadRouter.delete("/delete/:id", async (req, res) => {
  try {
    const fileData = await Content.findById(req.params.id);
    if (!fileData) {
      return res.status(404).json({ error: "File not found in database" });
    }

    // Delete from Cloudinary
    const publicId = fileData.url.split('/').slice(-1)[0].split('.')[0];
    await cloudinary.uploader.destroy(publicId);

    // Remove from DB
    await Content.findByIdAndDelete(req.params.id);

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Error Handling Middleware
uploadRouter.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: err.message });
});

module.exports = uploadRouter;
