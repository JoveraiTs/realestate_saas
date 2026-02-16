const mongoose = require("mongoose");

const connections = {};

/**
 * Connects to a specific tenant database
 */
const connectTenantDB = async (dbName) => {
  if (connections[dbName]) return connections[dbName];

  const dbURI = process.env.MONGO_URI_TEMPLATE
    ? process.env.MONGO_URI_TEMPLATE.replace("<DB_NAME>", dbName)
    : `mongodb://127.0.0.1:27017/${dbName}`;

  const connection = await mongoose.createConnection(dbURI);

  connection.on("connected", () =>
    console.log(`✅ Connected to tenant DB: ${dbName}`)
  );
  connection.on("error", (err) =>
    console.error(`❌ Tenant DB error (${dbName}):`, err)
  );

  connections[dbName] = connection;
  return connection;
};

module.exports = { connectTenantDB };
