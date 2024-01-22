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
      if (key.startsWith("$")) {
        const operator = key as Operator;
        const value = query[key];

        if (operator === "$or" || operator === "$and") {
          const subqueries = value.map((subquery: MongoQuery) =>
            MongoToSQLTranslator.translateQuery(subquery)
          );
          result.push({ field: "", operator, value: subqueries });
        } else {
          throw new Error(`Unsupported logical operator: ${operator}`);
        }
      } else {
        const field = key;

        let value = query[key];
        let operator: "$eq" | "$ne" | "$gt" | "$gte" | "$lt" | "$lte" | "$in" =
          "$eq";

        if (isNaN(query[key])) {
          if (query[key]["$gte"]) {
            value = query[key]["$gte"];
            operator = "$gte";
          } else if (query[key]["$lt"]) {
            value = query[key]["$lt"];
            operator = "$lt";
          } else if (query[key]["$lte"]) {
            value = query[key]["$lte"];
            operator = "$lte";
          } else if (query[key]["$gt"]) {
            value = query[key]["$gt"];
            operator = "$gt";
          } else if (query[key]["$ne"]) {
            value = query[key]["$ne"];
            operator = "$ne";
          } else if (query[key]["$in"]) {
            value = query[key]["$in"];
            operator = "$in";
          }
        }

        result.push({
          field,
          operator,
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
          return `(${subqueries.join(
            ` ${q.operator.toUpperCase().substring(1)} `
          )})`;
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
    try {
      const startIdx = query.indexOf(".find(");
      const endIdx = query.lastIndexOf("})") + 1;

      if (startIdx === -1 || endIdx === -1) {
        throw new Error("Invalid MongoDB query format");
      }

      const queryStr = query.substring(startIdx + 6, endIdx);

      // Split the query into operators and projection parts
      let [operatorsStr, projectionStr] = queryStr.split(/(?<=\}},)\s*(?={)/);
      if (projectionStr) {
        operatorsStr = operatorsStr.substring(0, operatorsStr.length - 1);
      }

      const operators = JSON.parse(
        operatorsStr
          .replace(/(\w+:)|(\w+ :)|(\$\w+:)|(\$\w+ :)/g, function (matchedStr) {
            return '"' + matchedStr.substring(0, matchedStr.length - 1) + '":';
          })
          .replaceAll("'", '"')
      );

      // Parse projection if it exists
      const projection = projectionStr
        ? JSON.parse(
            projectionStr.replace(/(\w+:)|(\w+ :)/g, function (matchedStr) {
              return (
                '"' + matchedStr.substring(0, matchedStr.length - 1) + '":'
              );
            })
          )
        : undefined;

      return {
        operators,
        projection,
      };
    } catch (error) {
      console.error("Error parsing MongoDB query:", error);
      throw new Error("Invalid MongoDB query format");
    }
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
