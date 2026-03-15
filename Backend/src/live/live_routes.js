const express = require("express");
const { update, get, series } = require("./live_store");

const router = express.Router();

router.get("/solar", (req, res) => {
  res.status(200).json({ solar: get("solar") || {} });
});

router.post("/solar", (req, res) => {
  const payload = req.body?.solar ?? req.body ?? {};
  update("solar", payload);
  res.status(200).json({ ok: true });
});

router.get("/solar/excel", (req, res) => {
  res.status(200).json(series("solar"));
});

router.get("/genset", (req, res) => {
  res.status(200).json({ genset: get("genset") || {} });
});

router.post("/genset", (req, res) => {
  const payload = req.body?.genset ?? req.body ?? {};
  update("genset", payload);
  res.status(200).json({ ok: true });
});

router.get("/genset/excel", (req, res) => {
  res.status(200).json(series("genset"));
});

module.exports = router;

