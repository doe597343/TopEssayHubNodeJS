const adminModel = require('../models/adminModel');
const CryptoJS = require("crypto-js");
const jwtHelper = require('../helpers/jwtHelper');
const orderModel = require('../models/orderModel');
const awsUploadHelper = require('../helpers/awsUploadHelper');
const connection = require('../db');
const commonHelper = require('../helpers/commonHelper');
const moment = require('moment');

module.exports.signup = async(request , response) => {
    try {
        var body = request.body;
        delete body.confirm_password;
        body.password =  CryptoJS.SHA512(body.password).toString(CryptoJS.enc.Hex);
        await adminModel.signup(body);
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
        var signin = await adminModel.signin(email,CryptoJS.SHA512(password).toString(CryptoJS.enc.Hex));
        if(signin && signin.length > 0){
            var jwt = jwtHelper.adminEncode(signin[0]);
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

module.exports.orderStatus = async (request, response) => {
    try {
        var order_status = ['Waiting For Payment', 'Processing', 'Awarded' , 'Completed', 'Revision' , 'Refunded'];
        var body = request.body;
        var status =  parseInt(body.status);
        var orderData = body.orderData;
        var currentOrderStatus = parseInt(orderData.order_status);
        var order_id = orderData.id;
        var cus_user_id = orderData.user_id;
        var userData = body.userData;
        var user_id  = userData.data.id;
        if(currentOrderStatus == status){
            return response.json({status : false , message : `Order is Already in ${order_status[currentOrderStatus]} Status`});
        }
        if(currentOrderStatus == 1 && (status != 2 && status != 5)){
            return response.json({status : false , message : `${order_status[currentOrderStatus]} Status Cannot be Updated to ${order_status[status]} Directly \n (Allowed Status are ${order_status[2]} & ${order_status[5]})`});
        }
        if(currentOrderStatus == 2 && (status != 3 && status != 5 )){
            return response.json({status : false , message : `${order_status[currentOrderStatus]} Status Cannot be Updated to ${order_status[status]} Directly \n (Allowed Status are ${order_status[3]} & ${order_status[5]})`});
        }
        if(currentOrderStatus == 3 && (status != 4 && status != 5 )){
            return response.json({status : false , message : `${order_status[currentOrderStatus]} Status Cannot be Updated to ${order_status[status]} Directly \n (Allowed Status are ${order_status[4]} & ${order_status[5]})`});
        }
        if(currentOrderStatus == 4 && (status != 3 && status != 5 )){
            return response.json({status : false , message : `${order_status[currentOrderStatus]} Status Cannot be Updated to ${order_status[status]} Directly \n (Allowed Status are ${order_status[3]} & ${order_status[5]})`});
        }
        if(currentOrderStatus == 5){
            return response.json({status : false , message : `${order_status[currentOrderStatus]} Status Cannot be Updated to Any Status`});
        }
        orderData = {
            order_status : status,
            status : 1
        }
        await orderModel.editOrder(order_id,cus_user_id,orderData);
        var statusData = {
            order_id : order_id,
            status : status,
            user_id : user_id
        }
        await orderModel.orderStatus(statusData);
        response.json({status : true , message : `Order Status Successfully Updated to ${order_status[status]}`});
    } catch (error) {
        response.json({status : false , message : "Something Went wrong in Updating Order Status", err : error}); 
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.upload = async (request , response) => {
    try {
        var body = request.body;
        var order_id = body.order_id;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var files = request.files.upload;
        files.forEach(async element => {
            var successUpload = await awsUploadHelper.upload(element,'writer-uploads');   
            if(successUpload){
                var checkFile = await awsUploadHelper.fileStat(element.unique_filename,'writer-uploads');
                if(checkFile.status){
                    var data = {
                        order_id : order_id,
                        file_name : element.name,
                        generated_name : element.unique_filename,
                        user_id : user_id,
                        uploaded_by : 1
                    }
                    await orderModel.saveFile(data);
                }
            }
        });
        response.json({status : true , message : 'Files Successfully Uploaded'});
    } catch (err) {
        response.json({status : false , message : "Something Went Wrong in Uploading File", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.orderList = async (request , response) => {
    try{
        var body = request.body;
        var status =  parseInt(body.status);
        var orders = await orderModel.orderListByStatus(status);
        response.json({status : true , message : 'Order List Successfully Loaded' , data : orders});
    } catch (err) {
        console.log(err);
        response.json({status : false , message : "Something Went Wrong in Order List", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.orderDetail = async (request , response) => {
    try{
        var params = request.params;
        var order_id = params.order_id;
        var summary_data = await orderModel.orderDetail(order_id);
        if(summary_data.length > 0){
            var writerFiles = await orderModel.retrieveFiles(order_id,'writer');
            var customerFiles = await orderModel.retrieveFiles(order_id,'customer');
            summary_data  = summary_data[0];
            var date_created = moment(summary_data.timestamp, 'YYYY-MM-DD');
            summary_data.final_deadline = date_created.add(summary_data.deadline , summary_data.duration);
            summary_data.customer_files = customerFiles;
            summary_data.writer_files = writerFiles;
            response.json({status : true , message : 'Order Detail Successfully Loaded' , data : {summary_data : summary_data }});
        }else{
            response.json({status : false , message : 'Order Does not Exist or Deleted'});
        }
    } catch (err) {
        console.log(err);
        response.json({status : false , message : "Something Went Wrong in Order Detail", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
} 