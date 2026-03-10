var db = require("../../config/db");
const Records = db.records;
const sequelize = db.sequelize; // used for query
const Sequelize = db.Sequelize;

module.exports = {
  getRecords: async (req, res) => {
    try {
      const records = await Records.findOne();

      if (!records) {
        return res.status(404).json({
          success: false,
          message: "No previous records have been found",
        });
      }

      res.status(200).json(records);
    } catch (error) {
      console.error("Error fetching latest savings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch latest savings",
        error: error.message,
      });
    }
  },

  upsertRecords: async (req, res) => {
    try {
      const currentDate = new Date();
      const previousMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );

      const monthYear = `${previousMonth.getFullYear()}-${String(
        previousMonth.getMonth() + 1
      ).padStart(2, "0")}`;

      const existingRecord = await Records.findOne({
        where: { previous_month: monthYear },
      });

      if (existingRecord) {
        return res
          .status(400)
          .json({ message: `Savings for ${monthYear} already calculated` });
      }

      const mains_savings_query = await sequelize.query(
        `
WITH bounds AS (
  SELECT
    date_trunc('hour', LEAST(
      (SELECT MIN(c."createdAt") FROM solar_controller c),
      (SELECT MIN(t."createdAt") FROM solar_transducer t),
      (SELECT MIN(m."createdAt") FROM main m)
    )) AS start_hour,
    date_trunc('hour', date_trunc('month', now()) - interval '1 hour') AS end_hour
),

hours AS (
  SELECT generate_series(start_hour, end_hour, interval '1 hour') AS hour
  FROM bounds
),

solar_ctrl_h AS (
  SELECT
    date_trunc('hour', c."createdAt") AS hour,
    MAX(c.unit_generated) AS solar_unit_generated
  FROM solar_controller c
  GROUP BY 1
),

solar_trans_h AS (
  SELECT
    date_trunc('hour', t."createdAt") AS hour,
    MAX(t.kwh) AS solar_kwh
  FROM solar_transducer t
  GROUP BY 1
  HAVING MAX(t.kwh) > 0
),

solar_h AS (
  SELECT 
    COALESCE(c.hour, t.hour) AS hour,
    c.solar_unit_generated,
    t.solar_kwh
  FROM solar_ctrl_h c
  FULL OUTER JOIN solar_trans_h t ON c.hour = t.hour
),

main_h AS (
  SELECT
    date_trunc('hour', m."createdAt") AS hour,
    MAX(m.kwh) AS main_kwh
  FROM main m
  GROUP BY 1
  HAVING MAX(m.kwh) > 0
),

savings_data AS (
  SELECT
    h.hour,
    s.solar_kwh,
    s.solar_unit_generated,
    m.main_kwh,
    COALESCE(
      CASE
        WHEN COALESCE(s.solar_kwh - LAG(s.solar_kwh, 1, s.solar_kwh) OVER (ORDER BY h.hour), 0) > 0
          AND COALESCE(m.main_kwh - LAG(m.main_kwh, 1, m.main_kwh) OVER (ORDER BY h.hour), 0) > 0
        THEN (s.solar_kwh - LAG(s.solar_kwh, 1, s.solar_kwh) OVER (ORDER BY h.hour)) * 6.6
        ELSE 0
      END,
    0) AS savings
  FROM hours h
  LEFT JOIN solar_h s ON s.hour = h.hour
  LEFT JOIN main_h  m ON m.hour = h.hour
)

SELECT SUM(savings) AS total_savings
FROM savings_data;
        `,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      const genset_savings_query = await sequelize.query(
        `
WITH bounds AS (
  SELECT
    date_trunc('hour', LEAST(
      (SELECT MIN(c."createdAt") FROM solar_controller c),
      (SELECT MIN(t."createdAt") FROM solar_transducer t),
      (SELECT MIN(gc."createdAt") FROM genset_controller gc),
      (SELECT MIN(gt."createdAt") FROM genset_transducer gt)
    )) AS start_hour,
    date_trunc('hour', date_trunc('month', now()) - interval '1 hour') AS end_hour
),

hours AS (
  SELECT generate_series(start_hour, end_hour, interval '1 hour') AS hour
  FROM bounds
),

-- Solar hourly data
solar_ctrl_h AS (
  SELECT
    date_trunc('hour', c."createdAt") AS hour,
    MAX(c.unit_generated) AS solar_unit_generated
  FROM solar_controller c
  GROUP BY 1
),

solar_trans_h AS (
  SELECT
    date_trunc('hour', t."createdAt") AS hour,
    MAX(t.kwh) AS solar_kwh
  FROM solar_transducer t
  GROUP BY 1
  HAVING MAX(t.kwh) > 0
),

solar_h AS (
  SELECT 
    COALESCE(c.hour, t.hour) AS hour,
    c.solar_unit_generated,
    t.solar_kwh
  FROM solar_ctrl_h c
  FULL OUTER JOIN solar_trans_h t ON c.hour = t.hour
),

-- Genset hourly data
genset_ctrl_h AS (
  SELECT
    date_trunc('hour', gc."createdAt") AS hour,
    MAX(gc.unit_generated) AS genset_unit_generated
  FROM genset_controller gc
  GROUP BY 1
),

genset_trans_h AS (
  SELECT
    date_trunc('hour', gt."createdAt") AS hour,
    MAX(gt.kwh) AS genset_kwh
  FROM genset_transducer gt
  GROUP BY 1
  HAVING MAX(gt.kwh) > 0
),

genset_h AS (
  SELECT 
    COALESCE(gc.hour, gt.hour) AS hour,
    gc.genset_unit_generated,
    gt.genset_kwh
  FROM genset_ctrl_h gc
  FULL OUTER JOIN genset_trans_h gt ON gc.hour = gt.hour
),

-- Final savings calculation
savings_data AS (
  SELECT 
    h.hour,
    s.solar_kwh,
    g.genset_kwh,
    COALESCE(
      CASE 
        WHEN COALESCE(s.solar_kwh - LAG(s.solar_kwh, 1, s.solar_kwh) OVER (ORDER BY h.hour), 0) > 0
          AND COALESCE(g.genset_kwh - LAG(g.genset_kwh, 1, g.genset_kwh) OVER (ORDER BY h.hour), 0) > 0
        THEN (s.solar_kwh - LAG(s.solar_kwh, 1, s.solar_kwh) OVER (ORDER BY h.hour)) * 18.4
        ELSE 0
      END,
    0) AS savings
  FROM hours h
  LEFT JOIN solar_h  s ON s.hour = h.hour
  LEFT JOIN genset_h g ON g.hour = h.hour
)

SELECT SUM(savings) AS total_savings
FROM savings_data;
        `,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      const solar_total_generation_query = await sequelize.query(
        `
WITH hourly_avg AS (
    SELECT
        DATE_TRUNC(
            'hour',
            "createdAt" + INTERVAL '5 hours 30 minutes'
        ) AS hour,
        -- Truncate to the hour with IST adjustment
        AVG(
            (
                kw_phase1 + kw_phase2 + kw_phase3
            )
        ) AS avg_kW_per_hour -- Calculate the average kW per hour
    FROM
        solar_transducer
    WHERE
        "createdAt" >= (
            SELECT
                MIN("createdAt")
            FROM
                solar_transducer
        ) -- Start from the earliest available data
        AND "createdAt" <= DATE_TRUNC('month', CURRENT_DATE) -- Until the last day of the previous month
    GROUP BY
        hour -- Group by the truncated hour
)
SELECT
    SUM(avg_kW_per_hour) AS generation_upto_previous_month -- Sum of all hourly averages
FROM
    hourly_avg;
            `,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      const mains_total_generation_query = await sequelize.query(
        `
WITH hourly_avg AS (
    SELECT
        DATE_TRUNC(
            'hour',
            "createdAt" + INTERVAL '5 hours 30 minutes'
        ) AS hour,
        -- Truncate to the hour with IST adjustment
        AVG(
            (
              kw_phase1 + kw_phase2 + kw_phase3
            )
        ) AS avg_kW_per_hour -- Calculate the average kW per hour
    FROM
        main
    WHERE
        "createdAt" >= (
            SELECT
                MIN("createdAt")
            FROM
                Main
        ) -- Start from the earliest available data
        AND "createdAt" <= DATE_TRUNC('month', CURRENT_DATE) -- Until the last day of the previous month
    GROUP BY
        hour -- Group by the truncated hour
)
SELECT
    SUM(avg_kW_per_hour) AS generation_upto_previous_month -- Sum of all hourly averages
FROM
    hourly_avg;
            `,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      const genset_total_generation_query = await sequelize.query(
        `
WITH hourly_avg AS (
    SELECT
        DATE_TRUNC(
            'hour',
            "createdAt" + INTERVAL '5 hours 30 minutes'
        ) AS hour,
        -- Truncate to the hour with IST adjustment
        AVG(
            (
              kw_phase1 + kw_phase2 + kw_phase3
            )
        ) AS avg_kW_per_hour -- Calculate the average kW per hour
    FROM
        genset_transducer
    WHERE
        "createdAt" >= (
            SELECT
                MIN("createdAt")
            FROM
                genset_transducer
        ) -- Start from the earliest available data
        AND "createdAt" <= DATE_TRUNC('month', CURRENT_DATE) -- Until the last day of the previous month
    GROUP BY
        hour -- Group by the truncated hour
)
SELECT
    SUM(avg_kW_per_hour) AS generation_upto_previous_month -- Sum of all hourly averages
FROM
    hourly_avg;
            `,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      const mains_total_operating_hours_query = await sequelize.query(
        `
WITH phase1_zero_intervals AS (
    SELECT 
        "createdAt",
        LAG("createdAt") OVER (ORDER BY "createdAt") AS previous_time
    FROM main
    WHERE 
        voltagel_phase1 = 0
        AND "createdAt" < DATE_TRUNC('month', CURRENT_DATE)  -- Everything BEFORE current month
),
time_differences AS (
    SELECT 
        "createdAt",
        previous_time,
        EXTRACT(EPOCH FROM ("createdAt" - previous_time)) AS duration_in_seconds
    FROM phase1_zero_intervals
    WHERE previous_time IS NOT NULL
)
SELECT 
    SUM(duration_in_seconds) / 3600 AS operating_hours_upto_previous_month
FROM time_differences;
            `,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      const mains_savings = mains_savings_query[0].total_savings || 0;
      const genset_savings = genset_savings_query[0].total_savings || 0;

      const solar_total_generation =
        solar_total_generation_query[0].generation_upto_previous_month || 0;
      const mains_total_generation =
        mains_total_generation_query[0].generation_upto_previous_month || 0;
      const genset_total_generation =
        genset_total_generation_query[0].generation_upto_previous_month || 0;

      const mains_total_operating_hours =
        mains_total_operating_hours_query[0]
          .operating_hours_upto_previous_month || 0;

      // Data that must always exist for the row
      const recordData = {
        previous_month: monthYear,
        total_generation_solar: solar_total_generation,
        total_generation_mains: mains_total_generation,
        total_generation_genset: genset_total_generation,
        total_operating_hours_mains: mains_total_operating_hours,
        savings_mains: mains_savings,
        savings_genset: genset_savings,
        updatedAt: new Date(),
      };

      // Always ensure we have exactly one row (insert if missing, update if exists)
      const [record, created] = await Records.upsert(recordData, {
        returning: true, // only works on Postgres
      });

      return res.status(200).json({
        message: created
          ? `Record created for ${monthYear}`
          : `Record updated for ${monthYear}`,
        data: {
          mains_savings,
          genset_savings,
          solar_total_generation,
          mains_total_generation,
          genset_total_generation,
          mains_total_operating_hours,
        },
      });
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },
};
