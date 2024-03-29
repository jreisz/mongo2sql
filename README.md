# Mongo2SQL

Mongo2SQL is a lightweight MongoDB to SQL translator written in Typescript.

![Screenshot](./public/assets/img/demo.gif)

## Installation

```sh
$ npm i @jreisz/mongo2sql
```

## Example usage

```sh
import { MongoToSQLTranslator } from "@jreisz/mongo2sql";

const exampleQuery1 = `db.collection.find({ name: 'john' })`;
const exampleQuery2 = `db.collection.find({ _id: 23113 }, { name: 1, age: 1 })`;
const exampleQuery3 = `db.collection.find({ age: { \$gte: 21 } }, { name: 1, _id: 1 })`;

console.log(MongoToSQLTranslator.translate(exampleQuery1));
console.log(MongoToSQLTranslator.translate(exampleQuery2));
console.log(MongoToSQLTranslator.translate(exampleQuery3));
```

## Development Mode
In case you want to modify directly the package the steps to install and test functionality are:

```sh
$ npm i
$ npm run tests
```

## Contributing

Changes and improvements are more than welcome! Feel free to fork and open a pull request. Please make your changes in a specific branch and request to pull into `main`! If you can, please make sure the translator fully works before sending the PR, as that will help speed up the process.

## TODO

- Complex Data Types (Date, ObjectId)
- Add more Unit Tests
- Improve design
- Refactoring

## License

[MIT](https://choosealicense.com/licenses/mit/)
