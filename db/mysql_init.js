const mysql = require('mysql')

let db = mysql.createPool({host:"tangqi.mysql.polardb.rds.aliyuncs.com",user:"tangqi",password:'123456789aA',port:3306,database:"live"})

module.exports = db