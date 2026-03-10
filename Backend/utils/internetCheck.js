const axios = require("axios");

const isInternetAvailable = async () => {
  try {
    await axios.get("https://www.google.com", { timeout: 2000 });
    console.log(true);
    return true;
  } catch {
    return false;
  }
};

module.exports = isInternetAvailable;
