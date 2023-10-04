const connection = require('../db');

module.exports.emailExist = (email) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM admins WHERE email = ? AND status = 1`,[email],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.signup = (data) => {
    return new Promise((resolve, reject) => {
        connection.query(`INSERT INTO admins SET ? `,[data],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result.insertId);
            }
        });
    })
}

module.exports.signin = (email,password) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT id,firstname,lastname,timestamp FROM admins WHERE email = ? AND password = ? AND status = 1`,[email,password],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.orders = (order_id) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM orders WHERE id = ? `,[order_id],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}