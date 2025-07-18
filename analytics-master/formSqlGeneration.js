const FORM_ITEM_OPTION_TABLE = 'form_item_option'
const FORM_ITEM_TABLE = 'form_item'

const formItemOptionItemQuery = `
  SELECT fioi.item_template_id, fioi.form_id, GROUP_CONCAT(fio.name) name
  FROM form_item_option_item fioi
  LEFT JOIN form_item_option fio on fioi.item_option_id = fio.id
  GROUP BY fioi.item_template_id, fioi.form_id
`

exports.createValue = ({id}, index) =>
    `IFNULL(${FORM_ITEM_TABLE}_${id}.value, ${FORM_ITEM_OPTION_TABLE}_${id}.name) field_${id}`;

exports.createJoin = ({id}, formTable) => {
  const currentFormItem = `${FORM_ITEM_TABLE}_${id}`
  const currentFormItemOption = `${FORM_ITEM_OPTION_TABLE}_${id}`

  return `
      LEFT JOIN ${FORM_ITEM_TABLE} AS ${currentFormItem}
      ON ${formTable}.id = ${currentFormItem}.form_id
      AND ${currentFormItem}.item_template_id = '${id}'
      LEFT JOIN (
        ${formItemOptionItemQuery}
      ) AS ${currentFormItemOption} 
      ON ${currentFormItem}.form_id = ${currentFormItemOption}.form_id 
      AND ${currentFormItemOption}.item_template_id = '${id}'
      `;
}


exports.createDimension = ({id, name}, index) => {
  return {
    [`field_${id}`]: {
      sql: (CUBE) => `IFNULL(field_${id}, 'Не установлено')`,
      type: `string`,
      title: name
    },
  }
};

