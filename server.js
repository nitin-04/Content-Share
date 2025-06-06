const express = require("express");
const mongoDB = require("./config/database");
const cors = require("cors");
const app = express();
const path = require("path");

app.use(
  cors({
    origin: "http://localhost:5173",
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

mongoDB()
  .then(() => {
    console.log("MongoDB Connected...");
    app.listen(3000, () => {
      console.log("Server started on port 3000");
    });
  })
  .catch((err) => {
    console.error("couldn't connect: ", err.message);
  });
