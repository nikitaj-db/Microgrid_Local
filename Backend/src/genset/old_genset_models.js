module.exports = (sequelize, DataTypes) => {
  const Genset = sequelize.define(
    "genset",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      //? Controller
      coolant_temp: {
        type: DataTypes.STRING,
      },
      //? Transducer
      frequency: {
        type: DataTypes.STRING,
      },
      //? Controller
      battery_charged: {
        type: DataTypes.STRING,
      },
      //? Controller
      oil_pressure: {
        type: DataTypes.STRING,
      },
      //? Controller
      hours_operated_yesterday: {
        type: DataTypes.STRING,
      },
      //!
      //? Calculated in frontend
      utilisation_factor: {
        type: DataTypes.STRING,
      },
      //!
      //? Controller (It is stored only in 5 rows)
      //* Transducer (Add it in model)
      power_factor: {
        type: DataTypes.STRING,
      },
      //!
      //? Calculated in backend (It is stored only in 5 rows)
      power_generated_yesterday: {
        type: DataTypes.STRING,
      },
      //!
      //? Controller (It is stored only in 5 rows)
      //* Transducer (add it in models and sp)
      critical_load: {
        type: DataTypes.STRING,
      },
      //!
      //? Controller (It is stored only in 5 rows)
      //* Transducer (add it in models and sp)
      non_critical_load: {
        type: DataTypes.STRING,
      },
      //? Controller
      fuel_level: {
        type: DataTypes.STRING,
      },
      //? Controller
      operating_hours: {
        type: DataTypes.STRING,
      },
      total_generation: {
        type: DataTypes.STRING,
      },
      //!
      //? Calculated in frontend kwh * 25
      total_saving: {
        type: DataTypes.STRING,
      },
      //!
      total_consumption: {
        type: DataTypes.STRING,
      },
      //!
      //? It will discard
      tankCapacity: {
        type: DataTypes.STRING,
      },
      //!
      //? Calculated in frontend
      operational: {
        type: DataTypes.STRING,
      },
      //? Controller (Also discard it)
      healthIndex: {
        type: DataTypes.STRING,
      },
      /*
      data_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      */
      //? Transducer (kwh => Total Consumption = Total Generation)
      kwh: {
        type: DataTypes.INTEGER,
      },
      //? Controller
      unit_generated: {
        type: DataTypes.INTEGER,
      },
      //? From here everything is transducer
      kw_phase1: {
        type: DataTypes.DECIMAL(10, 2),
      },
      kw_phase2: {
        type: DataTypes.DECIMAL(10, 2),
      },
      kw_phase3: {
        type: DataTypes.DECIMAL(10, 2),
      },
      kva_phase1: {
        type: DataTypes.DECIMAL(10, 2),
      },
      kva_phase2: {
        type: DataTypes.DECIMAL(10, 2),
      },
      kva_phase3: {
        type: DataTypes.DECIMAL(10, 2),
      },
      current_phase1: {
        type: DataTypes.DECIMAL(10, 2),
      },
      current_phase2: {
        type: DataTypes.DECIMAL(10, 2),
      },
      current_phase3: {
        type: DataTypes.DECIMAL(10, 2),
      },
      voltagel_phase1: {
        type: DataTypes.DECIMAL(10, 2),
      },
      voltagel_phase2: {
        type: DataTypes.DECIMAL(10, 2),
      },
      voltagel_phase3: {
        type: DataTypes.DECIMAL(10, 2),
      },
      voltagen_phase1: {
        type: DataTypes.DECIMAL(10, 2),
      },
      voltagen_phase2: {
        type: DataTypes.DECIMAL(10, 2),
      },
      voltagen_phase3: {
        type: DataTypes.DECIMAL(10, 2),
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
    }
  );
  return Genset;
};
