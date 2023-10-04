const profileModel = require('../models/profileModel');
const jwtHelper = require('../helpers/jwtHelper');
const awsUploadHelper = require('../helpers/awsUploadHelper');
const connection = require('../db');
const commonHelper = require('../helpers/commonHelper');
module.exports.fullname = async(request,response) => {
    try{
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var firstname = body.firstname;
        var lastname = body.lastname;
        var checkProfile = await profileModel.checkProfile(user_id);
        if(checkProfile[0].firstname == firstname && checkProfile[0].lastname == lastname){
            return response.json({status : false , message : "No Changes Made"});
        }
        var profileData = {
            firstname : firstname,
            lastname : lastname
        }
        await profileModel.editProfile(user_id,profileData);
        checkProfile = await profileModel.checkProfile(user_id);
        var jwt = jwtHelper.encode(checkProfile[0]);
        response.json({status : true , message : "Fullname Successfully Updated",data : jwt});
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Updating Profile", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.password = async (request , response) => {
    try{
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var password = body.user_password;
        var profileData = {
            password : password
        }
        await profileModel.editProfile(user_id,profileData);
        response.json({status : true , message : "Password Successfully Updated"});
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Updating Password", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.phone = async (request , response) => {
    try{
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var country_id = body.country_id;
        var phone = body.phone;
        var checkPhone = await profileModel.checkPhone(user_id);
        if(checkPhone[0].country_id == country_id && checkPhone[0].phone == phone){
            return response.json({status : false , message : "No Changes Made"});
        }
        var profileData = {
            country_id : country_id,
            phone : phone
        }
        await profileModel.editProfile(user_id,profileData);
        var checkProfile = await profileModel.checkProfile(user_id);
        var jwt = jwtHelper.encode(checkProfile[0]);
        response.json({status : true , message : "Phone Successfully Updated",data : jwt});
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Updating Phone", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.picture = async (request , response) => {
    try{
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var profile_pic = [request.files.profile_pic];
        var checkPicture = await profileModel.checkPicture(user_id);
        if(checkPicture[0].profile_pic){
            await awsUploadHelper.removeFile(checkPicture[0].profile_pic,'customer-profiles-pics');        
        }
        var uploads = await awsUploadHelper.upload(profile_pic[0],'customer-profiles-pics');
        if(uploads){
            var profileData = {
                profile_pic : profile_pic[0].unique_filename
            }
            await profileModel.editProfile(user_id,profileData);
            var checkProfile = await profileModel.checkProfile(user_id);
            var jwt = jwtHelper.encode(checkProfile[0]);
            response.json({status : true , message : "Profile Picture Successfully Updated",data : jwt});
        }
    }catch(err){
        console.log(err);
        response.json({status : false , message : "Something Went Wrong in Updating Profile Picture", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

