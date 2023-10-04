const userModel = require('../models/userModel');
const orderModel = require('../models/orderModel');
const connection = require('../db');
const commonHelper = require('../helpers/commonHelper');
module.exports.levels = async (request, response) => {
    try{
        var list = await userModel.levels();
        if(list.length > 0 ){
            response.json({status : true , message : "User Levels Loaded Successfully",data : list});
        }else{
            response.json({status : true , message : "No User Levels Found",data : []});
        }
    }catch(err){
        response.json({status : false , message : "Error Occured While Getting List of User Levels", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.level = async (request, response) => {
    try{
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var amountPaid = await orderModel.amountPaid(user_id);
        var total_payment = amountPaid[0].sub_totals;
        var user_level = await userModel.userLevel(total_payment);
        var level_name = '-';
        var id = 0;
        var minimum = 0;
        if(user_level.length > 0){
            id = user_level[0].id;
            level_name = user_level[0].level_name;
            minimum = user_level[0].total;
        }else{
            total_payment = 0;
        }
        var nextLevel = await userModel.nextLevel(total_payment);
        if(nextLevel.length > 0){
           var next_level_id = nextLevel[0].id;
           var next_level_name = nextLevel[0].level_name;
           var maximum = nextLevel[0].total;
        }
        var remaining = maximum - total_payment;
        if(remaining <= 0){
            remaining = maximum;
        }
        var data = { id , level_name, total_payment, next_level_id, next_level_name, minimum, maximum, remaining};
        response.json({status : true , message : "User Levels Loaded Successfully",data : data});
    }catch(err){
        response.json({status : false , message : "Error Occured While Getting User Level", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.balance = async (request , response) => {
    try{
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var balance = await userModel.balance(user_id);
        response.json({status : true , message : "User Balance Loaded Successfully",data : balance[0] });
    }catch(err){
        response.json({status : false , message : "Error Occured While Getting User Balance", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}