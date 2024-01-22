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
   * Parses a MongoDB query string and converts it into a TypeScript MongoQuery type.
   *
   * @param {string} query - The MongoDB query string to be parsed.
   * @returns {MongoQuery} - The corresponding TypeScript MongoQuery type.
   */
  private static parseMongoQuery(query: string): {
    operators: MongoQuery;
    projection?: MongoQuery;
  } {
    const arrayOfObjects = query
      .substring(query.indexOf(".find(") + 6, query.length - 2)
      .replace(/(\w+:)|(\w+ :)|(\$\w+:)|(\$\w+ :)/g, function (matchedStr) {
        return '"' + matchedStr.substring(0, matchedStr.length - 1) + '":';
      })
      .replaceAll("'", '"')
      .replace(", ", ",")
      .split(",{");

    if (arrayOfObjects.length > 1) {
      arrayOfObjects[arrayOfObjects.length - 1] =
        "{" + arrayOfObjects[arrayOfObjects.length - 1];
    }

    return {
      operators: JSON.parse(arrayOfObjects[0]),
      projection:
        arrayOfObjects.length > 1 ? JSON.parse(arrayOfObjects[1]) : undefined,
    };
  }

  /**
   * Translates a MongoDB query to a complete SQL SELECT statement.
   * @param {string} query - The MongoDB statement.
   * @returns {string} A complete SQL SELECT statement.
   */
  public static translate(query: string): string {
    //validation
    if (query.indexOf(".find") === -1) {
      throw new Error(
        'Error: Only the ".find" method is supported. Please use the ".find" method for querying.'
      );
    }

    //convert input string into proper types for better readability
    const { operators, projection } =
      MongoToSQLTranslator.parseMongoQuery(query);

    const translatedQuery = MongoToSQLTranslator.translateQuery(operators);

    return `SELECT ${
      !projection ? "*" : Object.keys(projection).join(", ")
    } FROM user WHERE ${MongoToSQLTranslator.buildSQL(translatedQuery)};`;
  }
}
