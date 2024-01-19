type Operator =
  | "$or"
  | "$and"
  | "$lt"
  | "$lte"
  | "$gt"
  | "$gte"
  | "$ne"
  | "$in"
  | "$eq";

interface MongoQuery {
  [key: string]: any;
}

interface SqlQuery {
  field: string;
  operator: Operator;
  value: any;
}

export class MongoToSQLTranslator {
  /**
   * Translates a MongoDB query to an array of SQL queries.
   * @param query - The MongoDB query object.
   * @param connector - The logical connector for combining queries ('AND' or 'OR').
   * @returns An array of SQL queries.
   */
  private static translateQuery(query: MongoQuery): SqlQuery[] {
    const result: SqlQuery[] = [];

    for (const key in query) {
      if (typeof query[key] === "object") {
        const filter = query[key];

        for (const filterKey in filter) {
          if (filterKey.startsWith("$")) {
            const operator = filterKey as Operator;
            const value = filter[filterKey];

            if (operator === "$or" || operator === "$and") {
              const subqueries = value.map((subquery: MongoQuery) =>
                MongoToSQLTranslator.translateQuery(subquery)
              );
              result.push({ field: "", operator, value: subqueries });
            } else {
              const field = key;
              result.push({ field, operator, value });
            }
          }
        }
      } else {
        const field = key;
        const value = query[key];
        result.push({
          field,
          operator: "$eq",
          value,
        });
      }
    }

    return result;
  }

  /**
   * Builds a SQL query string from an array of SQL queries.
   * @param query - The SQL query object.
   * @returns A SQL query string.
   */
  private static buildSQL(query: SqlQuery[]): string {
    return query

      .map((q) => {
        if (q.operator === "$or" || q.operator === "$and") {
          const subqueries = q.value.map(
            (subquery: SqlQuery[]) =>
              `(${MongoToSQLTranslator.buildSQL(subquery)})`
          );
          return `(${subqueries.join(` ${q.operator.toUpperCase()} `)})`;
        } else {
          const operator = MongoToSQLTranslator.getSQLOperator(q.operator);
          return `${q.field} ${operator} ${MongoToSQLTranslator.formatSQLValue(
            q.value
          )}`;
        }
      })
      .join(" AND ");
  }

  /**
   * Gets the SQL operator corresponding to the given MongoDB operator.
   * @param mongoOperator - The MongoDB operator.
   * @returns The corresponding SQL operator.
   */
  private static getSQLOperator(mongoOperator: Operator): string {
    const operatorMap: Record<Operator, string> = {
      $lt: "<",
      $lte: "<=",
      $gt: ">",
      $gte: ">=",
      $ne: "!=",
      $in: "IN",
      $or: "OR",
      $and: "AND",
      $eq: "=",
    };
    return operatorMap[mongoOperator];
  }

  /**
   * Formats a value for SQL, handling arrays and single values.
   * @param value - The value to format.
   * @returns A formatted SQL value string.
   */
  private static formatSQLValue(value: any): string {
    if (Array.isArray(value)) {
      return `(${value.map((v) => `'${v}'`).join(", ")})`;
    } else {
      if (!isNaN(value)) {
        return `${value}`;
      }
      return `'${value}'`;
    }
  }

  /**
   * Translates a MongoDB query to a complete SQL SELECT statement.
   * @param mongoQuery - The MongoDB query object.
   * @returns A complete SQL SELECT statement.
   */
  public static translate(mongoQuery: MongoQuery): string {
    const translatedQuery = MongoToSQLTranslator.translateQuery(mongoQuery);
    return `SELECT * FROM user WHERE ${MongoToSQLTranslator.buildSQL(
      translatedQuery
    )};`;
  }
}
