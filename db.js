const Pool = require("pg").Pool

const pool = new Pool({
  connectionString: "postgres://default:vOJ0dtRmSr9u@ep-aged-fog-22802262-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require",
})


// const pool = new Pool({
//   user: "postgres", // Your PostgreSQL username
//   password: "Tamer123", // Your PostgreSQL password
//   host: "localhost", // Your PostgreSQL host (usually localhost)
//   port: 5432, // Your PostgreSQL port (usually 5432)
//   database: "mechamod" // Your PostgreSQL database name
// });

module.exports = pool