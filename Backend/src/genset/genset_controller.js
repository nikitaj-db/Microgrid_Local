var db = require("../../config/db");
// const Genset = db.genset;
const GensetController = db.genset_controller;
const GensetTransducer = db.genset_transducer;
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const BASEURL = "http://localhost:5002/micro";

module.exports = {
  //get all genset
  getGenset: async (req, res) => {
    try {
      const records = await fetch(`${BASEURL}/records`);
      const records_json = await records.json();

      const result = await GensetTransducer.sequelize.query(
        `
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt") AS hour,
                    AVG(kw_phase1 + kw_phase2 + kw_phase3) AS avg_kW_per_hour
                    FROM genset_transducer
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

      const result_total = await GensetTransducer.sequelize.query(
        `
WITH HOURLY_AVG AS (
	SELECT
		DATE_TRUNC(
			'hour',
			"createdAt"
		) AS HOUR,
		-- Truncate to the hour with IST adjustment
		AVG(kw_phase1 + kw_phase2 + kw_phase3) AS AVG_KW_PER_HOUR -- Calculate the average kW per hour
	FROM
		genset_transducer
	WHERE
		"createdAt" >= DATE_TRUNC('month', CURRENT_TIMESTAMP) -- Start from the earliest available data
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
        (isNaN(parseFloat(result_total[0]?.total_generation))
          ? 0
          : parseFloat(result_total[0]?.total_generation)) +
        parseFloat(records_json.total_generation_genset);

      const result_power = await GensetTransducer.sequelize.query(
        `
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt") AS hour,
                    AVG(
                      (kw_phase1 + kw_phase2 + kw_phase3)
                    ) AS avg_kW_per_hour
                    FROM genset_transducer
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

      const result_hours = await GensetTransducer.sequelize.query(
        `SELECT 
                COUNT(DISTINCT DATE_TRUNC('minute', "createdAt")) AS count 
                FROM genset_transducer
                WHERE "createdAt" >= CURRENT_DATE - INTERVAL '1 day'               
                AND "createdAt" < CURRENT_DATE
                AND kw_phase1 > 0
                AND kw_phase2 > 0
                AND kw_phase3 > 0;
            `,
        { type: GensetTransducer.sequelize.QueryTypes.SELECT }
      );

      const totalHours = result_hours[0].count / 60.0;
      const hours = Math.floor(totalHours);

      const minutesFraction = Math.round((totalHours - hours) * 60);
      const minute = minutesFraction / 100;

      const formattedTime = hours + minute;

      const result_power_before = await GensetTransducer.sequelize.query(
        `
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt") AS hour,
                    AVG(kw_phase1 + kw_phase2 + kw_phase3) AS avg_kW_per_hour
                    FROM genset_transducer
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

      const latestController = await GensetController.findOne({
        where: {
          operating_hours: {
            [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }, { [Op.ne]: "0" }],
          },
        },
        order: [["createdAt", "DESC"]],
      });

      const latestTransducer = await GensetTransducer.findOne({
        where: {
          kwh: { [Op.ne]: null },
        },
        order: [["createdAt", "DESC"]],
      });

      const nonZerokWh = await GensetTransducer.findOne({
        where: {
          kwh: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: 0 }] },
        },
        order: [["createdAt", "DESC"]],
        attributes: ["kwh"],
      });

      if (latestTransducer) {
        latestTransducer.dataValues.kwh = nonZerokWh.kwh;
      }

      const firstRow = await GensetTransducer.findOne({
        order: [["id", "ASC"]],
        where: {
          kwh: {
            [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: 0 }],
          },
        },
        attributes: ["kwh"],
      });

      const lastRow = await GensetTransducer.findOne({
        order: [["id", "DESC"]],
        where: {
          kwh: {
            [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: 0 }],
          },
        },
        attributes: ["kwh"],
      });

      if (firstRow && lastRow) {
        const kwhDifference = lastRow.kwh - firstRow.kwh;
        latestTransducer.dataValues.kwh_diff = kwhDifference;
      }

      // if (kwh) {
      //   genset.dataValues.kwh = kwh.dataValues.kwh;
      // }

      if (latestController && result) {
        latestController.dataValues.avg_daily_total_generation =
          Math.floor(daily_generation);
      }

      if (result_total) {
        latestController.dataValues.avg_total_generation = Math.floor(total);
      }

      // if(result_lastentry){
      //     genset.dataValues.avg_hours_operated = result_lastentry.get('hours_operated');
      // }

      if (result_power) {
        latestController.dataValues.power_generated_yesterday =
          power_generation_yesterday;
      }

      if (result_power_before) {
        latestController.dataValues.power_generated_before_yesterday =
          power_generation_before_yesterday;
      }

      if (result_hours) {
        latestTransducer.dataValues.hours_operated_yesterday =
          formattedTime.toFixed(2);
      }

      if (latestController) {
        await GensetController.update(
          { hours_operated_yesterday: formattedTime.toFixed(2) },
          { where: { id: latestController.id } }
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

  //view genset by id
  viewGensetTransducer: async (req, res) => {
    const id = req.params.id;
    try {
      const genset = await GensetTransducer.findByPk(id);
      return res.status(200).send(genset);
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  viewGensetController: async (req, res) => {
    const id = req.params.id;
    try {
      const genset = await GensetController.findByPk(id);
      return res.status(200).send(genset);
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  //delete genset by id
  deleteGensetTransducer: async (req, res) => {
    const id = req.params.id;
    try {
      await GensetTransducer.destroy({ where: { id } });
      return res.status(200).send({
        message: "Deleted Successfully",
      });
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  deleteGensetController: async (req, res) => {
    const id = req.params.id;
    try {
      await GensetController.destroy({ where: { id } });
      return res.status(200).send({
        message: "Deleted Successfully",
      });
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  // upsert genset
  upsertGenset: async (req, res) => {
    const gensetArray = req.body;
    const id = req.params.id || null;

    try {
      const processedGenset = [];

      for (const gensetData of gensetArray) {
        const {
          coolant_temp,
          battery_charged,
          oil_pressure,
          hours_operated_yesterday,
          power_factor,
          fuel_level,
          operating_hours,
          unit_generated,
          frequency,
          kwh,
          critical_load,
          non_critical_load,
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
        } = gensetData;

        try {
          const results = {};

          // Check if transducer data is provided
          const hasTransducerData =
            frequency ||
            kwh ||
            critical_load ||
            non_critical_load ||
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
            coolant_temp ||
            battery_charged ||
            oil_pressure ||
            hours_operated_yesterday ||
            fuel_level ||
            operating_hours ||
            unit_generated;

          if (hasTransducerData) {
            const transducerResult = await sequelize.query(
              `CALL insert_update_genset_transducer(
              :p_id,
              :p_frequency,
              :p_kwh,
              :p_power_factor,
              :p_critical_load,
              :p_non_critical_load,
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
                  p_kwh: kwh || null,
                  p_power_factor: power_factor,
                  p_critical_load: critical_load,
                  p_non_critical_load: non_critical_load,
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

          // Insert/Update Genset Controller data if provided
          if (hasControllerData) {
            const controllerResult = await sequelize.query(
              `CALL insert_update_genset_controller(
              :p_id,
              :p_coolant_temp,
              :p_battery_charged,
              :p_oil_pressure,
              :p_hours_operated_yesterday,
              :p_power_factor,
              :p_fuel_level,
              :p_operating_hours,
              :p_unit_generated,
              :result_json
            )`,
              {
                replacements: {
                  p_id: id,
                  p_coolant_temp: coolant_temp,
                  p_battery_charged: battery_charged,
                  p_oil_pressure: oil_pressure,
                  p_hours_operated_yesterday: hours_operated_yesterday,
                  p_power_factor: power_factor,
                  p_fuel_level: fuel_level,
                  p_operating_hours: operating_hours,
                  p_unit_generated: unit_generated || null,
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
              "No valid genset data provided for either transducer or controller";
          }

          processedGenset.push(results);
        } catch (innerError) {
          processedGenset.push({
            error: `Failed to process data for genset: ${innerError.message}`,
          });
        }
      }
      return res.status(200).send(processedGenset);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error.message);
    }
  },

  getChartData: async (req, res) => {
    try {
      const { fromDate, toDate } = req.body;

      const data = await GensetTransducer.sequelize.query(
        `
                WITH hours AS (
                    SELECT 
                        TO_CHAR(generated_hour, 'YYYY-MM-DD HH24:00:00') AS hour
                    FROM generate_series(
                        (DATE_TRUNC('day', ${
                          fromDate ? `'${fromDate}'` : "NOW()"
                        } AT TIME ZONE 'Asia/Kolkata') + INTERVAL '1 hour') 
                        AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
                        ${toDate ? `'${toDate}'` : "NOW()"} AT TIME ZONE 'UTC',
                        INTERVAL '1 hour'
                    ) AS generated_hour
                )
                SELECT 
                    h.hour,
                    COALESCE(SUM(
                        GREATEST(kw_phase1, 0) + 
                        GREATEST(kw_phase1, 0) + 
                        GREATEST(kw_phase3, 0)
                    ), 0) AS totalPower,
                    COALESCE(AVG(
                        GREATEST(kw_phase1, 0) + 
                        GREATEST(kw_phase1, 0) + 
                        GREATEST(kw_phase3, 0)
                    ), 0) AS averagePower
                FROM hours h
                LEFT JOIN genset_transducer s 
                    ON TO_CHAR(s."createdAt", 'YYYY-MM-DD HH24:00:00') = h.hour
                GROUP BY h.hour
                ORDER BY h.hour;
                `,
        { type: GensetTransducer.sequelize.QueryTypes.SELECT }
      );

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

      const data = await GensetController.sequelize.query(
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
    -- Aggregate unit_generated from genset_controller using date_trunc
    SELECT 
        date_trunc('hour', gc."createdAt") AS hour,
        MAX(gc.unit_generated) AS unit_generated
    FROM genset_controller gc
    WHERE gc."createdAt" >= date_trunc('day', NOW())  -- prune scan using index
    GROUP BY hour
),
transducer_data AS (
    -- Aggregate kwh from genset_transducer using date_trunc
    SELECT 
        date_trunc('hour', gt."createdAt") AS hour,
        MAX(gt.kwh) AS kwh
    FROM genset_transducer gt
    WHERE gt."createdAt" >= date_trunc('day', NOW())  -- prune scan using index
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
        { type: GensetController.sequelize.QueryTypes.SELECT }
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

      const data = await GensetTransducer.sequelize.query(
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
              genset_controller sc
              FULL OUTER JOIN genset_transducer st
                  ON sc."createdAt" = st."createdAt"
          GROUP BY DATE_TRUNC('minute', COALESCE(sc."createdAt", st."createdAt"))
      ),

      -- Get the last non-zero reading before the time range starts
      last_reading_before_range AS (
          SELECT 
              st.kwh AS kwh_before_range
          FROM genset_controller sc
          JOIN genset_transducer st ON sc."createdAt" = st."createdAt"
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
          type: GensetTransducer.sequelize.QueryTypes.SELECT,
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
