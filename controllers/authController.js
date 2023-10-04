const authModel = require('../models/authModel');
const profileModel = require('../models/profileModel');
const jwtHelper = require('../helpers/jwtHelper');
const commonHelper = require('../helpers/commonHelper');
const CryptoJS = require("crypto-js");
const { uuid } = require('uuidv4');
const connection = require('../db');
const mailHelper = require('../helpers/mailHelper');
const { configs } = require('../config');

module.exports.signup = async (request, response) => {
    try {
        var body = request.body;
        delete body.confirm_password;
        delete body.iso3;
        delete body.phonecode;
        body.token =  CryptoJS.HmacSHA1(uuid(), body.email).toString();
        body.password =  CryptoJS.SHA256(body.password).toString(CryptoJS.enc.Hex);
        var referral_code = await commonHelper.randomString(6);
        while (true) {
          var referralCode = await authModel.checkReferralCode(referral_code);
          if(referralCode.length <= 0){
            body.referral_code = referral_code;
            body.otp = await commonHelper.randomString(6,'0123456789');
            break;
          }
          referral_code = await commonHelper.randomString(6);
        }
        await authModel.signup(body);
        var data = {
            to : body.email,
            from : configs.support_email,
            subject : 'Welcome to TopEssayHub - Your account has been created!',
            message : `
Dear ${body.firstname + ' ' + body.lastname},

I am pleased to inform you that your account has been successfully created at TopEssayHub.com! We are thrilled to have you as a member of our writing community.

As a new member of TopEssayHub, you will now have access to a wide range of writing services that we offer, including essay writing, research paper writing, thesis writing, and much more. Our team of experienced and skilled writers is committed to providing you with high-quality, original, and plagiarism-free work that meets your academic needs.

To get started, simply log in to your account using your email address and password that you provided during the signup process. Once logged in, you can place your order and communicate with your assigned writer through our user-friendly platform.

If you have any questions or concerns, please do not hesitate to contact us. Our customer support team is available 24/7 to assist you with any inquiries or issues that you may have.

Thank you for choosing TopEssayHub as your writing partner. We are confident that you will be satisfied with the services we provide.

Best regards,

Zoe
TopEssayHub Team     
 `
        }
        await mailHelper.mail(data);
        response.json({status : true , message : "You have Successfully Created an Account"}); 
    } catch (error) {
        response.json({status : false , message : "Something Went wrong in Sign Up", err : error}); 
    }finally{
        commonHelper.connRelease(connection);
    }
}
module.exports.signin = async (request, response) => {
    try {
        var {email , password } = request.body;
        var signin = await authModel.signin(email,CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex));
        if(signin && signin.length > 0){
            var jwt = jwtHelper.encode(signin[0]);
            response.json({status : true , message : "Account Successfully Sign in",data : jwt });
        }else{
            response.json({status : false , message : "Incorrect Email / Password" });
        }
    } catch (error) {
        response.json({status : false , message : "Something Went wrong in Sign In", err : error}); 
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.socialLogin = async (request , response)=>{
    try {
        var body = request.body;
        var social_media_id = (body.social_media_id) ? body.social_media_id : '';
        var email = (body.email) ? body.email : '';
        var socialLogin = await authModel.socialLogin(social_media_id,email);
        if(socialLogin.length > 0){
            var jwt = jwtHelper.encode(socialLogin[0]);
            response.json({status : true , message : "Account Successfully Sign in",data : jwt });
        }else{
            var emailExist = await authModel.emailExist1(email);
            if(emailExist.length > 0){
                response.json({status : false , message : "Email Already Exist!"});
            }else{
                var checkSocialId = await authModel.checkSocialId(social_media_id);
                if(checkSocialId.length > 0){
                    return response.json({status : false , message : "Account Already Exist!"});
                }
                body.token =  CryptoJS.HmacSHA1(uuid(), body.email).toString();
                var referral_code = await commonHelper.randomString(6);
                while (true) {
                    var referralCode = await authModel.checkReferralCode(referral_code);
                    if(referralCode.length <= 0){
                    body.referral_code = referral_code;
                    body.otp = await commonHelper.randomString(6,'0123456789');
                    break;
                    }
                    referral_code = await commonHelper.randomString(6);
                }
                await authModel.signup(body);
                socialLogin = await authModel.socialLogin(social_media_id,email);
                var jwt = jwtHelper.encode(socialLogin[0]);
                response.json({status : true , message : "Account Successfully Sign in",data : jwt });
            }
        }
    } catch (error) {
        response.json({status : false , message : "Something Went wrong in Social Login", err : error}); 
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.removeAccount = async (request , response) => {
    try {
        var query = request.query;
        var email = (query.email) ? query.email : '';
        var token = (query.token) ? query.token : '';
        var social_media_type = (query.social_media_type) ? query.social_media_type : '';
        var removeAccount = await authModel.removeAccount(email,token,social_media_type);
        if(removeAccount){
            response.json({status : true , message : "Account Successfully Deleted"});
        }else{
            response.json({status : false , message : "Invalid Parameters in Deleting Account"});
        }
    } catch (error) {
        response.json({status : false , message : "Something Went in Removing Account", err : error}); 
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.forgotPassword = async (request , response) => {
    try {
        var body = request.body;
        var email = (body.email) ? body.email : '';
        var otp = await commonHelper.randomString(6,'0123456789');
        await authModel.updateOTP(email,otp);
        var checkUserExist = await authModel.emailExist1(email);
        checkUserExist = checkUserExist[0];
        var data = {
            to : email,
            from : configs.support_email,
            subject : 'TopEssayHub.com Password Reset: Secure Your Account',
            message : `
Dear ${checkUserExist.firstname + ' ' +checkUserExist.lastname},

We have received a request to reset your password for your account at TopEssayHub.com. To ensure the security of your account, we have implemented a One-Time Password (OTP) verification process.

Please use the following OTP code to reset your password: ${checkUserExist.otp} . This code is valid for a one-time use and should be used immediately for security reasons.

To reset your password, please follow the password reset instructions on our website and enter the OTP code when prompted. If you did not request a password reset or have any concerns, please contact our customer support team immediately at ${configs.support_email} .

Thank you for taking steps to secure your account with us. We appreciate your continued trust in TopEssayHub.com.

Best regards,
Zoe
Customer Support Representative
TopEssayHub.com
`
        }
        await mailHelper.mail(data);
        response.json({status : true , message : "Password Reset Code Successfully Sent to your Email"});
    } catch (error) {
        response.json({status : false , message : "Something Went in Sending Password Reset Code", err : error}); 
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.resetPassword = async (request , response) => {
    try{
        var body = request.body;
        var user_id  = body.user_id;
        var password = body.user_password;
        var otp = await commonHelper.randomString(6,'0123456789');
        var profileData = {
            password : password,
            otp : otp
        }
        await profileModel.editProfile(user_id,profileData);
        response.json({status : true , message : "Password Successfully Reset"});
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Password Reset", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.jwtDecoder = async (request , response) => {
    try{
        var query = request.query;
        try{
            var jwt = jwtHelper.decode(query.jwt);
            response.json({status : true , message : "Token Successfully Decoded", data : jwt.data});
        }catch(err){
            response.json({status : false , message : "Missing / Invalid Parameter"});
        }
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Decoding Token", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }




}