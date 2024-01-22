import { MongoToSQLTranslator } from "../index";

describe("MongoDB to SQL Translator", () => {
  test("throw error on unsupported method", () => {
    const mongoQuery = `db.user.insertOne( { _id: 10, item: "box", qty: 20 } );`;
    const expectedSQL = "INSERT INTO USER(_id,name) VALUES (10,'john')";
    expect(() => {
      MongoToSQLTranslator.translate(mongoQuery);
    }).toThrow(
      'Error: Only the ".find" method is supported. Please use the ".find" method for querying.'
    );
  });
  test("Translate simple query", () => {
    const mongoQuery = `db.user.find({name: 'john'});`;
    const expectedSQL = "SELECT * FROM user WHERE name = 'john';";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });
  test("Translate query with multiple fields", () => {
    const mongoQuery = `db.user.find({ _id: 23113, name: "john", age: 1 });`;
    const expectedSQL =
      "SELECT * FROM user WHERE _id = 23113 AND name = 'john' AND age = 1;";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });
  test("Translate query with $gte operator", () => {
    const mongoQuery = `db.user.find({ age: { $gte: 21 }}, { name: 1, _id: 1 });`;
    const expectedSQL = "SELECT name, _id FROM user WHERE age >= 21;";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });
  test("Translate query with $gt operator", () => {
    const mongoQuery = `db.user.find({ age: { $gt: 21 }}, { name: 1, _id: 1 });`;
    const expectedSQL = "SELECT name, _id FROM user WHERE age > 21;";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });
  test("Translate query with $lt operator", () => {
    const mongoQuery = `db.user.find({ age: { $lt: 21 }}, { name: 1, _id: 1 });`;
    const expectedSQL = "SELECT name, _id FROM user WHERE age < 21;";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });
  test("Translate query with $lte operator", () => {
    const mongoQuery = `db.user.find({ age: { $lte: 21 }}, { name: 1, _id: 1 });`;
    const expectedSQL = "SELECT name, _id FROM user WHERE age <= 21;";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });
  test("Translate query with $or operator", () => {
    const mongoQuery = `db.user.find({ $or: [{ name: "john" }, { name: "alice" }] });`;
    const expectedSQL =
      "SELECT * FROM user WHERE ((name = 'john') OR (name = 'alice'));";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });
  test("Translate query with $and operator", () => {
    const mongoQuery = `db.user.find({ $and: [{ name: "john" }, { age: { $gte: 21 } }] });`;
    const expectedSQL =
      "SELECT * FROM user WHERE ((name = 'john') AND (age >= 21));";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });
  test("Translate query with $ne operator", () => {
    const mongoQuery = `db.user.find({ name: { $ne: "john" } });`;
    const expectedSQL = "SELECT * FROM user WHERE name != 'john';";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });
  test("Translate query with $in operator", () => {
    const mongoQuery = `db.user.find({ name: { $in: ['john', 'peter', 'andrew'] } });`;
    const expectedSQL =
      "SELECT * FROM user WHERE name IN ('john', 'peter', 'andrew');";
    expect(MongoToSQLTranslator.translate(mongoQuery)).toBe(expectedSQL);
  });
});
