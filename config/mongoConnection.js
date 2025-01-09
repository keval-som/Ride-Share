import { MongoClient, ServerApiVersion } from "mongodb";
import { mongoConfig as _mongoConfig } from "./settings.js";
const mongoConfig = _mongoConfig;

let _connection = undefined;
let _db = undefined;

const client = new MongoClient(mongoConfig.serverUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const dbConnection = async () => {
  if (!_connection) {
    _connection = await client.connect();
    // _db = await _connection.db(mongoConfig.database);
    _db = await _connection.db(mongoConfig.database);
  }
  return _db;
};

const closeConnection = async () => {
  await _connection.close();
};

export { dbConnection, closeConnection };
