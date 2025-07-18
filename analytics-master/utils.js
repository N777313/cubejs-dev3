exports.treeCte = function (table, idColumn, parentIdColumn, concatColumn) {
  return `
    WITH RECURSIVE cte (${idColumn}, ${parentIdColumn}, ${concatColumn}, path) AS (
    SELECT 
      ${idColumn},
      ${parentIdColumn},
      ${concatColumn},
      CAST(${concatColumn} AS CHAR(1000)) AS path
    FROM ${table}
    WHERE ${parentIdColumn} IS NULL
    UNION ALL
    SELECT 
      income_table.${idColumn},
      income_table.${parentIdColumn},
      income_table.${concatColumn},
      CAST(CONCAT(cte.${concatColumn}, ',' , income_table.${concatColumn}) AS CHAR(1000)) AS path
    FROM ${table} income_table
    INNER JOIN cte ON cte.${idColumn} = income_table.${parentIdColumn}
  )
  SELECT ${idColumn}, ${parentIdColumn}, ${concatColumn}, path
  FROM cte
  `
}