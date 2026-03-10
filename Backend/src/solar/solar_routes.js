const express = require("express");
const {
  getSolar,
  viewSolar,
  deleteSolar,
  getChartData,
  excelData,
  upsertSolar,
} = require("./solar_controller.js");

const router = express.Router();

//get all Solar
router.get("/", getSolar);

//get all Solar
router.post("/chart", getChartData);

//get all Solar
router.get("/excel", excelData);

//get all Solar

//add Solar
router.post("/", upsertSolar);

//Solar details
router.get("/:id", viewSolar);

//delete Solar
router.delete("/:id", deleteSolar);

//Solar update
router.patch("/:id", upsertSolar);

module.exports = router;
