function getCfString(cf, separator = '_') {
  return cf.toFixed(2).split('.').join(separator)
}

function getCFArray() {
  const GAP = 0.01;
  const START_CF = 1;
  const END_CF = 1.6;

  const cfArray = []

  for (let cf = START_CF; cf < END_CF; cf+= GAP) {
    cfArray.push(cf)
  }

  return cfArray;
}

function generateSalaryCFDimensions() {
  return getCFArray().map(cf => {
    const salaryPriceValueString = `salaryPriceValue${getCfString(cf)}`;
    const employeeSumString = `employeeSum${getCfString(cf)}`;
    const profitString = `profit${getCfString(cf)}`;
    const profitabilityString = `profitability${getCfString(cf)}`;

    return ({
      [salaryPriceValueString]: {
        sql: (CUBE) => `IF(${CUBE.isSalaryManual}, ${CUBE.salary}, ${CUBE.salary} * ${cf})`,
        type: `number`,
        title: `ЗП c КФ ${getCfString(cf, '.')}`
      },
      [employeeSumString]: {
        type: `number`,
        sql: (CUBE) => `${CUBE[salaryPriceValueString]} * ${CUBE.volume}`,
        title: `Сумма ЗП c кф ${getCfString(cf, '.')}`
      },
      [profitString]: {
        type: `number`,
        sql: (CUBE) => `${CUBE.clientSum} - ${CUBE[employeeSumString]}`,
        title: `Прибыль с кф ${getCfString(cf, '.')}`
      },
      [profitabilityString]: {
        type: `number`,
        sql: (CUBE) => `IF(${CUBE.clientSum} > 0, 100 * ROUND((${CUBE[profitString]}) / (  ${CUBE.clientSum}), 2), 0)`,
        format: `percent`,
        title: `Рентабельность с кф ${getCfString(cf, '.')}`
      },
    })
  }).reduce((previous,current) => ({
    ...previous,
    ...current
  }), {})
}

function generateSalaryCFMeasures() {
  return getCFArray()
      .map(cf => {
        const profitSumString = `profitSum${getCfString(cf)}`;
        const avgProfitabilityByProjectString = `avgProfitabilityByProject${getCfString(cf)}`;
        const employeeSumMeasureString = `employeeSumMeasure${getCfString(cf)}`;

        return ({
          [profitSumString]: {
            type: `sum`,
            sql: (CUBE) => `${CUBE[`profit${getCfString(cf)}`]}`,
            title: `Прибыль c КФ ${getCfString(cf, '.')}`
          },
          [avgProfitabilityByProjectString]: {
            type: `number`,
            sql: (CUBE) => `${CUBE[profitSumString]} / ${CUBE.clientSumMeasure}`,
            title: `Рентабельность c КФ ${getCfString(cf, '.')}`
          },
          [employeeSumMeasureString]: {
            type: `sum`,
            sql: (CUBE) => `${CUBE[`employeeSum${getCfString(cf)}`]}`,
            title: `ЗП c КФ ${getCfString(cf, '.')}`
          }
        })
      })
      .reduce((previous,current) => ({
        ...previous,
        ...current
      }), {})
}

cube(`WorksProfitability`, {
  extends: Works,
  title: 'Прибыльность работ с КФ',
  dimensions: generateSalaryCFDimensions(),
  measures: generateSalaryCFMeasures()
})
