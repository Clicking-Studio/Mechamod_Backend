const Pool = require("pg").Pool

const pool = new Pool({
    connectionString: "postgres://default:vOJ0dtRmSr9u@ep-aged-fog-22802262-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require",
  })

module.exports = pool