const { body, validationResult } = require('express-validator');
const authModel = require('../models/authModel');
const calculatorModel = require('../models/calculatorModel');
const {phone} = require('phone');
const jwtHelper = require('../helpers/jwtHelper');
const { uuid } = require('uuidv4');
const profileModel = require('../models/profileModel');
const orderModel = require('../models/orderModel');
const CryptoJS = require("crypto-js");
module.exports.signin = () => {
    return [
        body('email','Invalid Email').isEmail().normalizeEmail(),
        body('password','Invalid Password').notEmpty()
    ]
}

module.exports.signup = () => {
    return [
        body('firstname').trim().notEmpty().withMessage('Invalid Firstname').not().isNumeric().withMessage('Invalid Firstname').isAlpha().withMessage('Invalid Firstname'),
        body('lastname').trim().notEmpty().withMessage('Invalid Lastname').not().isNumeric().withMessage('Invalid Lastname').isAlpha().withMessage('Invalid Lastname'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid Email').custom((value, { req }) => {
            return authModel.emailExist1(value).then(email => {
                if (email.length > 0) {
                    throw new Error('Email Already Exist!');
                }
                return true;
            });
        }),
        body('password').notEmpty().withMessage('Invalid Password').isLength({ min: 6, max: 20 }).withMessage('Password must be minimum of 6 characters and maximum of 20 characters'),
        body('confirm_password').notEmpty().withMessage('Please Confirm your Password').custom((value, { req }) => {
            if(value != req.body.password){
                throw new Error('Confirm Password should match with the current Password!');
            }
            return true;
        }),
        body('country_id',).isNumeric().withMessage("Invalid Country Id").custom((value, { req }) => {
            return calculatorModel.countryId(value).then(country => {
                if (country.length <= 0) {
                    throw new Error('Country Id does not Exist!');
                }
                req.body.iso3 = country[0].iso3;
                req.body.phonecode = country[0].phonecode;
                return true;
            });
        }),
        body('phone').notEmpty().withMessage('Invalid Phone No').isNumeric().isLength({min : 7 , max: 11 }).withMessage('Invalid Phone No').custom((value, { req }) => {
            var phoneNo = '+' + req.body.phonecode + value;
            var validateNo = phone(phoneNo, {country: req.body.iso3 });
            if(!validateNo.isValid){
                throw new Error('Invalid Phone No.');
            }
             return true;
        })
    ]

}

module.exports.upload = () => {
    return [
        body('order_token').not().isEmpty().withMessage('Order Token Required!').custom((value, { req }) => {
            try {
                var result = jwtHelper.decode(value);
                req.body.orderData = result;
                return true;
            } catch (error) {
                throw new Error('Invalid Order Token');
            }
        }),
        body('upload').custom((value, { req }) => {
            const acceptFiles = ['image/webp', 'image/png', 'image/x-citrix-png', 'image/x-png', 'image/jpeg', 'image/x-citrix-jpeg', 'image/gif', 'image/bmp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf', 'text/plain'];
            const allowedExtension = ['webp', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt'];
            const sizeLimit = 10 * 1024 * 1024;
            const files = req.files;
            if(!files){
                throw new Error('Please Select a File to Upload');
            }else{
                var container = [];
                try {
                    files.upload.forEach(element => {
                        var filename = element.name.split('.');
                        var extension = filename[filename.length - 1];
                        if(acceptFiles.includes(element.mimetype) && allowedExtension.includes(extension) && element.size <= sizeLimit){
                            element.unique_filename = uuid() + '.' + element.name;
                            container.push(element);
                        }
                    });
                } catch (error) {
                    var element = [files.upload];
                    var filename = element[0].name.split('.');
                    var extension = filename[filename.length - 1];
                    if(acceptFiles.includes(element[0].mimetype) && allowedExtension.includes(extension) && element[0].size <= sizeLimit){
                        element[0].unique_filename = uuid() + '.' + element[0].name;
                        container.push(element[0]);
                    }
                }
                req.files.upload  = container;
                return true;
            }
        })
    ]
}

module.exports.save = () => {
    return [
        body('order_token').not().isEmpty().withMessage('Order Token Required!').custom((value, { req }) => {
            try {
                var result = jwtHelper.decode(value);
                req.body.orderData = result;
                return true;
            } catch (error) {
                throw new Error('Invalid Order Token');
            }
        }),
    ]
}

module.exports.removeFile = () => {
    return [
        body('order_token').not().isEmpty().withMessage('Order Token Required!').custom((value, { req }) => {
            try {
                var result = jwtHelper.decode(value);
                req.body.orderData = result;
                return true;
            } catch (error) {
                throw new Error('Invalid Order Token');
            }
        }),
        body('unique_filename').not().isEmpty().withMessage('Please Enter Filename').custom((value, { req }) => {
                var customer_files = req.body.orderData.data.customer_files.filter(function(e, i) {
                    return e.unique_filename == value;
                });
                if(customer_files.length == 0){
                    throw new Error('Filename Could not be Found');
                }
                return true;
        }),
    ]
}

module.exports.fullname = () => {
    return [
        body('firstname').trim().notEmpty().withMessage('Invalid Firstname').not().isNumeric().withMessage('Invalid Firstname').isAlpha().withMessage('Invalid Firstname'),
        body('lastname').trim().notEmpty().withMessage('Invalid Lastname').not().isNumeric().withMessage('Invalid Lastname').isAlpha().withMessage('Invalid Lastname'),
    ]
}

module.exports.password = () => {
    return [
        body('old_password').notEmpty().withMessage('Invalid Old Password').custom((value, { req }) => {
            return profileModel.checkPassword(req.body.userData.data.id).then(password => {
                password = password[0].password;
                if(password != CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex)){
                    throw new Error('Invalid Old Password!');
                }
                return true;
            });
        }),
        body('new_password').notEmpty().withMessage('Invalid New Password').isLength({ min: 6, max: 20 }).withMessage('Password must be minimum of 6 characters and maximum of 20 characters').custom((value, { req }) => {
            return profileModel.checkPassword(req.body.userData.data.id).then(password => {
                password = password[0].password;
                var new_password = CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
                if(password == new_password){
                    throw new Error('Old Password Cannot be the same with New Password!');
                }
                req.body.user_password = new_password;
                return true;
            });
        }),
        body('confirm_password').notEmpty().withMessage('Please Confirm your Password').custom((value, { req }) => {
            if(value != req.body.new_password){
                throw new Error('Confirm Password should match with the current Password!');
            }
            return true;
        }),
    ]
}

module.exports.phone = () => {
    return [
        body('country_id',).isNumeric().withMessage("Invalid Country Id").custom((value, { req }) => {
            return calculatorModel.countryId(value).then(country => {
                if (country.length <= 0) {
                    throw new Error('Country Id does not Exist!');
                }
                req.body.iso3 = country[0].iso3;
                req.body.phonecode = country[0].phonecode;
                return true;
            });
        }),
        body('phone').notEmpty().withMessage('Invalid Phone No').isNumeric().isLength({min : 7 , max: 11 }).withMessage('Invalid Phone No').custom((value, { req }) => {
            var phoneNo = '+' + req.body.phonecode + value;
            var validateNo = phone(phoneNo, {country: req.body.iso3 });
            if(!validateNo.isValid){
                throw new Error('Invalid Phone No');
            }
             return true;
        })
    ]
}

module.exports.picture = () => {
    return [
        body('profile_pic').custom((value, { req }) => {
            const acceptFiles = ['image/png','image/x-citrix-png','image/x-png','image/jpeg','image/x-citrix-jpeg','image/bmp',];
            const allowedExtension = ['png','jpg','jpeg','bmp'];
            const sizeLimit = 10 * 1024 * 1024;
            const files = req.files;
            if(!files){
                throw new Error('Please Select a Profile Picture');
            }else{
                var element = files.profile_pic;
                var filename = element.name.split('.');
                var extension = filename[filename.length - 1];
                if(!acceptFiles.includes(element.mimetype)){
                    throw new Error('Invalid File Type');
                }
                if(!allowedExtension.includes(extension)){
                    throw new Error('Invalid File Extension');
                }
                if(element.size > sizeLimit){
                    throw new Error('Invalid File Size');
                }
                req.files.profile_pic.unique_filename = uuid() + '.' + element.name;
                return true;
            }
        })
        
    ]

}

module.exports.socialLogin = () => {
    return [
        body('social_media_type').custom((value, { req }) => {
            if(!['1','2'].includes(value)){
                throw new Error('Invalid Social Media Type');
            }
             return true;
        }),
        body('social_media_id').notEmpty().withMessage('Invalid Social Media Id'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid Email').custom((value, { req }) => {
            return authModel.emailExist(value).then(email => {
                if (email.length > 0) {
                    throw new Error('Email Already Exist!');
                }
                return true;
            });
        }),
        body('firstname','Firstname Required').notEmpty(),
        body('lastname','Lastname Required').notEmpty()
    ]
}


module.exports.forgotPassword = () => {
    return [
        body('email').isEmail().normalizeEmail().withMessage('Invalid Email').custom((value, { req }) => {
            return authModel.emailExist1(value).then(email => {
                if (email.length <= 0) {
                    throw new Error('Email do not Exist / Deactivated');
                }
                return true;
            });
        }),
    ]
}

module.exports.resetPassword = () => {
    return [
        body('email').isEmail().normalizeEmail().withMessage('Invalid Email').custom((value, { req }) => {
            return authModel.emailExist1(value).then(email => {
                if (email.length <= 0) {
                    throw new Error('Email do not Exist / Deactivated');
                }
                return true;
            });
        }),
        body('otp').notEmpty().withMessage('Please Enter Password Reset Code').isNumeric().withMessage('Invalid Password Reset Code').custom((value, { req }) => {
            return authModel.checkOTP(req.body.email,value).then(otp => {
                if(otp.length <= 0){
                    req.body.changeStatus = true;
                    throw new Error('Invalid Password Reset Code');
                }
                req.body.user_id = otp[0].id;
                return true;
            });
        }),
        body('new_password').notEmpty().withMessage('Invalid New Password').isLength({ min: 6, max: 20 }).withMessage('Password must be minimum of 6 characters and maximum of 20 characters').custom((value, { req }) => {
            return profileModel.checkPassword(req.body.user_id).then(password => {
                password = password[0].password;
                var new_password = CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
                if(password == new_password){
                    throw new Error('Old Password Cannot be the same with New Password!');
                }
                req.body.user_password = new_password;
                return true;
            });
        }),
        body('confirm_password').notEmpty().withMessage('Please Confirm your Password').custom((value, { req }) => {
            if(value != req.body.new_password){
                throw new Error('Confirm Password should match with the current Password!');
            }
            return true;
        }),
    ]
}

module.exports.redeem = () => {
    return [
        body('order_id').notEmpty().withMessage('Please Enter Order Id').isNumeric().withMessage('Invalid Order Id').custom((value, { req }) => {
            return orderModel.userOrderExist(value,req.body.userData.data.id).then(orders => {
                if(orders.length <= 0){
                    throw new Error('Order Id Not Found or Invalid');
                }
                if(orders[0].status){
                    throw new Error('Cannot Proceed Redeem Amount Order is Already Paid');
                }
                req.body.orderData = orders[0];
                return true;
            });
        }),
        body('amount').notEmpty().withMessage('Please Enter an Amount').isNumeric().withMessage('Invalid Redeem Value')
    ] 
}

module.exports.contact = () => {
    return [
        body('email').isEmail().normalizeEmail().withMessage('Invalid Email'),
        body('full_name').trim().notEmpty().withMessage('Name Required').not().isNumeric().withMessage('Invalid Name').isAlpha().withMessage('Invalid Name'),
        body('message').trim().notEmpty().withMessage('Message Required')
    ]
}

module.exports.validateHeader = (request, response , next ) => {
    var headers = request.headers;
    var user_token = (headers.authorization) ? headers.authorization : '';
    try {
        var result = jwtHelper.decode(user_token);
        request.body.userData = result;
        next();
    } catch (error) {
        response.status(401).json({status : false , message : 'Missing / Invalid Authorization Code'});
    }
}



/** Admin */

const adminModel = require('../models/adminModel');

module.exports.adminSignup = () => {
    return [
        body('firstname').trim().notEmpty().withMessage('Invalid Firstname').not().isNumeric().withMessage('Invalid Firstname').isAlpha().withMessage('Invalid Firstname'),
        body('lastname').trim().notEmpty().withMessage('Invalid Lastname').not().isNumeric().withMessage('Invalid Lastname').isAlpha().withMessage('Invalid Lastname'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid Email').custom((value, { req }) => {
            return adminModel.emailExist(value).then(email => {
                if (email.length > 0) {
                    throw new Error('Email Already Exist!');
                }
                return true;
            });
        }),
        body('password').notEmpty().withMessage('Invalid Password').isLength({ min: 6, max: 20 }).withMessage('Password must be minimum of 6 characters and maximum of 20 characters'),
        body('confirm_password').notEmpty().withMessage('Please Confirm your Password').custom((value, { req }) => {
            if(value != req.body.password){
                throw new Error('Confirm Password should match with the current Password!');
            }
            return true;
        }),
    ]
}

module.exports.adminSignin = () => {
    return [
        body('email','Invalid Email').isEmail().normalizeEmail(),
        body('password','Invalid Password').notEmpty()
    ]
}

module.exports.orderStatus = () => {
    return [
        body('order_id').notEmpty().withMessage('Please Enter Order Id').isNumeric().withMessage('Invalid Order Id').custom((value, { req }) => {
            return adminModel.orders(value).then(orders => {
                if(!orders[0].status){
                    throw new Error('Cannot Proceed Updating Status Order is not yet Paid');
                }
                req.body.orderData = orders[0];
                return true;
            });
        }),
        body('status').notEmpty().withMessage('Please Enter Order Status').isNumeric().withMessage('Invalid Order Status').custom((value, { req }) => {
            if(!['1','2','3','4','5'].includes(value)){
                throw new Error('Invalid Order Status');
            }
            return true;
        }),
    ]
}

module.exports.adminUpload = () => {
    return [
        body('order_id').notEmpty().withMessage('Please Enter Order Id').isNumeric().withMessage('Invalid Order Id').custom((value, { req }) => {
            return adminModel.orders(value).then(orders => {
                var order_status = ['Waiting For Payment', 'Processing', 'Awarded' , 'Completed', 'Revision' , 'Refunded'];
                if(![2, 3, 4].includes(orders[0].order_status)){
                    throw new Error(`Cannot Proceed Uploading Files For Status ${order_status[orders[0].order_status]} \n (Allowed Status are ${order_status[2]}, ${order_status[3]}, & ${order_status[4]})`);
                }
                return true;
            });
        }),
        body('upload').custom((value, { req }) => {
            const acceptFiles = ['image/webp', 'image/png', 'image/x-citrix-png', 'image/x-png', 'image/jpeg', 'image/x-citrix-jpeg', 'image/gif', 'image/bmp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf', 'text/plain'];
            const allowedExtension = ['webp', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt'];
            const sizeLimit = 10 * 1024 * 1024;
            const files = req.files;
            if(!files){
                throw new Error('Please Select a File to Upload');
            }else{
                var container = [];
                try {
                    files.upload.forEach(element => {
                        var filename = element.name.split('.');
                        var extension = filename[filename.length - 1];
                        if(acceptFiles.includes(element.mimetype) && allowedExtension.includes(extension) && element.size <= sizeLimit){
                            element.unique_filename = uuid() + '.' + element.name;
                            container.push(element);
                        }
                    });
                } catch (error) {
                    var element = [files.upload];
                    var filename = element[0].name.split('.');
                    var extension = filename[filename.length - 1];
                    if(acceptFiles.includes(element[0].mimetype) && allowedExtension.includes(extension) && element[0].size <= sizeLimit){
                        element[0].unique_filename = uuid() + '.' + element[0].name;
                        container.push(element[0]);
                    }
                }
                req.files.upload  = container;
                return true;
            }
        })
    ]
}

module.exports.orderList = () => {
    return [
        body('status').notEmpty().withMessage('Please Enter Order Status').isNumeric().withMessage('Invalid Order Status').custom((value, { req }) => {
            if(!['0','1','2','3','4','5'].includes(value)){
                throw new Error('Invalid Order Status');
            }
            return true;
        }),
    ]
}

module.exports.validateAdminHeader = (request, response , next ) => {
    var headers = request.headers;
    var user_token = (headers.authorization) ? headers.authorization : '';
    try {
        var result = jwtHelper.adminDecode(user_token);
        request.body.userData = result;
        next();
    } catch (error) {
         response.status(401).json({status : false , message : 'Missing / Invalid Authorization Code'});
    }
}

