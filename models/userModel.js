const connection = require('../db');


module.exports.levels = () => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM user_levels`,function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}


module.exports.userLevel = (total) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT id,level_name,total,benefit_mode,benefit_value FROM user_levels WHERE  ? >= total ORDER BY total DESC LIMIT 0,1`,[total],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.nextLevel = (total) => {
    return new Promise((resolve, reject) => {
        connection.query(`
        SELECT T.id , T.level_name,T.total FROM 
        (SELECT id,level_name,total FROM user_levels WHERE ? < total ORDER BY total ASC LIMIT 0,1) 
        AS T UNION (SELECT u.id,u.level_name,u.total FROM user_levels u WHERE ? >= u.total and u.id = 4) 
        `,[total,total],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.balanceAdd = (amount,user_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`UPDATE users SET balance = balance + ?  WHERE id = ?`,[amount,user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result.affectedRows);
              }
          });
      });
}

module.exports.balanceDeduct = (amount,user_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`UPDATE users SET balance = balance - ?  WHERE id = ?`,[amount,user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result.affectedRows);
              }
          });
      });
}

module.exports.balance = (user_id) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT balance FROM users WHERE id = ?`,[user_id],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.currentLevel = (user_id) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT CONCAT(firstname, ' ',lastname) as customer_name,level_id,email FROM users WHERE id = ?`,[user_id],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.additionalServicesDiscounts = (current_level_id) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT additional_services_id,discounted_price FROM additional_services_discounts WHERE user_levels_id = ?`,[current_level_id],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.isTester = (user_id) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM testers WHERE user_id = ?`,[user_id],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })


}


