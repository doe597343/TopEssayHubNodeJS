const { response } = require('express');
const { body, validationResult } = require('express-validator');

exports.validateInputs = (request, response, next) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        if("changeStatus" in request.body){
            response.status(401);
        }
        return response.json({ status: false, message : errors['errors'][0].msg });
    }
    next();
}