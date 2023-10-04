const connection = require('../db');

module.exports.contents = (page_name) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT id,page_name,header,content,title,keywords,description,date_created
        FROM pages WHERE page_name = ? AND status = 1`,[page_name],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.faqs = (page_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT id,question,answer,date_created FROM page_faqs WHERE page_id = ? AND status = 1 `,[page_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.subContents = (page_id) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT id,header,content,date_created FROM page_subcontents WHERE page_id = ? AND status = 1 `,[page_id],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.sitemap = (type) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT 
        IF(parent_path IS NULL OR TRIM(parent_path) = '',page_name,CONCAT(page_name)) as loc,
        sitemap_lastmod as lastmod,
        sitemap_changefreq as changefreq, 
        CONVERT(sitemap_priority,char) as priority
        FROM pages WHERE status = 1 AND in_sitemap = 1 AND is_services_page = ? `,[ type ],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.services = (is_services_page) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT page_name
        FROM pages WHERE is_services_page = ? AND status = 1`,[is_services_page],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });
}

module.exports.servicesByPageType = (pageType) => {
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT id,REPLACE(page_name,'-',' ') as page_name,CONCAT('/',page_name) as link
        FROM pages WHERE page_type = ? AND status = 1`,[pageType],function(err,result){
              if(err){
                  reject(err);
              }else{
                  resolve(result);
              }
          });
      });


}