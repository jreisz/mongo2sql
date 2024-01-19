import { MongoToSQLTranslator } from "../index";

describe("MongoDB to SQL Translator", () => {
  test("Translate simple query", () => {
    const mongoQuery = { name: "john" };
    const expectedSQL = "SELECT * FROM user WHERE name = 'john';";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });

  test("Translate query with multiple fields", () => {
    const mongoQuery = { _id: 23113, name: 'john', age: 1 };
    const expectedSQL =
      "SELECT * FROM user WHERE _id = 23113 AND name = 'john' AND age = 1;";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });

  test("Translate query with $gte operator", () => {
    const mongoQuery = { age: { $gte: 21 }, name: 1, _id: 1 };
    const expectedSQL =
      "SELECT * FROM user WHERE age >= 21 AND name = 1 AND _id = 1;";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });
});
