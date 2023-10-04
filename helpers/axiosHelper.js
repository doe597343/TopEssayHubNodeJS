const axios = require('axios');

module.exports.request = (config) => {
    return new Promise((resolve,reject)=>{
        axios(config)
        .then(function (response) {
            resolve({status : true , data : response.data});
        })
        .catch(function (error) {
            console.log(error);
            reject({status : false , data : error});
        });
   })  
}