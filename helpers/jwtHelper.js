const jwt = require('jsonwebtoken');
const { configs } = require('../config');

exports.encode = (payload) => {
    return jwt.sign({
        data: payload
    }, configs.secret/** , { expiresIn: 60 * 60 }**/);
}

exports.decode = (payload) => {
    return jwt.verify(payload, configs.secret);
}






exports.adminEncode = (payload) => {
    return jwt.sign({
        data: payload
    }, configs.admin_secret/** , { expiresIn: 60 * 60 }**/);
}

exports.adminDecode = (payload) => {
    return jwt.verify(payload, configs.admin_secret);
}