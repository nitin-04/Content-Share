const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
    filename:
    {
        type: String,
        required: true
    },
    url:
    {
        type: String,
        required: true
    },
    fileType:
    {
        type: String,
        required: true
    },
    fileSize:
    {
        type: Number,
        required: true
    }, 
}, { timestamps: true });

module.exports = mongoose.model("Content", ContentSchema);
