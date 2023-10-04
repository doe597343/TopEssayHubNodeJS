const jwtHelper = require('../helpers/jwtHelper');
module.exports.validateAuth =  async (request , response , next) => {
    try {
        var auth = request.headers.authorization;
        var userData = jwtHelper.decode(auth);
        if(isAuthValid && isAuthValid.length > 0){
             request.auth_data = userData.data;
             next();
        }else{
            response.json({status : false , message : 'Invalid Authorization'});
        }
    } catch (error) {
        response.json({status : false , message : 'Invalid Authorization'});
    }
}