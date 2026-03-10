const express = require("express");
const {
  getGenset,
  upsertGenset,
  getChartData,
  excelData,
  viewGensetTransducer,
  viewGensetController,
  deleteGensetTransducer,
  deleteGensetController,
} = require("./genset_controller.js");

const router = express.Router();

//get all genset
router.get("/", getGenset);

//get all genset
router.post("/chart", getChartData);

//get all genset
router.get("/excel", excelData);

//add Genset
router.post("/", upsertGenset);

//Genset details
router.get("/controller/:id", viewGensetController);

router.get("/transducer/:id", viewGensetTransducer);

//delete Genset
router.delete("/controller/:id", deleteGensetController);

router.delete("/transducer/:id", deleteGensetTransducer);

//Genset update
router.patch("/:id", upsertGenset);

module.exports = router;
