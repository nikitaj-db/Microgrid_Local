const express = require("express");
const {
  getAlert,
  viewAlert,
  deleteAlert,
  upsertAlert,
} = require("./alert_controller.js");

const router = express.Router();

//get all Alerts
router.get("/", getAlert);

//add alert
router.post("/", upsertAlert);

//alert details
router.get("/:id", viewAlert);

//delete alert
router.delete("/:id", deleteAlert);

//alert update
router.patch("/:id", upsertAlert);

module.exports = router;
