const Pool = require("pg").Pool

const pool = new Pool({
    user: "tkhattab1999@gmail.com",
    password: "Tremaster1",
    database: "mechamod",
    host: "https://mechamod-backend-v1-db.fly.dev/",
    port: 3000
})

module.exports = pool