const AWS = require('aws-sdk');
const { configs } = require('../config');
var s3  = new AWS.S3({
    accessKeyId: configs.OSS_ACCESS_KEY,
    secretAccessKey: configs.OSS_SECRET_KEY,
    endpoint: configs.OSS_ENDPOINT
});

module.exports.upload = (files,path) => {
    return new Promise((resolve,reject) => {
        var stream = Buffer.from(files.data, 'binary');
        var params = {
            Key:  files.unique_filename, 
            Body: stream, 
            Bucket: path,
            ACL: "public-read",
            ContentType : files.mimetype,
        };
        s3.putObject(params, function(err, data) {
            if (err)
                reject(err);
            else {
                resolve(data);
            }   
        });
    });
}


module.exports.removeFile = (filename,path) => {
    return new Promise((resolve,reject) => {
        var params = {
            Key: filename,
            Bucket: path
        };
        s3.deleteObject(params, function(err, data){
            if(err !== null) {
                reject(err);
            }else{
                resolve(true);
            }
        });

    });
}

module.exports.fileStat = (filename,path) => {
    return new Promise((resolve,reject) => {
        var params = {
            Bucket: path, 
            Key: filename 
        }
       s3.getObject(params, function(err, data) {
            if (err)
                reject(err);
            else {
                let objectData = data.Body.toString('utf-8');
                resolve({status : true , data : data });
            }   
        });
    });
}


module.exports.createStream = (filename,path) => {
    return new Promise((resolve,reject) => {
        var params = {
            Bucket: path, 
            Key: filename 
        }
        var fileStream = s3.getObject(params).createReadStream();
        resolve(fileStream);
    });
}




