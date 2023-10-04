const connection = require('../db');

module.exports.editProfile = (user_id,profileData) => {
    return new Promise((resolve,reject)=>{
        connection.query(`UPDATE users SET ? WHERE id = ? `,[profileData,user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result.affectedRows);
              }
          });
      });
}

module.exports.checkProfile = (user_id) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT u.id,u.firstname,u.lastname,u.email,c.nicename as country_name,c.phonecode,u.phone,u.referral_code,u.profile_pic,u.country_id 
        FROM users u LEFT JOIN countries c ON c.id = u.country_id WHERE u.id = ? `,[user_id],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.checkPassword = (user_id) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT password FROM users WHERE id = ? `,[user_id],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.checkPhone = (user_id) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT country_id,phone FROM users WHERE id = ? `,[user_id],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.checkPicture = (user_id) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT profile_pic FROM users WHERE id = ? `,[user_id],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}