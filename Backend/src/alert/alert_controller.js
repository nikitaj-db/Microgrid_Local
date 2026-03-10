var db = require("../../config/db");
const Alert = db.alert;
const sequelize = db.sequelize;

module.exports = {
  //get all alert
  getAlert: async (req, res) => {
    try {
      const alert = await Alert.findAll();
      return res.status(200).send(alert);
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  //add alert
  /*
    createAlert: async (req, res) => {
        const alertArray = req.body

        try {

            const createdAlert = [];
            for (const alertdata of alertArray) {
                const { fault_code, category, description, severity, status, date_time } = alertdata;

                const date = new Date(date_time);

                // Extract date components
                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = String(date.getFullYear()).slice(-2);

                // Extract time components
                let hours = date.getHours();
                const minutes = String(date.getMinutes()).padStart(2, "0");
                const amPm = hours >= 12 ? "PM" : "AM";
                hours = hours % 12 || 12; // Convert to 12-hour format

                const formattedDate = `${day}-${month}-${year} | ${hours}:${minutes} ${amPm}`;

                try {
                    const result = await sequelize.query(
                        `CALL insert_unique_alert(
                        :v_fault_code,
                        :v_category,
                        :v_description,
                        :v_severity,
                        :v_status,
                        :v_date_time,
                        :result_json
                    )`,
                        {
                            replacements: {
                                v_fault_code: fault_code,
                                v_category: category,
                                v_description: description,
                                v_severity: severity,
                                v_status: status,
                                v_date_time: formattedDate,
                                result_json: null
                            },
                            type: sequelize.QueryTypes.RAW
                        })

                    const alert = result[0][0].result_json;

                    const data = alert === null ? 'Already saved same data in database' : alert;
                    createdAlert.push(data);

                } catch (innerError) {
                    createdAlert.push({ error: `Failed to process data for genset: ${innerError.message}` });
                }
            }
            return res.status(200).send(createdAlert);
        } catch (error) {
            return res.status(400).json(
                error.message
            );
        }
    },
    */

  //view alert by id
  viewAlert: async (req, res) => {
    const id = req.params.id;
    try {
      const alert = await Alert.findByPk(id);
      return res.status(200).send(alert);
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  //delete alert by id
  deleteAlert: async (req, res) => {
    const id = req.params.id;
    try {
      const alert = await Alert.destroy({ where: { id } });
      return res.status(200).send({
        message: "Deleted Successfully",
      });
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },

  // upsert function for creating and updating both at the same time
  upsertAlert: async (req, res) => {
    const alertArray = req.body;
    const id = req.params.id || null;

    try {
      const processedAlert = [];

      for (const alertData of alertArray) {
        const { fault_code, category, description, severity, status } =
          alertData;

        /*
        const [datePart, timePart] = date_time.split(" | ");
        const [dayStr, monthStr, yearStr] = datePart.split("-");
        const [time, amPm] = timePart.split(" ");
        let [hoursStr, minutesStr] = time.split(":");

        let year = parseInt(yearStr, 10) + 2000;
        let month = parseInt(monthStr, 10) - 1;
        let day = parseInt(dayStr, 10);
        let hours = parseInt(hoursStr, 10);
        let minutes = parseInt(minutesStr, 10);

        if (amPm === "PM" && hours < 12) {
          hours += 12;
        } else if (amPm === "AM" && hours === 12) {
          hours = 0;
        }

        const date = new Date(year, month, day, hours, minutes);

        const formattedDay = String(date.getDate()).padStart(2, "0");
        const formattedMonth = String(date.getMonth() + 1).padStart(2, "0");
        const formattedYear = String(date.getFullYear()).slice(-2);

        let formattedHours = date.getHours();
        const formattedMinutes = String(date.getMinutes()).padStart(2, "0");
        const formattedAmPm = formattedHours >= 12 ? "PM" : "AM";
        formattedHours = formattedHours % 12 || 12;

        const formattedDate = `${formattedDay}-${formattedMonth}-${formattedYear} | ${formattedHours}:${formattedMinutes} ${formattedAmPm}`;
        */

        try {
          const result = await sequelize.query(
            `CALL insert_update_alert(
                            :p_id,
                            :p_fault_code,
                            :p_category,
                            :p_description,
                            :p_severity,
                            :p_status,
                            :result_json
                        )`,
            {
              replacements: {
                p_id: id,
                p_fault_code: fault_code,
                p_category: category,
                p_description: description,
                p_severity: severity,
                p_status: status,
                result_json: null,
              },
              type: sequelize.QueryTypes.RAW,
            }
          );

          const alert = result[0][0].result_json;

          const data =
            alert === null ? "Already saved same data in database" : alert;
          processedAlert.push(data);
        } catch (innerError) {
          processedAlert.push({
            error: `Failed to process data for alert: ${innerError.message}`,
          });
        }
      }
      return res.status(200).send(processedAlert);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error.message);
    }
  },
};
