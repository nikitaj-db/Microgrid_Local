const express = require("express");
const { getRecords, upsertRecords } = require("./records_controller");

const router = express.Router();

router.get("/", getRecords);
router.post("/", upsertRecords);

module.exports = router;
