export function calculatePercentages(data) {
  const solarGeneration = Number(data.solar);
  const gensetGeneration = Number(data.genset);
  const mainsGeneration = Number(data.mains);

  const totalGeneration = solarGeneration + gensetGeneration + mainsGeneration;

  // console.log(totalGeneration)
  if (!Number.isFinite(totalGeneration) || totalGeneration <= 0) {
    return {
      labels: ["Solar", "Mains", "Genset"],
      values: [0, 0, 0],
    };
  }

  let percentages = [
    (solarGeneration / totalGeneration) * 100 || 0,
    (mainsGeneration / totalGeneration) * 100 || 0,
    (gensetGeneration / totalGeneration) * 100 || 0,
  ];

  //console.log(percentages)
  const totalPercentage = percentages.reduce((acc, val) => acc + val, 0);

  if (totalPercentage !== 100) {
    const adjustment = 100 - totalPercentage;
    percentages[percentages.length - 1] += adjustment;
  }

  return {
    labels: ["Solar", "Mains", "Genset"],
    values: percentages.map((p) => Math.round(p)),
  };
}

export const calculateAverageCurrent = (alldata) => {
  const allValues = [
    Number(alldata.solar.current_phase1),
    Number(alldata.solar.current_phase2),
    Number(alldata.solar.current_phase3),
    Number(alldata.genset.current_phase1),
    Number(alldata.genset.current_phase2),
    Number(alldata.genset.current_phase3),
    Number(alldata.mains.current_phase1),
    Number(alldata.mains.current_phase2),
    Number(alldata.mains.current_phase3),
  ];

  const filteredValues = allValues.filter((val) => val !== 0);

  if (filteredValues.length === 0) {
    const clusterAverage = 0;
    return clusterAverage;
  }

  const arithmeticMean =
    filteredValues.reduce((acc, val) => acc + val, 0) / filteredValues.length;

  const clusterAverage = Math.round(arithmeticMean);

  return clusterAverage;
};

export const calculateAverageVoltageL_L = (alldata) => {
  const allValues = [
    Number(alldata.solar.voltagel_phase1),
    Number(alldata.solar.voltagel_phase2),
    Number(alldata.solar.voltagel_phase3),
    Number(alldata.genset.voltagel_phase1),
    Number(alldata.genset.voltagel_phase2),
    Number(alldata.genset.voltagel_phase3),
    Number(alldata.mains.voltagel_phase1),
    Number(alldata.mains.voltagel_phase2),
    Number(alldata.mains.voltagel_phase3),
  ];

  const filteredValues = allValues.filter((val) => val !== 0);

  if (filteredValues.length === 0) {
    const clusterAverage = 0;
    return clusterAverage;
  }

  const arithmeticMean =
    filteredValues.reduce((acc, val) => acc + val, 0) / filteredValues.length;

  const clusterAverage = Math.round(arithmeticMean);

  return clusterAverage;
};

export const calculateAverageVoltageL_N = (alldata) => {
  const allValues = [
    Number(alldata.solar.voltagen_phase1),
    Number(alldata.solar.voltagen_phase2),
    Number(alldata.solar.voltagen_phase3),
    Number(alldata.genset.voltagen_phase1),
    Number(alldata.genset.voltagen_phase2),
    Number(alldata.genset.voltagen_phase3),
    Number(alldata.mains.voltagen_phase1),
    Number(alldata.mains.voltagen_phase2),
    Number(alldata.mains.voltagen_phase3),
  ];
  const filteredValues = allValues.filter((val) => val !== 0);

  if (filteredValues.length === 0) {
    const clusterAverage = 0;
    return clusterAverage;
  }

  const arithmeticMean =
    filteredValues.reduce((acc, val) => acc + val, 0) / filteredValues.length;

  const clusterAverage = Math.round(arithmeticMean);

  return clusterAverage;
};
