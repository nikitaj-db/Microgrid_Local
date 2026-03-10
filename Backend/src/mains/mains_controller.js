var db = require("../../config/db");
const Mains = db.mains;
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const BASEURL = "http://localhost:5002/micro";

module.exports = {
  //get all mains
  getMains: async (req, res) => {
    try {
      const records = await fetch(`${BASEURL}/records`);
      const records_json = await records.json();

      const result = await Mains.sequelize.query(
        `
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt") AS hour,
                    AVG(
                      kw_phase1 + kw_phase2 + kw_phase3
                    ) AS avg_kW_per_hour
                    FROM main
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

      const result_power = await Mains.sequelize.query(
        `
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt") AS hour,
                    AVG(
                      kw_phase1 + kw_phase2 + kw_phase3
                    ) AS avg_kW_per_hour
                    FROM main
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

      const result_hours = await Mains.sequelize.query(
        `SELECT
                COUNT(DISTINCT DATE_TRUNC('minute', "createdAt")) AS count
                FROM Main
                WHERE "createdAt" >= CURRENT_DATE - INTERVAL '1 day'
                AND "createdAt" < CURRENT_DATE
                AND kw_phase1 > 0
                AND kw_phase2 > 0
                AND kw_phase3 > 0;                                       
              `,
        { type: Mains.sequelize.QueryTypes.SELECT }
      );

      const totalHours = result_hours[0].count / 60.0;
      const hours = Math.floor(totalHours);

      const minutesFraction = Math.round((totalHours - hours) * 60);
      const minute = minutesFraction / 100;

      const formattedTime = hours + minute;

      //! this will going to divide in current month and till previous month
      /*
      const result_operating_hours = await Mains.sequelize.query(
        `WITH phase1_zero_intervals AS (
                    SELECT 
                        "createdAt",
                        LAG("createdAt") OVER (ORDER BY "createdAt") AS previous_time
                    FROM main
                    WHERE (voltagel->>'phase1')::numeric = 0
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
                    SUM(duration_in_seconds) / 3600 AS total_operating_hours
                FROM time_differences;                                      
              `,
        { type: Mains.sequelize.QueryTypes.SELECT }
      );
      */

      const result_operating_hours = await Mains.sequelize.query(
        `
WITH phase1_zero_intervals AS (
    SELECT 
        "createdAt",
        LAG("createdAt") OVER (ORDER BY "createdAt") AS previous_time
    FROM main
    WHERE 
        voltagel_phase1 = 0
        AND "createdAt" >= DATE_TRUNC('month', CURRENT_DATE)  -- Current month onwards
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
    SUM(duration_in_seconds) / 3600 AS total_operating_hours
FROM time_differences;
              `,
        { type: Mains.sequelize.QueryTypes.SELECT }
      );

      const operating_time = (
        (isNaN(parseFloat(result_operating_hours[0]?.total_operating_hours))
          ? 0
          : parseFloat(result_operating_hours[0]?.total_operating_hours)) +
        parseFloat(records_json.total_operating_hours_mains)
      ).toFixed(2);

      //! this will going to divide in current month and till previous month
      /*
      const result_total = await Mains.sequelize.query(
        `
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt" + INTERVAL '5 hours 30 minutes') AS hour,  -- Truncate to the hour with IST adjustment
                    AVG(
                            (("kW"->>'phase1')::FLOAT + 
                            ("kW"->>'phase2')::FLOAT + 
                            ("kW"->>'phase3')::FLOAT)
                        ) AS avg_kW_per_hour  -- Calculate the average kW per hour
                    FROM 
                    main
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
            `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      */

      const result_total = await Mains.sequelize.query(
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
		MAIN
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
        (isNaN(parseFloat(result_total[0]?.total_generation))
          ? 0
          : parseFloat(result_total[0]?.total_generation)) +
        parseFloat(records_json.total_generation_mains);

      const result_power_before = await Mains.sequelize.query(
        `
                          WITH hourly_avg AS (
                              SELECT 
                              DATE_TRUNC('hour', "createdAt") AS hour,
                              AVG(kw_phase1 + kw_phase2 + kw_phase3) AS avg_kW_per_hour
                              FROM main
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

      const mains = await Mains.findOne({
        order: [["id", "DESC"]],
        limit: 1,
      });

      const kwh = await Mains.findOne({
        where: {
          kwh: {
            [Op.ne]: null,
            [Op.ne]: 0,
          },
        },
        order: [["createdAt", "DESC"]],
      });

      const firstRow = await Mains.findOne({
        order: [["id", "ASC"]],
        where: {
          kwh: {
            [Op.ne]: null,
            [Op.ne]: 0,
          },
        },
        attributes: ["kwh"],
      });

      const lastRow = await Mains.findOne({
        order: [["id", "DESC"]],
        where: {
          kwh: {
            [Op.ne]: null,
            [Op.ne]: 0,
          },
        },
        attributes: ["kwh"],
      });

      if (firstRow && lastRow) {
        const kwhDifference = lastRow.kwh - firstRow.kwh;
        mains.dataValues.kwh_diff = kwhDifference;
      }

      if (kwh) {
        mains.dataValues.kwh = kwh.dataValues.kwh;
      }

      if (mains.dataValues.breaker_status === null) {
        mains.dataValues.breaker_status = "OFF";
      }

      if (mains && result) {
        mains.dataValues.avg_daily_total_generation =
          Math.floor(daily_generation);
      }

      if (result_total) {
        mains.dataValues.avg_total_generation = Math.floor(total);
      }

      if (result_power) {
        mains.dataValues.power_generated_yesterday = power_generation_yesterday;
      }

      if (result_power_before) {
        mains.dataValues.power_generated_before_yesterday =
          power_generation_before_yesterday;
      }

      if (result_hours) {
        mains.dataValues.hours_operated_yesterday = formattedTime.toFixed(2);
      }

      if (result_operating_hours) {
        mains.dataValues.operating_hours =
          parseFloat(operating_time).toFixed(2);
      }

      await Mains.update(
        {
          operating_hours: parseFloat(operating_time).toFixed(2),
          hours_operated: formattedTime.toFixed(2),
        },
        { where: { id: mains.id } }
      );

      return res.status(200).send([mains]);
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  //add mains
  /*
  createMains: async (req, res) => {
    const mainsArray = req.body;

    try {
      const createdMains = [];

      for (const mainsdata of mainsArray) {
        const {
          breaker_status,
          frequency,
          current,
          kVA,
          kW,
          maintainance_last_date,
          next_due,
          operating_hours,
          power_factor,
          voltagel,
          voltagen,
          hours_operated,
        } = mainsdata;

        try {
          const result = await sequelize.query(
            `CALL insert_unique_mains(
                            :v_breaker_status,
                            :v_frequency,
                            :v_current,
                            :v_kVA,
                            :v_kW,
                            :v_maintainance_last_date,
                            :v_next_due,
                            :v_operating_hours,
                            :v_power_factor,
                            :v_voltagel,
                            :v_voltagen,
                            :v_hours_operated,
                            :result_json
                        )`,
            {
              replacements: {
                v_breaker_status: breaker_status,
                v_frequency: frequency,
                v_current: JSON.stringify(current),
                v_kVA: JSON.stringify(kVA),
                v_kW: JSON.stringify(kW),
                v_maintainance_last_date: maintainance_last_date,
                v_next_due: next_due,
                v_operating_hours: operating_hours,
                v_power_factor: power_factor,
                v_voltagel: JSON.stringify(voltagel),
                v_voltagen: JSON.stringify(voltagen),
                v_hours_operated: hours_operated,
                result_json: null,
              },
              type: sequelize.QueryTypes.RAW,
            }
          );

          const mains = result[0][0].result_json;

          const data =
            mains === null ? "Already saved same data in database" : mains;
          createdMains.push(data);
        } catch (innerError) {
          createdMains.push({
            error: `Failed to process data for genset: ${innerError.message}`,
          });
        }
      }
      return res.status(200).send(createdMains);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error.message);
    }
  },
  */

  //view mains by id
  viewMains: async (req, res) => {
    const id = req.params.id;
    try {
      const mains = await Mains.findByPk(id);
      return res.status(200).send(mains);
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  //delete mains by id
  deleteMains: async (req, res) => {
    const id = req.params.id;
    try {
      const mains = await Mains.destroy({ where: { id } });
      return res.status(200).send({
        message: "Deleted Successfully",
      });
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  //mains update by id
  /*
  updateMains: async (req, res) => {
    const id = req.params.id;
    const {
      breaker_status,
      frequency,
      current,
      kVA,
      kW,
      maintainance_last_date,
      next_due,
      notification_alarms,
      operating_hours,
      power_factor,
      shutdown,
      total_generation,
      total_saving,
      total_utilisation,
      utilisation,
      voltagel,
      voltagen,
      hours_operated,
      power_generated,
      daily_generation,
    } = req.body;
    try {
      const mains = await Mains.update(
        {
          breaker_status,
          frequency,
          current,
          kVA,
          kW,
          maintainance_last_date,
          next_due,
          notification_alarms,
          operating_hours,
          power_factor,
          shutdown,
          total_generation,
          total_saving,
          total_utilisation,
          utilisation,
          voltagel,
          voltagen,
          hours_operated,
          power_generated,
          daily_generation,
        },
        {
          where: { id },
        }
      );
      return res.status(200).send({
        message: "Updated Successfully",
      });
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },
  */

  upsertMains: async (req, res) => {
    const mainsArray = req.body;
    const id = req.params.id || null;

    try {
      const processedMains = [];

      for (const mainsdata of mainsArray) {
        const {
          breaker_status,
          frequency,
          operating_hours,
          power_factor,
          hours_operated,
          kwh,
          unit_generated,
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
        } = mainsdata;

        try {
          const result = await sequelize.query(
            `CALL insert_update_main(
                            :p_id,
                            :p_breaker_status,
                            :p_frequency,
                            :p_operating_hours,
                            :p_power_factor,
                            :p_hours_operated,
                            :p_kwh,
                            :p_unit_generated,
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
                p_breaker_status: breaker_status,
                p_frequency: frequency,
                p_operating_hours: operating_hours,
                p_power_factor: power_factor,
                p_hours_operated: hours_operated,
                p_kwh: kwh || null,
                p_unit_generated: unit_generated || null,
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

          const mains = result[0][0].result_json;

          const data =
            mains === null ? "Already saved same data in database" : mains;
          processedMains.push(data);
        } catch (innerError) {
          processedMains.push({
            error: `Failed to process data for mains: ${innerError.message}`,
          });
        }
      }
      return res.status(200).send(processedMains);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error.message);
    }
  },

  getChartData: async (req, res) => {
    try {
      const { fromDate, toDate } = req.body;

      const data = await Mains.sequelize.query(
        `WITH hours AS (
                        SELECT 
                        TO_CHAR(generated_hour, 'YYYY-MM-DD HH24:00:00') AS hour
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
                    LEFT JOIN main s ON 
                        TO_CHAR(s."createdAt", 'YYYY-MM-DD HH24:00:00') = h.hour
                    GROUP BY h.hour
                    ORDER BY h.hour;
              `,
        { type: Mains.sequelize.QueryTypes.SELECT }
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

      const data = await Mains.sequelize.query(
        `
WITH hours AS (
    -- Generate hourly timestamps within the given date range
    SELECT 
        generate_series(
            date_trunc('day', NOW()) + interval '1 hour',  -- start of today + 1 hour
            NOW(),                                         -- current time
            interval '1 hour'
        ) AS generated_hour
),
power_data AS (
    -- Aggregate power data per hour using date_trunc (index friendly)
    SELECT 
        date_trunc('hour', s."createdAt") AS hour,
        MAX(s.unit_generated) AS unit_generated,  -- maximum per hour
        MAX(s.kwh) AS kwh                         -- latest kWh per hour
    FROM main s
    WHERE s."createdAt" >= date_trunc('day', NOW())  -- prune rows for index scan
    GROUP BY hour
)
SELECT 
    TO_CHAR(h.generated_hour, 'YYYY-MM-DD HH24:00:00') AS hour,  -- format only at the end
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
        { type: Mains.sequelize.QueryTypes.SELECT }
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

      const data = await Mains.sequelize.query(
        `
WITH minutes AS (
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
    -- Aggregate power data per 5-minute interval
    SELECT
        DATE_TRUNC('minute', s."createdAt") AS minute,
        MAX(COALESCE(s.unit_generated, 0)) AS unit_generated,
        MAX(COALESCE(s.kwh, 0)) AS kwh
    FROM main s
    GROUP BY DATE_TRUNC('minute', s."createdAt")
),

-- Get the last non-zero reading before the time range starts
last_reading_before_range AS (
    SELECT 
        s.kwh AS kwh_before_range
    FROM main s
    WHERE s."createdAt" < DATE_TRUNC('day', :fromDate::timestamp) + INTERVAL '5 minutes'
      AND s.unit_generated > 0
    ORDER BY s."createdAt" DESC
    LIMIT 1
),

power_with_last_nonzero AS (
    SELECT
        m.minute,
        COALESCE(p.unit_generated, 0) AS unit_generation,
        COALESCE(p.kwh, 0) AS kwh,
        -- Previous non-zero kwh in range
        (SELECT kwh
          FROM power_data p2
          JOIN minutes m2 ON p2.minute = m2.minute
          WHERE m2.minute < m.minute
            AND p2.unit_generated > 0
          ORDER BY m2.minute DESC
          LIMIT 1) AS last_nonzero_kwh_in_range,
        -- kwh from before the range
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
            -- First non-zero in range → diff with before-range kwh
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
          type: Mains.sequelize.QueryTypes.SELECT,
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
