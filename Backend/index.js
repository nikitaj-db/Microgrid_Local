const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sequelize = require("./config/db.js");
const dotenv = require("dotenv").config();
const { transferAllData } = require("./controllers/dataTransferController");

const overviewRoutes = require("./src/overview/overview_routes.js");
const solarRoutes = require("./src/solar/solar_routes.js");
const mainsRoutes = require("./src/mains/mains_routes.js");
const gensetRoutes = require("./src/genset/genset_routes.js");
const recordsRoutes = require("./src/records/records_routes.js");
const alertRoutes = require("./src/alert/alert_routes.js");
const liveRoutes = require("./src/live/live_routes.js");

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.use("/micro/overview", overviewRoutes);
app.use("/micro/solar", solarRoutes);
app.use("/micro/mains", mainsRoutes);
app.use("/micro/genset", gensetRoutes);
app.use("/micro/records", recordsRoutes);
app.use("/micro/alert", alertRoutes);
app.use("/micro/live", liveRoutes);

// Periodic transfer function
// setInterval(async () => {
//   console.log("Running periodic data transfer...");
//   await transferAllData();
// }, 30 * 1000);

app.get("/", (req, res) => res.send("Hello User"));

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server Running on port: http://localhost:${PORT}`)
);
