const connection = require('../db');

module.exports.emailExist = (email) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM users WHERE email = ? AND status = 1 AND social_media_type = 0`,[email],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.emailExist1 = (email) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM users WHERE email = ? AND status = 1`,[email],function(err,result){
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
        connection.query(`INSERT INTO users SET ? `,[data],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result.insertId);
            }
        });
    })
}

module.exports.checkReferralCode = (referral_code) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM users WHERE referral_code = ?`,[referral_code],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.signin = (email,password) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT u.id,u.firstname,u.lastname,u.email,c.nicename as country_name,c.phonecode,u.phone,u.referral_code,u.profile_pic,u.country_id
        FROM users u LEFT JOIN countries c ON c.id = u.country_id WHERE u.email = ? AND u.password = ? AND u.status = 1`,[email , password],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.editLevel = (user_id,level_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`UPDATE users SET level_id = ? WHERE id = ?`,[level_id,user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result.affectedRows);
              }
          });
      });
}

module.exports.socialLogin = (social_media_id,email) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT u.id,u.firstname,u.lastname,u.email,c.nicename as country_name,c.phonecode,u.phone,u.referral_code,u.profile_pic,u.country_id
        FROM users u LEFT JOIN countries c ON c.id = u.country_id WHERE u.email = ? AND u.social_media_id = ? AND u.status = 1`,[email , social_media_id],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.checkSocialId = (social_media_id) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM users WHERE social_media_id = ? AND status = 1`,[social_media_id],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.removeAccount = (email,token,social_media_type) => {
    return new Promise((resolve,reject)=>{
        connection.query(`UPDATE users SET status = 0 WHERE email = ? AND token = ? AND social_media_type = ?`,[email, token, social_media_type],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result.affectedRows);
              }
          });
      });
}


module.exports.updateOTP = (email,otp) => {
    return new Promise((resolve,reject)=>{
        connection.query(`UPDATE users SET otp = ? WHERE email = ? AND status = 1`,[otp,email],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result.affectedRows);
              }
          });
      });
}

module.exports.checkOTP = (email,otp) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT id,otp FROM users WHERE email = ? AND otp = ? AND status = 1`,[email,otp],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}