const express = require("express");
const mongoDB = require("./config/database");
const cors = require("cors");
const app = express();
const path = require("path");

// Update CORS to accept requests from both development and production
app.use(
  cors({
    origin: "https://content-share-web.vercel.app",
    // origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "1gb" }));
app.use(express.urlencoded({ limit: "1gb", extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const uploadRouter = require("./routes/upload");
const viewRouter = require("./routes/view");

app.use("/", uploadRouter);
app.use("/", viewRouter);

// Connect to MongoDB
mongoDB()
  .then(() => {
    console.log("MongoDB Connected...");
  })
  .catch((err) => {
    console.error("couldn't connect: ", err.message);
  });

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the Express API
module.exports = app;
