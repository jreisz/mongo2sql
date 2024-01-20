interface MongoQuery {
    [key: string]: any;
}
export declare class MongoToSQLTranslator {
    /**
     * Translates a MongoDB query to an array of SQL queries.
     * @param query - The MongoDB query object.
     * @param connector - The logical connector for combining queries ('AND' or 'OR').
     * @returns An array of SQL queries.
     */
    private static translateQuery;
    /**
     * Builds a SQL query string from an array of SQL queries.
     * @param query - The SQL query object.
     * @returns A SQL query string.
     */
    private static buildSQL;
    /**
     * Gets the SQL operator corresponding to the given MongoDB operator.
     * @param mongoOperator - The MongoDB operator.
     * @returns The corresponding SQL operator.
     */
    private static getSQLOperator;
    /**
     * Formats a value for SQL, handling arrays and single values.
     * @param value - The value to format.
     * @returns A formatted SQL value string.
     */
    private static formatSQLValue;
    /**
     * Translates a MongoDB query to a complete SQL SELECT statement.
     * @param mongoQuery - The MongoDB query object.
     * @returns A complete SQL SELECT statement.
     */
    static translate(mongoQuery: MongoQuery): string;
}
export {};
