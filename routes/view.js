const express = require('express');
const viewRouter = express.Router();
const Content = require("../models/content");

viewRouter.get("/view/:id", async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (content) {
            res.json({ url: content.url });  
        } else {
            res.status(404).json({ message: "Content not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = viewRouter;
