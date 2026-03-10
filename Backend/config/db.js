const { Sequelize, DataTypes } = require("sequelize");
const dotenv = require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    timezone: "+05:30", // IST timezone
    dialectOptions: {
      timezone: "Asia/Kolkata",
    },
    pool: { max: 20, min: 0, idle: 10000 },
    // dialectOptions: {
    //   ssl: {
    //     require: true, // This will enable SSL connection
    //     rejectUnauthorized: false // This will bypass any SSL validation issues
    //   }
    // },
    logging: false,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.overview = require("../src/overview/overview_models")(sequelize, DataTypes);
// db.solar = require("../src/solar/solar_models")(sequelize, DataTypes);
db.solar_controller = require("../src/solar/solar_models_controller")(
  sequelize,
  DataTypes
);
db.solar_transducer = require("../src/solar/solar_models_tranducer")(
  sequelize,
  DataTypes
);
db.mains = require("../src/mains/mains_models")(sequelize, DataTypes);
// db.genset = require("../src/genset/genset_models")(sequelize, DataTypes);
db.genset_transducer = require("../src/genset/genset_models_tranducer")(
  sequelize,
  DataTypes
);
db.genset_controller = require("../src/genset/genset_models_controller")(
  sequelize,
  DataTypes
);
db.records = require("../src/records/records_models")(sequelize, DataTypes);
db.alert = require("../src/alert/alert_models")(sequelize, DataTypes);

db.sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

module.exports = db;

//let db = mysql.createConnection({
//  host: 'localhost',
//  user: 'root',
//  password: 'sonu',
//  database: 'test',
//});
