const connection = require('../db');

module.exports.academicLevels = () => {
    return new Promise((resolve,reject)=>{
      connection.query('SELECT id,academic_name FROM academic_levels WHERE status = 1',function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.additionalServices = () => {
    return new Promise((resolve,reject)=>{
      connection.query('SELECT id,service_name,price FROM additional_services WHERE status = 1',function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.paperFormats = () => {
    return new Promise((resolve,reject)=>{
      connection.query('SELECT id,format_name FROM paper_formats WHERE status = 1',function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.spacing = () => {
    return new Promise((resolve,reject)=>{
      connection.query('SELECT id,space_format,word_count FROM spacing',function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.writersCategories = () => {
    return new Promise((resolve,reject)=>{
      connection.query('SELECT * FROM writer_categories',function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.paperTypes = (academicLevelId) => {
    return new Promise((resolve,reject)=>{
      connection.query(`SELECT pc.id,pc.category_name FROM paper_types pt LEFT JOIN
      paper_categories pc ON pc.id = pt.paper_category_id WHERE pt.status = 1 AND pt.academic_level_id = ? `,[academicLevelId],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}


module.exports.subjectTypes = (academicLevelId) => {
    return new Promise((resolve,reject)=>{
      connection.query(`SELECT sc.id,sc.category_name FROM subject_types st LEFT JOIN
      subject_categories sc ON sc.id = st.subject_category_id WHERE st.status = 1 AND st.academic_level_id = ? `,[academicLevelId],function(err,result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    })
}

module.exports.checkAcademicLevelId = (academicLevelId)=>{
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM academic_levels WHERE id = ? and status = 1 `,[academicLevelId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      })
}

module.exports.deadlines = (academicLevelId)=>{
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT d.id,d.deadline,d.duration,CONCAT(d.deadline,' ',d.duration) AS order_deadline FROM prices p LEFT JOIN  
        deadlines d ON d.id = p.deadline_id WHERE d.status = 1 AND p.academic_level_id = ? `,[academicLevelId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      })
}

module.exports.paperTypeCategory = (paperId,academicLevelId) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT pt.id FROM paper_types pt LEFT JOIN paper_categories pc ON pc.id = pt.paper_category_id 
        WHERE pt.academic_level_id = ? AND pc.id = ? `,[academicLevelId,paperId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      })
}

module.exports.subjectTypeCategory = (subjectId,academicLevelId) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT st.id FROM subject_types st LEFT JOIN subject_categories sc ON sc.id = st.subject_category_id 
        WHERE st.academic_level_id = ? AND sc.id = ? `,[academicLevelId,subjectId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.checkPaperId = (paperId) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM paper_categories WHERE id = ? `,[paperId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.checkSubjectId = (subjectId) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM subject_categories WHERE id = ? `,[subjectId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.checkFormatId = (formatId) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM paper_formats WHERE id = ? `,[formatId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.checkSpacingId = (spacingId) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM spacing WHERE id = ? `,[spacingId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.checkDealineId = (deadlineId) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM deadlines WHERE id = ? `,[deadlineId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.getPrices = (academicLevelId,deadlineId) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM prices WHERE academic_level_id = ?  AND deadline_id = ? `,[academicLevelId,deadlineId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.checkWriterCategoryId = (writerCategoryId) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM writer_categories WHERE id = ? `,[writerCategoryId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.getAdditionalServicePrice = (serviceId) =>{
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM additional_services WHERE id = ? `,[serviceId],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}


module.exports.countries = () =>{
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT id,nicename as country_name,phonecode FROM countries`,function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.countryId = (country_id) =>{
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM countries WHERE id = ?`,[country_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.coupon = (coupon_code) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM coupons WHERE coupon_code = ? `,[coupon_code],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}
