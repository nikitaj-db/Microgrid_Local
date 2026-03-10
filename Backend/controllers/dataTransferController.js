var db = require("../config/db");
const SolarController = db.solar_controller;
const SolarTransducer = db.solar_transducer;
const GensetController = db.genset_controller;
const GensetTransducer = db.genset_transducer;
const Mains = db.mains;
const Alert = db.alert;

const isInternetAvailable = require("../utils/internetCheck");
const Url = "http://13.126.205.156:5003/micro";
// const Url = "http://localhost:5001/micro";
const axios = require("axios");

const transferData = async (localModel, apiEndpoint) => {
  try {
    const unsentData = await localModel.findAll({
      where: { data_sent: false },
    });

    if (unsentData.length === 0) {
      console.log(`No unsent data found for ${localModel.name}.`);
      return;
    }

    console.log(
      `Transferring ${unsentData.length} records for ${localModel.name}.`
    );

    for (const record of unsentData) {
      const recordData = record.get({ plain: true });

      console.log(recordData);
      // Send data to the remote server API
      await axios.post(apiEndpoint, [recordData]);
      await record.update({ data_sent: true });
    }

    console.log(`Successfully transferred data for ${localModel.name}.`);
  } catch (error) {
    console.error(
      `Error transferring data for ${localModel.name}:`,
      error.message
    );
  }
};

const transferAllData = async () => {
  const isConnected = await isInternetAvailable();

  if (!isConnected) {
    console.log("No internet connection. Retrying later.");
    return;
  }

  console.log("Internet connection available. Starting data transfer.");

  await transferData(SolarController, `${Url}/solar`);
  await transferData(SolarTransducer, `${Url}/solar`);
  await transferData(GensetController, `${Url}/genset`);
  await transferData(GensetTransducer, `${Url}/genset`);
  await transferData(Mains, `${Url}/mains`);
  await transferData(Alert, `${Url}/alert`);
};

module.exports = { transferAllData };
