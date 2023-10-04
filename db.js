const db = require("mysql");
const { configs } = require('./config');
var connection  = db.createPool({
    connectionLimit : 1,
    waitForConnections : true,
    host     : configs.host,
    user     : configs.user,
    password : configs.password,
    database : configs.database,
    port : configs.db_port,
  });

  try {
    connection.on('acquire', function (connection) {
      
    });
  } catch (error) {
    connection.on('connection', function (connection) {
      console.log('DB Connection established');
      connection.on('error', function (err) {
        console.error(new Date(), 'MySQL error', err.code);
      });
      connection.on('close', function (err) {
        console.error(new Date(), 'MySQL close', err);
      });
    });
  }
  connection.on('enqueue', function () {
    console.log('Waiting for connection');
  });

module.exports = connection;