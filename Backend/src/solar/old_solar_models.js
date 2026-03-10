module.exports = (sequelize, DataTypes) => {
  const Solar = sequelize.define(
    "solar",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      //? Controller
      breaker_status: {
        type: DataTypes.STRING,
      },
      frequency: {
        type: DataTypes.STRING,
      },
      //? Controller
      operating_hours: {
        type: DataTypes.STRING,
      },
      //? Transducer but used only 55 times
      power_factor: {
        type: DataTypes.STRING,
      },
      //? Controller
      hours_operated: {
        type: DataTypes.STRING,
      },
      /*
      data_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      */
      kwh: {
        type: DataTypes.INTEGER,
      },
      //? Controller
      unit_generated: {
        type: DataTypes.INTEGER,
      },
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
  return Solar;
};
