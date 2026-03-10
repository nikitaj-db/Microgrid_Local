var db = require("../../config/db");
// const Solar = db.solar;
const SolarController = db.solar_controller;
const SolarTransducer = db.solar_transducer;
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const BASEURL = "http://localhost:5002/micro";

module.exports = {
  //get all solar
  getSolar: async (req, res) => {
    try {
      const records = await fetch(`${BASEURL}/records`);
      const records_json = await records.json();

      const result = await SolarTransducer.sequelize.query(
        `
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt") AS hour,
                    AVG(kw_phase1 + kw_phase2 + kw_phase3) AS avg_kW_per_hour
                    FROM solar_transducer
                    WHERE "createdAt" >= CURRENT_DATE
                    AND "createdAt" < CURRENT_DATE + INTERVAL '1 day'
                    GROUP BY hour
                )
                SELECT SUM(avg_kW_per_hour) AS avg_daily_total_generations FROM hourly_avg;
            `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      const daily_generation = result[0].avg_daily_total_generations;

      //! this will going to divide in current month and till previous month
      /*
            const result_total = await Solar.sequelize.query(`
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt" + INTERVAL '5 hours 30 minutes') AS hour,  -- Truncate to the hour with IST adjustment
                    AVG(
                            (("kW"->>'phase1')::FLOAT + 
                            ("kW"->>'phase2')::FLOAT + 
                            ("kW"->>'phase3')::FLOAT)
                        ) AS avg_kW_per_hour  -- Calculate the average kW per hour
                    FROM 
                    solar
                    WHERE 
                        "createdAt" >= (SELECT MIN("createdAt") FROM Solar)  -- Start from the earliest available data
                        AND "createdAt" <= CURRENT_TIMESTAMP  -- Until current time
                    GROUP BY 
                        hour  -- Group by the truncated hour
                    )
                    SELECT 
                        SUM(avg_kW_per_hour) AS total_generation  -- Sum of all hourly averages
                    FROM 
                    hourly_avg;
            `, {
                type: sequelize.QueryTypes.SELECT
            });
            */

      const result_total = await SolarTransducer.sequelize.query(
        `
WITH HOURLY_AVG AS (
	SELECT
		DATE_TRUNC(
			'hour',
			"createdAt"
		) AS HOUR,
		-- Truncate to the hour with IST adjustment
		AVG(
			(
				kw_phase1 + kw_phase2 + kw_phase3
			)
		) AS AVG_KW_PER_HOUR -- Calculate the average kW per hour
	FROM
		solar_transducer
	WHERE
		"createdAt" >= DATE_TRUNC('month', CURRENT_TIMESTAMP) -- Start from the beginning of the current month
		AND "createdAt" <= CURRENT_TIMESTAMP -- Until current time
	GROUP BY
		HOUR -- Group by the truncated hour
)
SELECT
	SUM(AVG_KW_PER_HOUR) AS TOTAL_GENERATION -- Sum of all hourly averages
FROM
	HOURLY_AVG;
            `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      const total =
        (isNaN(parseFloat(result_total[0].total_generation))
          ? 0
          : parseFloat(result_total[0].total_generation)) +
        parseFloat(records_json.total_generation_solar);

      const result_lastentry = await SolarController.findOne({
        attributes: ["hours_operated"],
        where: {
          createdAt: {
            [Op.lte]: sequelize.literal("CURRENT_DATE"),
          },
          hours_operated: {
            [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }, { [Op.ne]: "0.0" }],
          },
        },
        order: [["createdAt", "DESC"]],
      });

      const result_power = await SolarTransducer.sequelize.query(
        `
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt") AS hour,
                    AVG(kw_phase1 + kw_phase2 + kw_phase3) AS avg_kW_per_hour
                    FROM solar_transducer
                    WHERE "createdAt" >= CURRENT_DATE - INTERVAL '1 day'  -- Filter for yesterday's data
                    AND "createdAt" < CURRENT_DATE  -- Exclude today's data
                    GROUP BY hour
                )
                SELECT SUM(avg_kW_per_hour) AS power_generations_yesterday 
                FROM hourly_avg;
            `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      const power_generation_yesterday =
        result_power[0].power_generations_yesterday;

      const result_power_before = await SolarTransducer.sequelize.query(
        `
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt") AS hour,
                    AVG(
                            kw_phase1 + kw_phase2 + kw_phase3
                        ) AS avg_kW_per_hour
                    FROM solar_transducer
                    WHERE "createdAt" >= CURRENT_DATE - INTERVAL '2 day'  -- Filter for yesterday's data
                    AND "createdAt" < CURRENT_DATE - INTERVAL '1 day'  -- Exclude today's data
                    GROUP BY hour
                )
                SELECT SUM(avg_kW_per_hour) AS power_generations_yesterday 
                FROM hourly_avg;
            `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      const power_generation_before_yesterday =
        result_power_before[0].power_generations_yesterday;

      const latestController = await SolarController.findOne({
        where: {
          operating_hours: {
            [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }],
          },
          hours_operated: {
            [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }],
          },
        },
        order: [["createdAt", "DESC"]],
      });

      const latestTransducer = await SolarTransducer.findOne({
        where: {
          kwh: { [Op.ne]: null },
        },
        order: [["createdAt", "DESC"]],
      });

      const nonZerokWh = await SolarTransducer.findOne({
        where: {
          kwh: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: 0 }] },
        },
        order: [["createdAt", "DESC"]],
        attributes: ["kwh"],
      });

      if (latestTransducer) {
        latestTransducer.dataValues.kwh = nonZerokWh.kwh;
      }

      // Get first & last KWH values from Transducer to calculate difference
      const firstTransducerRow = await SolarTransducer.findOne({
        where: { kwh: { [Op.ne]: null, [Op.ne]: 0 } },
        order: [["id", "ASC"]],
        attributes: ["kwh"],
      });

      const lastTransducerRow = await SolarTransducer.findOne({
        where: { kwh: { [Op.ne]: null, [Op.ne]: 0 } },
        order: [["id", "DESC"]],
        attributes: ["kwh"],
      });

      if (firstTransducerRow && lastTransducerRow) {
        latestController.dataValues.kwh_diff =
          lastTransducerRow.kwh - firstTransducerRow.kwh;
      }

      // Attach latest KWH from transducer into controller response
      // if (latestTransducer) {
      //   latestController.dataValues.kwh = latestTransducer.kwh;
      // }

      if (latestController.dataValues.breaker_status === null) {
        latestController.dataValues.breaker_status = "OFF";
      }

      if (latestController && result) {
        latestController.dataValues.avg_daily_total_generation =
          Math.floor(daily_generation);
      }

      if (result_total) {
        latestController.dataValues.avg_total_generation = Math.floor(total);
      }

      if (result_lastentry) {
        latestController.dataValues.avg_hours_operated =
          result_lastentry.get("hours_operated");
      }

      if (result_power) {
        latestController.dataValues.power_generated_yesterday =
          power_generation_yesterday;
      }

      if (result_power_before) {
        latestController.dataValues.power_generated_before_yesterday =
          power_generation_before_yesterday;
      }

      // 8️⃣ Update latest transducer record with computed totals
      if (latestTransducer) {
        await SolarTransducer.update(
          {
            total_generation: Math.floor(total),
            power_generated: power_generation_yesterday,
          },
          { where: { id: latestTransducer.id } }
        );
      }

      const mergedData = {
        ...latestController.dataValues,
        ...latestTransducer.dataValues,
      };

      let finalPowerFactor = null;

      if (latestTransducer.dataValues.power_factor !== 0) {
        finalPowerFactor = latestTransducer.dataValues.power_factor;
      } else if (latestController.dataValues.power_factor !== 0) {
        finalPowerFactor = latestController.dataValues.power_factor;
      }

      mergedData.power_factor = finalPowerFactor;
      return res.status(200).send([mergedData]);
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  //view solar by id
  viewSolar: async (req, res) => {
    const id = req.params.id;
    try {
      const solar_controller = await SolarController.findByPk(id);
      const solar_transducer = await SolarTransducer.findByPk(id);
      return res.status(200).send(solar_controller, solar_transducer);
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  // upsert Solar
  upsertSolar: async (req, res) => {
    const solarArray = req.body;
    const id = req.params.id || null;

    try {
      const processedSolar = [];

      for (const solarData of solarArray) {
        const {
          breaker_status,
          frequency,
          power_factor,
          kwh,
          kw_phase1,
          kw_phase2,
          kw_phase3,
          kva_phase1,
          kva_phase2,
          kva_phase3,
          current_phase1,
          current_phase2,
          current_phase3,
          voltagel_phase1,
          voltagel_phase2,
          voltagel_phase3,
          voltagen_phase1,
          voltagen_phase2,
          voltagen_phase3,
          unit_generated,
          operating_hours,
          hours_operated,
        } = solarData;

        try {
          const results = {};

          // Check if transducer data is provided
          const hasTransducerData =
            frequency ||
            kwh ||
            kw_phase1 ||
            kw_phase2 ||
            kw_phase3 ||
            kva_phase1 ||
            kva_phase2 ||
            kva_phase3 ||
            current_phase1 ||
            current_phase2 ||
            current_phase3 ||
            voltagel_phase1 ||
            voltagel_phase2 ||
            voltagel_phase3 ||
            voltagen_phase1 ||
            voltagen_phase2 ||
            voltagen_phase3;

          // Check if controller data is provided
          const hasControllerData =
            breaker_status ||
            operating_hours ||
            hours_operated ||
            unit_generated;

          if (hasTransducerData) {
            const transducerResult = await sequelize.query(
              `CALL insert_update_solar_transducer(
              :p_id,
              :p_frequency,
              :p_power_factor,
              :p_kwh,
              :p_kw_phase1,
              :p_kw_phase2,
              :p_kw_phase3,
              :p_kva_phase1,
              :p_kva_phase2,
              :p_kva_phase3,
              :p_current_phase1,
              :p_current_phase2,
              :p_current_phase3,
              :p_voltagel_phase1,
              :p_voltagel_phase2,
              :p_voltagel_phase3,
              :p_voltagen_phase1,
              :p_voltagen_phase2,
              :p_voltagen_phase3,
              :result_json
            )`,
              {
                replacements: {
                  p_id: id,
                  p_frequency: frequency,
                  p_power_factor: power_factor,
                  p_kwh: kwh || null,
                  p_kw_phase1: kw_phase1,
                  p_kw_phase2: kw_phase2,
                  p_kw_phase3: kw_phase3,
                  p_kva_phase1: kva_phase1,
                  p_kva_phase2: kva_phase2,
                  p_kva_phase3: kva_phase3,
                  p_current_phase1: current_phase1,
                  p_current_phase2: current_phase2,
                  p_current_phase3: current_phase3,
                  p_voltagel_phase1: voltagel_phase1,
                  p_voltagel_phase2: voltagel_phase2,
                  p_voltagel_phase3: voltagel_phase3,
                  p_voltagen_phase1: voltagen_phase1,
                  p_voltagen_phase2: voltagen_phase2,
                  p_voltagen_phase3: voltagen_phase3,
                  result_json: null,
                },
                type: sequelize.QueryTypes.RAW,
              }
            );

            const transducerData = transducerResult[0][0].result_json;
            results.transducer =
              transducerData === null
                ? "Already saved same transducer data in database"
                : transducerData;
          }

          // Insert/Update Solar Controller data if provided
          if (hasControllerData) {
            const controllerResult = await sequelize.query(
              `CALL insert_update_solar_controller(
              :p_id,
              :p_breaker_status,
              :p_power_factor,
              :p_operating_hours,
              :p_hours_operated,
              :p_unit_generated,
              :result_json
            )`,
              {
                replacements: {
                  p_id: id,
                  p_breaker_status: breaker_status || null,
                  p_power_factor: power_factor || null,
                  p_operating_hours: operating_hours,
                  p_hours_operated: hours_operated,
                  p_unit_generated: unit_generated,
                  result_json: null,
                },
                type: sequelize.QueryTypes.RAW,
              }
            );

            const controllerData = controllerResult[0][0].result_json;
            results.controller =
              controllerData === null
                ? "Already saved same controller data in database"
                : controllerData;
          }

          // If no data is provided for either table
          if (!hasTransducerData && !hasControllerData) {
            results.error =
              "No valid solar data provided for either transducer or controller";
          }

          processedSolar.push(results);
        } catch (innerError) {
          processedSolar.push({
            error: `Failed to process data for solar: ${innerError.message}`,
          });
        }
      }
      return res.status(200).send(processedSolar);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error.message);
    }
  },

  //delete solar by id
  deleteSolar: async (req, res) => {
    const id = req.params.id;
    try {
      const solar = await Solar.destroy({ where: { id } });
      return res.status(200).send({
        message: "Deleted Successfully",
      });
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  getChartData: async (req, res) => {
    try {
      const { fromDate, toDate } = req.body;

      const data = await SolarTransducer.sequelize.query(
        `WITH hours AS (
                        SELECT 
                        TO_CHAR(generated_hour + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour
                        FROM generate_series(
                            (DATE_TRUNC('day', ${
                              fromDate ? `'${fromDate}'` : "NOW()"
                            } AT TIME ZONE 'Asia/Kolkata') + INTERVAL '1 hour') 
                            AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
                            ${
                              toDate ? `'${toDate}'` : "NOW()"
                            } AT TIME ZONE 'UTC',
                            INTERVAL '1 hour'
                        ) AS generated_hour
                    )
                    SELECT 
                    h.hour,
                    COALESCE(SUM(
                        GREATEST(kw_phase1, 0) + 
                        GREATEST(kw_phase2, 0) + 
                        GREATEST(kw_phase3, 0)
                    ), 0) AS totalPower,
                    COALESCE(AVG(
                        GREATEST(kw_phase1, 0) + 
                        GREATEST(kw_phase2, 0) + 
                        GREATEST(kw_phase3, 0)
                    ), 0) AS averagePower
                    FROM hours h
                    LEFT JOIN solar_transducer s ON 
                        TO_CHAR(s."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') = h.hour
                    GROUP BY h.hour
                    ORDER BY h.hour;
                `,
        { type: SolarTransducer.sequelize.QueryTypes.SELECT }
      );

      //console.log(data)

      // Function to convert the data
      function transformData(rawData) {
        return rawData.map((item) => {
          const hour = new Date(item.hour).getHours();

          const power = Math.floor(parseFloat(item.averagepower));

          return {
            hour: hour,
            power: power,
          };
        });
      }

      const transformedData = transformData(data);

      res.status(200).json(transformedData);
    } catch (error) {
      console.error("Error fetching power data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  excelData: async (req, res) => {
    try {
      const { fromDate, toDate } = req.body;

      const data = await SolarController.sequelize.query(
        `
WITH hours AS (
    -- Generate hourly timestamps in UTC (then format later as IST if needed)
    SELECT generate_series(
        date_trunc('day', NOW()) + interval '1 hour',  -- Start of today + 1 hour
        NOW(),                                         -- Current time
        interval '1 hour'
    ) AS generated_hour
),
controller_data AS (
    -- Aggregate unit_generated from solar_controller using date_trunc (index friendly)
    SELECT 
        date_trunc('hour', sc."createdAt") AS hour,
        MAX(sc.unit_generated) AS unit_generated
    FROM solar_controller sc
    WHERE sc."createdAt" >= date_trunc('day', NOW())  -- prune scan using index
    GROUP BY hour
),
transducer_data AS (
    -- Aggregate kwh from solar_transducer using date_trunc (index friendly)
    SELECT 
        date_trunc('hour', st."createdAt") AS hour,
        MAX(st.kwh) AS kwh
    FROM solar_transducer st
    WHERE st."createdAt" >= date_trunc('day', NOW())  -- prune scan using index
    GROUP BY hour
),
power_data AS (
    -- Combine controller + transducer data by hour
    SELECT 
        COALESCE(c.hour, t.hour) AS hour,
        c.unit_generated,
        t.kwh
    FROM controller_data c
    FULL OUTER JOIN transducer_data t
        ON c.hour = t.hour
)
SELECT 
    TO_CHAR(h.generated_hour, 'YYYY-MM-DD HH24:00:00') AS hour, -- final formatted output
    COALESCE(p.unit_generated, 0) AS unit_generation,
    CASE 
        WHEN (
            (LAG(p.unit_generated) OVER (ORDER BY h.generated_hour) = 0 AND p.unit_generated > 0) 
            OR 
            (LAG(p.unit_generated) OVER (ORDER BY h.generated_hour) > 0 AND p.unit_generated = 0)
        )
        THEN 0
        ELSE COALESCE(ABS(p.kwh - LAG(p.kwh) OVER (ORDER BY h.generated_hour)), 0)
    END AS kwh_reading
FROM hours h
LEFT JOIN power_data p ON h.generated_hour = p.hour
ORDER BY h.generated_hour;
        `,
        { type: SolarController.sequelize.QueryTypes.SELECT }
      );

      //console.log(data)

      // Function to convert the data
      function transformData(rawData) {
        return rawData.map((item) => {
          const hour = new Date(item.hour).getHours();

          const kwh_reading = item.kwh_reading;
          const unit_generation = item.unit_generation;

          return {
            hour: hour,
            kwh_reading: kwh_reading,
            unit_generation: unit_generation,
          };
        });
      }

      const transformedData = transformData(data);

      res.status(200).json(transformedData);
    } catch (error) {
      console.error("Error fetching power data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  /*
  reportData: async (req, res) => {
    try {
      const { fromDate, toDate } = req.body;

      console.log(fromDate);
      console.log(toDate);

      const data = await SolarTransducer.sequelize.query(
        `WITH minutes AS (
          -- Generate 5-minute timestamps within the given date range
          SELECT
              generated_minute AS minute
          FROM generate_series(
              DATE_TRUNC('day', :fromDate::timestamp) + INTERVAL '5 minutes',
              COALESCE(:toDate::timestamp, NOW()),
              INTERVAL '5 minutes'
          ) AS generated_minute
      ),

      power_data AS (
          -- Aggregate power data per 5-minute interval from both tables
          SELECT
              DATE_TRUNC('minute', COALESCE(sc."createdAt", st."createdAt")) AS minute,
              MAX(COALESCE(sc.unit_generated, 0)) AS unit_generated,
              MAX(COALESCE(st.kwh, 0)) AS kwh
          FROM
              solar_controller sc
              FULL OUTER JOIN solar_transducer st
                  ON sc."createdAt" = st."createdAt"
          GROUP BY DATE_TRUNC('minute', COALESCE(sc."createdAt", st."createdAt"))
      ),

      -- Get the last non-zero reading before the time range starts
      last_reading_before_range AS (
          SELECT 
              st.kwh AS kwh_before_range
          FROM solar_controller sc
          JOIN solar_transducer st ON sc."createdAt" = st."createdAt"
          WHERE sc."createdAt" < DATE_TRUNC('day', :fromDate::timestamp) + INTERVAL '5 minutes'
            AND sc.unit_generated > 0
          ORDER BY sc."createdAt" DESC
          LIMIT 1
      ),

      power_with_last_nonzero AS (
          SELECT
              m.minute,
              COALESCE(p.unit_generated, 0) AS unit_generation,
              COALESCE(p.kwh, 0) AS kwh,
              -- Get the previous non-zero kwh value within current range
              (SELECT kwh 
              FROM power_data p2 
              JOIN minutes m2 ON p2.minute = m2.minute 
              WHERE m2.minute < m.minute 
                AND p2.unit_generated > 0 
              ORDER BY m2.minute DESC 
              LIMIT 1) AS last_nonzero_kwh_in_range,
              -- Get the kwh value from before the range
              (SELECT kwh_before_range FROM last_reading_before_range) AS kwh_before_range
          FROM minutes m
          LEFT JOIN power_data p ON m.minute = p.minute
      )

      SELECT
          TO_CHAR(minute, 'YYYY-MM-DD HH24:MI:00') AS minute,
          unit_generation,
          CASE
              WHEN unit_generation = 0 THEN 0
              WHEN last_nonzero_kwh_in_range IS NULL THEN 
                  -- First non-zero in range, use difference from before range
                  CASE 
                      WHEN kwh_before_range IS NULL THEN kwh
                      ELSE ABS(kwh - kwh_before_range)
                  END
              ELSE ABS(kwh - last_nonzero_kwh_in_range)
          END AS kwh_reading
      FROM power_with_last_nonzero
      ORDER BY minute;
      `,
        {
          replacements: { fromDate, toDate: toDate || null },
          type: SolarTransducer.sequelize.QueryTypes.SELECT,
        }
      );

      //console.log(data)

      // Function to convert the data
      function transformData(rawData) {
        return rawData.map((item) => {
          const extractDate = (timestamp) => {
            return timestamp.split(" ")[0]; // Splits by space and takes the date part
          };

          const date = extractDate(item.minute);
          const hour = new Date(item.minute).getHours();
          const minute = new Date(item.minute)
            .getMinutes()
            .toString()
            .padStart(2, "0");
          const amPm = hour >= 12 ? "PM" : "AM";
          const kwh_reading = item.kwh_reading;
          const unit_generation = item.unit_generation;

          return {
            date: date,
            minute: `${hour}:${minute} ${amPm}`,
            kwh_reading: kwh_reading,
            unit_generation: unit_generation,
          };
        });
      }

      const transformedData = transformData(data);

      res.status(200).json(transformedData);
    } catch (error) {
      console.error("Error fetching power data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  */
};
