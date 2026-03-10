module.exports = (sequelize, DataTypes) => {
  const Records = sequelize.define(
    "records",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      previous_month: {
        type: DataTypes.STRING,
      },
      total_generation_solar: {
        type: DataTypes.NUMERIC(10, 4),
      },
      total_generation_mains: {
        type: DataTypes.NUMERIC(10, 4),
      },
      total_generation_genset: {
        type: DataTypes.NUMERIC(10, 4),
      },
      total_operating_hours_mains: {
        type: DataTypes.NUMERIC(10, 3),
      },
      savings_mains: {
        type: DataTypes.NUMERIC(10, 2),
      },
      savings_genset: {
        type: DataTypes.NUMERIC(10, 2),
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
    }
  );
  return Records;
};
