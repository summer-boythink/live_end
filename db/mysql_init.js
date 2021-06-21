const mysql = require('mysql')

let db = mysql.createPool({host:"121.5.118.127",user:"root",password:'951753',port:3311,database:"live"})

module.exports = db 