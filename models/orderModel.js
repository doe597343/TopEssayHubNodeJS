const connection = require('../db');

module.exports.userOrderExist = (order_id,user_id) =>{
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM orders WHERE id = ? AND user_id = ? AND is_deleted = 0`,[order_id,user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.createOrder = (orderData) => {
    return new Promise((resolve, reject) => {
        connection.query(`INSERT INTO orders SET ? `,[orderData],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result.insertId);
            }
        });
    });
}

module.exports.saveFile = (fileData) => {
    return new Promise((resolve, reject) => {
        connection.query(`INSERT INTO file_uploads SET ? `,[fileData],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result.insertId);
            }
        });
    });
}

module.exports.ordersList = (user_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT 
        o.id,
        o.topic,
        o.total_price,
        o.timestamp,
        d.deadline,
        d.duration,
        o.pages,
        (CASE
            WHEN o.status = 0 THEN "Unpaid"
            WHEN o.status = 1 THEN "Paid"
        END) as status,
        (CASE
            WHEN o.order_status = 0 THEN "Waiting For Payment"
            WHEN o.order_status = 1 THEN "Processing"
            WHEN o.order_status = 2 THEN "Awarded"
            WHEN o.order_status = 3 THEN "Completed"
            WHEN o.order_status = 4 THEN "Revision"
            WHEN o.order_status = 5 THEN "Refunded"
        END) as order_status,
        o.order_status as order_status_id
        FROM orders o 
        LEFT JOIN deadlines d on d.id = o.deadline_id 
        WHERE o.user_id = ? and o.is_deleted = 0 ORDER BY o.timestamp DESC`,[user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.editOrder = (order_id,user_id,editOrder) => {
    return new Promise((resolve,reject)=>{
        connection.query(`UPDATE orders SET ? WHERE id = ? AND user_id = ? `,[editOrder,order_id,user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result.affectedRows);
              }
          });
      });
}

module.exports.checkFileExist = (unique_filename) =>{
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM file_uploads WHERE generated_name = ?`,[unique_filename],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.retrieveFiles = (order_id,from) =>{
    return new Promise((resolve,reject)=>{
        var sql = `SELECT file_name as filename, generated_name as unique_filename FROM file_uploads WHERE order_id = ? AND is_deleted = 0 `;
        if(from == "customer"){
            sql += `AND uploaded_by = 0`;
        }else{
            sql += `AND uploaded_by = 1`;
        }
        connection.query(sql,[order_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.summary = (order_id,user_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT o.*,
        al.academic_name as academic_level,
        pc.category_name as type_of_paper,
        sc.category_name as subject,
        pf.format_name as paper_format,
        s.space_format as paper_spacing,
        wc.writer_category,
        d.deadline,
        d.duration,
        (CASE
            WHEN o.status = 0 THEN "Unpaid"
            WHEN o.status = 1 THEN "Paid"
        END) as payment_status,
        (CASE
            WHEN o.order_status = 0 THEN "Waiting For Payment"
            WHEN o.order_status = 1 THEN "Processing"
            WHEN o.order_status = 2 THEN "Awarded"
            WHEN o.order_status = 3 THEN "Completed"
            WHEN o.order_status = 4 THEN "Revision"
            WHEN o.order_status = 5 THEN "Refunded"
        END) as order_status_description
        FROM orders o 
        LEFT JOIN academic_levels al ON al.id = o.academic_level_id
        LEFT JOIN paper_categories pc ON pc.id = o.paper_type_id
        LEFT JOIN subject_categories sc ON sc.id = o.subject_type_id
        LEFT JOIN paper_formats pf ON pf.id = o.paper_format_id
        LEFT JOIN spacing s ON s.id = o.spacing
        LEFT JOIN deadlines d ON d.id = o.deadline_id
        LEFT JOIN writer_categories wc ON wc.id = o.writer_category_id
        WHERE o.id = ? AND o.user_id = ? AND o.is_deleted = 0`,[order_id,user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
    });
}

module.exports.editUploads = (order_id,user_id,date,generated_name) => {
    return new Promise((resolve,reject)=>{
        connection.query(`UPDATE file_uploads f LEFT JOIN orders o ON o.id = f.order_id 
        SET f.is_deleted = 1, f.date_deleted = ?
        WHERE f.order_id = ? AND o.user_id = ? AND f.is_deleted = 0 AND uploaded_by = 0 AND f.generated_name = ?`,[date,order_id,user_id,generated_name],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result.affectedRows);
              }
          });
      });
}

module.exports.paymentStatus = (paymentData,order_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`UPDATE orders SET ? WHERE id = ? AND (transaction_id IS NULL OR status = 0)`,[paymentData,order_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result.affectedRows);
              }
          });
      });
}

module.exports.noOfUsers = (coupon_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT COUNT(id) as users_used FROM orders WHERE coupon_id = ? AND status = 1 GROUP BY user_id `,[coupon_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.noOfUsage = (coupon_id,user_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT COUNT(id) as usage_count FROM orders WHERE coupon_id = ? AND user_id = ? AND status = 1 `,[coupon_id,user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.newUser = (user_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT COUNT(id) as new_user_order FROM orders WHERE user_id = ? AND status = 1 `,[user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.referral = (referral) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT id,referral_code FROM users WHERE referral_code = ? `,[referral],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.ownReferral = (user_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT id,referral_code FROM users WHERE id = ? `,[user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.couponById = (coupon_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT coupon_code FROM coupons WHERE id = ? `,[coupon_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });

}

module.exports.referralById = (user_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT referral_code FROM users WHERE id = ? `,[user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });

}

module.exports.history = (user_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT 
        id as order_id,
        transaction_id,
        sub_total,
        coupon_discount,
        referral_discount,
        total_price,
        timestamp,
        (CASE
            WHEN order_status = 0 THEN "Waiting For Payment"
            WHEN order_status = 1 THEN "Processing"
            WHEN order_status = 2 THEN "Awarded"
            WHEN order_status = 3 THEN "Completed"
            WHEN order_status = 4 THEN "Revision"
            WHEN order_status = 5 THEN "Refunded"
        END) as order_status_description
        FROM orders WHERE user_id = ? AND transaction_id IS NOT NULL AND status = 1`,[user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.amountPaid = (user_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT SUM(sub_total) AS sub_totals FROM orders WHERE user_id = ? AND status = 1 AND transaction_id IS NOT NULL AND is_deleted = 0 AND order_status NOT IN (0,5) `,[user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.orderUserId = (order_id) =>{
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT user_id FROM orders WHERE id = ?`,[order_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.orderStatus = (data) => {
    return new Promise((resolve, reject) => {
        connection.query(`INSERT INTO order_status SET ? `,[data],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result.insertId);
            }
        });
    });
}

module.exports.writerFile = (order_id , filename) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM file_uploads WHERE order_id = ? AND generated_name = ? AND uploaded_by = 1 AND is_deleted = 0`,[order_id, filename],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.completedDate = (order_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM order_status WHERE order_id = ? AND status = 3 ORDER BY timestamp DESC LIMIT 0, 1`,[order_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.balance = (data) => {
    return new Promise((resolve, reject) => {
        connection.query(`INSERT INTO balance SET ? `,[data],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result.insertId);
            }
        });
    });
}

module.exports.balanceHistory = (user_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM balance WHERE user_id = ? ORDER BY date_created ASC`,[user_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.orderListByStatus = (status) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT 
        o.id as order_id,
        CONCAT(u.firstname , ' ', u.lastname) as customer_name,
        o.transaction_id,
        a.academic_name,
        pc.category_name as paper_type,
        sc.category_name as subject_type,
        o.pages,
        o.slides,
        w.writer_category,
        CONCAT(d.deadline, ' ', d.duration) as deadline,
        o.timestamp,
        o.total_price,
        (CASE
            WHEN o.status = 0 THEN "Unpaid"
            WHEN o.status = 1 THEN "Paid"
        END) as payment_status,
        (CASE
            WHEN o.order_status = 0 THEN "Waiting For Payment"
            WHEN o.order_status = 1 THEN "Processing"
            WHEN o.order_status = 2 THEN "Awarded"
            WHEN o.order_status = 3 THEN "Completed"
            WHEN o.order_status = 4 THEN "Revision"
            WHEN o.order_status = 5 THEN "Refunded"
        END) as order_status_description
        FROM orders o 
        LEFT JOIN academic_levels a ON a.id = o.academic_level_id
        LEFT JOIN paper_categories pc ON pc.id = o.paper_type_id
        LEFT JOIN subject_categories sc ON sc.id = o.subject_type_id
        LEFT JOIN deadlines d ON d.id = o.deadline_id
        LEFT JOIN writer_categories w ON w.id = o.writer_category_id
        LEFT JOIN users u ON u.id = o.user_id
        WHERE o.order_status = ? AND o.is_deleted = 0 ORDER BY o.timestamp DESC`,[status],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.orderDetail = (order_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT 
        CONCAT(u.firstname , ' ', u.lastname) as customer_name,
        u.email,
        o.id as order_id,
        o.transaction_id,
        a.academic_name,
        pc.category_name as paper_type,
        o.other_paper,
        sc.category_name as subject_type,
        o.other_subject,
        o.topic,
        o.paper_instructions,
        o.sources,
        pf.format_name,
        o.other_format,
        s.space_format,
        o.order_status,
        o.timestamp,
        CONCAT(d.deadline, ' ', d.duration) as date_interval,
        d.deadline,
        d.duration,
        w.writer_category,
        o.pages,
        o.slides,
        IF(o.plagiarism_report = 1,'YES','NO') as plagiarism_report,
        IF(o.abstract_page = 1,'YES','NO') as abstract_page,
        IF(o.high_priority_lvl = 1,'YES','NO') as high_priority_lvl,
        (SELECT c.coupon_code FROM coupons c WHERE c.id = o.coupon_id) as coupon_code,
        o.coupon_discount,
        (SELECT us.referral_code FROM users us WHERE us.id = o.referral_id ) as referral_code,
        o.referral_discount,
        o.redeem,
        o.sub_total,
        o.total_price,
        (CASE
            WHEN o.status = 0 THEN "Unpaid"
            WHEN o.status = 1 THEN "Paid"
        END) as payment_status,
        (CASE
            WHEN o.order_status = 0 THEN "Waiting For Payment"
            WHEN o.order_status = 1 THEN "Processing"
            WHEN o.order_status = 2 THEN "Awarded"
            WHEN o.order_status = 3 THEN "Completed"
            WHEN o.order_status = 4 THEN "Revision"
            WHEN o.order_status = 5 THEN "Refunded"
        END) as order_status_description
        FROM orders o 
        LEFT JOIN academic_levels a ON a.id = o.academic_level_id
        LEFT JOIN paper_categories pc ON pc.id = o.paper_type_id
        LEFT JOIN subject_categories sc ON sc.id = o.subject_type_id
        LEFT JOIN deadlines d ON d.id = o.deadline_id
        LEFT JOIN writer_categories w ON w.id = o.writer_category_id
        LEFT JOIN paper_formats pf ON pf.id = o.paper_format_id
        LEFT JOIN spacing s ON s.id = o.spacing
        LEFT JOIN users u ON u.id = o.user_id
        WHERE o.id = ? AND o.is_deleted = 0`,[order_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}
