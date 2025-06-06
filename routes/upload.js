const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Content = require("../models/content");
// const auth = require("../middleware/auth");

const uploadRouter = express.Router();


const uploadsDir = path.join(__dirname, "..", "uploads/");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
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

    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
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
    limits: { fileSize: 1 * 1024 * 1024 * 1024 }, 
    fileFilter,
});

// Serve Static Files (So uploads can be accessed via URL)
uploadRouter.use("/upload", express.static(uploadsDir));

// Upload Route
uploadRouter.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded or unsupported file type" });
    }

    try {
        const { originalname, mimetype, size } = req.file;
        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        const newContent = new Content({
            filename: originalname,
            url: fileUrl,
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



// Delete Route (Removes File from DB & Folder)
uploadRouter.delete("/delete/:id", async (req, res) => {
    try {
        const fileData = await Content.findById(req.params.id);
        if (!fileData) {
            return res.status(404).json({ error: "File not found in database" });
        }

        // Extract filename from the URL
        const filename = fileData.url.split("/uploads/")[1];
        const filePath = path.join(uploadsDir, filename);

        // Delete file if exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

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
