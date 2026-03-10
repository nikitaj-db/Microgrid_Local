const express = require("express");
const {
  getMains,
  viewMains,
  deleteMains,
  getChartData,
  excelData,
  upsertMains,
} = require("./mains_controller.js");

const router = express.Router();

//get all mains
router.get("/", getMains);

//get all mains
router.post("/chart", getChartData);

//get all mains
router.get("/excel", excelData);

//add mains
router.post("/", upsertMains);

//mains details
router.get("/:id", viewMains);

//delete mains
router.delete("/:id", deleteMains);

//mains update
router.patch("/:id", upsertMains);

module.exports = router;
