const orderModel = require('../models/orderModel');
const jwtHelper = require('../helpers/jwtHelper');
const calculaterController = require('./calculatorController');
const calculatorModel = require('../models/calculatorModel');
const { response } = require('express');
const moment = require('moment');
const awsUploadHelper = require('../helpers/awsUploadHelper');
const connection = require('../db');
const commonHelper = require('../helpers/commonHelper');
const userModel = require('../models/userModel');

module.exports.upload = async(request , response) => {
   try {
        var body = request.body;
        var files = request.files.upload;
        var orderData = body.orderData;
        files.forEach(async element => {
           await awsUploadHelper.upload(element,'customer-uploads');         
        });
        files.forEach(element =>{
            orderData.data.customer_files.push({filename : element.name , unique_filename : element.unique_filename }); 
        });
        return response.json({status : true , message : 'Files Successfully Uploaded', data : jwtHelper.encode(orderData.data)});
    } catch (err) {
        response.json({status : false , message : "Something Went Wrong in Uploading File", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}


module.exports.save = async (request , response) => {
   try {
        var body = request.body;
        var orderData = body.orderData;
        var userData = body.userData;
        var user_id  = userData.data.id;
        orderData = orderData.data;
        if(orderData.paper_id == 31){
            if(!orderData.other_paper){
                return response.json({status : false , message : "Other Paper Field Required"});
            }   
        }else{
            orderData.other_paper = '';
        }
        if(orderData.subject_id == 19){
            if(!orderData.other_subject){
                return response.json({status : false , message : "Other Subject Field Required"});
            }  
        }else{
            orderData.other_subject = '';
        }
        if(orderData.format_id == 6){
            if(!orderData.other_format){
                return response.json({status : false , message : "Other Format Field Required"});
            }
        }else{
            orderData.other_format = '';
        }
        if((!orderData.paper_instructions.match(/(\w+)/g)) || orderData.paper_instructions.match(/(\w+)/g).length < 5){
            return response.json({status : false , message : "Paper Instructions must be at least 5 words"});
        }
        if("order_id" in orderData){
            var order_id = orderData.order_id;
            var userOrderExist = await orderModel.userOrderExist(order_id,user_id);
            if(userOrderExist.length <= 0){
                return response.json({status : false , message : "Order does not Exist"});
            }
            if(userOrderExist[0].status){
                return response.json({status : false , message : "Order is Already Paid and Cannot be Updated"});
            }
            var editOrder = {
                academic_level_id : orderData.academic_level_id,
                paper_type_id : orderData.paper_id,
                other_paper : orderData.other_paper,
                subject_type_id : orderData.subject_id,
                other_subject : orderData.other_subject,
                topic : orderData.topic,
                paper_instructions : orderData.paper_instructions,
                sources : orderData.sources,
                paper_format_id : orderData.format_id,
                other_format : orderData.other_format,
                pages : orderData.pages,
                spacing : orderData.spacing,
                deadline_id : orderData.deadline_id,
                writer_category_id : orderData.writer_category_id,
                slides : orderData.slides,
                plagiarism_report : orderData.plagiarism_report,
                abstract_page : orderData.abstract_page,
                high_priority_lvl : orderData.high_priority,
                total_price : orderData.total_price,
                coupon_id : orderData.coupon_id,
                coupon_discount : orderData.coupon_discount,
                referral_id : orderData.referral_id,
                referral_discount : orderData.referral_discount,
                sub_total : orderData.sub_total,
                redeem : 0
            }
            editOrder = await orderModel.editOrder(order_id,user_id,editOrder);
            if(editOrder){
                if(orderData.customer_files.length > 0){
                    orderData.customer_files.forEach(async element => {
                        var checkFileExist = await orderModel.checkFileExist(element.unique_filename);
                        if(checkFileExist.length <= 0){
                            var checkFile =  await awsUploadHelper.fileStat(element.unique_filename,'customer-uploads');
                            if(checkFile.status){
                                var data = {
                                    order_id : order_id,
                                    file_name : element.filename,
                                    generated_name : element.unique_filename,
                                }
                                await orderModel.saveFile(data); 
                            }
                        }
                    });
                }
                response.json({status : true , message : "Order Successfully Updated" , data: {order_id : order_id }  });
            }
        }else{
            var createOrder = {
                user_id : user_id,
                academic_level_id : orderData.academic_level_id,
                paper_type_id : orderData.paper_id,
                other_paper : orderData.other_paper,
                subject_type_id : orderData.subject_id,
                other_subject : orderData.other_subject,
                topic : orderData.topic,
                paper_instructions : orderData.paper_instructions,
                sources : orderData.sources,
                paper_format_id : orderData.format_id,
                other_format : orderData.other_format,
                pages : orderData.pages,
                spacing : orderData.spacing,
                deadline_id : orderData.deadline_id,
                writer_category_id : orderData.writer_category_id,
                slides : orderData.slides,
                plagiarism_report : orderData.plagiarism_report,
                abstract_page : orderData.abstract_page,
                high_priority_lvl : orderData.high_priority,
                total_price : orderData.total_price,
                coupon_id : orderData.coupon_id,
                coupon_discount : orderData.coupon_discount,
                referral_id : orderData.referral_id,
                referral_discount : orderData.referral_discount,
                sub_total : orderData.sub_total,
                redeem : 0
            }
            var order_id = await orderModel.createOrder(createOrder);
            if(order_id){
                if(orderData.customer_files.length > 0){
                    orderData.customer_files.forEach(async element => {
                        var checkFile =  await awsUploadHelper.fileStat(element.unique_filename,'customer-uploads');
                        if(checkFile.status){
                            var data = {
                                order_id : order_id,
                                file_name : element.filename,
                                generated_name : element.unique_filename,
                            }
                            await orderModel.saveFile(data);
                        }
                    });
                }
                response.json({status : true , message : "Order Successfully Saved" , data: {order_id : order_id }});
            }
        }
    } catch (err) {
        response.json({status : false , message : "Something Went Wrong in Save Order", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.list = async (request,response) => {
    try {
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var list = await orderModel.ordersList(user_id);
        if(list.length > 0){
            response.json({status : true , message : "List Orders Loaded Successfully", data : list});
        }else{
            response.json({status : true , message : "No List of Orders Found", data : [] });
        }     
    } catch (err) {
        response.json({status : false , message : "Something Went Wrong in Orders List", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.summary = async (request,response) => {
    try{
        var params = request.params;
        var order_id = (params.order_id) ? params.order_id : '';
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var summary = await orderModel.summary(order_id,user_id);
        if (summary.length > 0) {
            summary = summary[0];
            var discount_code = '';
            var coupon_message = '';
            var coupon_status = false;
            if(summary.coupon_id){
                discount_code = await orderModel.couponById(summary.coupon_id);
                if(discount_code.length > 0){
                discount_code = discount_code[0].coupon_code;
                }   
            }
            if(summary.referral_id){
                discount_code = await orderModel.referralById(summary.referral_id);
                if(discount_code.length > 0){
                    discount_code = discount_code[0].referral_code;
                }
            }
            if(discount_code && !summary.status && !summary.order_status){
                var checkDiscount = await calculaterController.applyCouponCode(discount_code,user_id,summary.sub_total);
                coupon_status = checkDiscount.status;
                coupon_message = checkDiscount.message;
                if(!checkDiscount.status){
                    var orderData = {
                        coupon_id : 0,
                        referral_id : 0,
                        coupon_discount : 0,
                        referral_discount : 0,
                        total_price : summary.sub_total - summary.redeem
                    }
                    await orderModel.editOrder(summary.id,user_id,orderData);
                }
            }
            summary = await orderModel.summary(order_id,user_id);
            summary = summary[0];
            var date_created = moment(summary.timestamp, 'YYYY-MM-DD');
            var writerFiles = await orderModel.retrieveFiles(summary.id,'writer');
            var customerFiles = await orderModel.retrieveFiles(summary.id,'customer');
            var completed = null;
            if(summary.order_status == 3){
                completed = await orderModel.completedDate(order_id);
                completed = completed[0].timestamp;
            }
            var summary_data = {
                order_id : summary.id,
                transaction_id : summary.transaction_id,
                academic_level : summary.academic_level,
                type_of_paper: summary.type_of_paper,
                other_paper : summary.other_paper,
                subject: summary.subject,
                other_subject : summary.other_subject,
                topic : summary.topic,
                sources: summary.sources,
                paper_format: summary.paper_format,
                other_format : summary.other_format,
                pages : summary.pages,
                paper_spacing: summary.paper_spacing,
                writer_category : summary.writer_category,
                power_point_slides : summary.slides,
                paper_instructions : summary.paper_instructions,
                coupon_discount : summary.coupon_discount,
                referral_discount : summary.referral_discount,
                redeem : summary.redeem,
                sub_total : summary.sub_total,
                total_price : summary.total_price,
                coupon_discount : summary.coupon_discount,
                referral_discount : summary.referral_discount,
                order_status : summary.order_status_description,
                status : summary.payment_status,
                additional_services : [],
                final_deadline : date_created.add(summary.deadline , summary.duration),
                date_created : summary.timestamp,
                deadline : summary.deadline,
                duration : summary.duration,
                date_completed : completed,
                customer_files : (customerFiles.length > 0) ? customerFiles : [],
                writer_files : (writerFiles.length > 0) ? writerFiles : [],
                discount_code : (discount_code) ? discount_code : null,
            }
            if(summary.plagiarism_report){
                summary_data.additional_services.push("Plagiarism Report");
            }
            if(summary.abstract_page){
                summary_data.additional_services.push("Abstract Page");
            }
            if(summary.high_priority_lvl){
                summary_data.additional_services.push("High Priority");
            }
            var getPrices = await calculatorModel.getPrices(summary.academic_level_id,summary.deadline_id);
            if(getPrices.length <= 0){
                return response.json({status : false , message : "Invalid Deadline Category Id"});
            }
            var checkWriterCategoryId = await calculatorModel.checkWriterCategoryId(summary.writer_category_id);
            if(checkWriterCategoryId <= 0 ){
                return response.json({status : false , message : "Invalid Writer Category Id"});
            }
            var writer_price = checkWriterCategoryId[0].price;
            var pageCost = getPrices[0].price;
            var slideCost = 5;
            var slide_total_cost = 0;
            var page_total_cost = 0;
            if(summary.spacing == 2){
                pageCost = (writer_price * summary.pages) + (pageCost * 2);
                slideCost = (writer_price * summary.slides) + (slideCost * 2);
                page_total_cost =  pageCost * summary.pages;
                slide_total_cost = slideCost * summary.slides;
            }else{
                page_total_cost =  (writer_price * summary.pages)  +  (pageCost * summary.pages);
                slide_total_cost = (writer_price * summary.slides)  + (slideCost * summary.slides);
            }

            var plagiarism_price = 0;
            var abstract_price = 0;
            var priority_price = 0;

            var additionalServices = await calculatorModel.additionalServices();
            if(additionalServices.length > 0){
                additionalServices.forEach(element => {
                    if(element.id == 1){
                        plagiarism_price = element.price;
                    }
                    if(element.id == 2){
                        abstract_price =  element.price;
                    }
                    if(element.id == 3){
                        priority_price =  element.price;
                    }
                });
            }

            var currentLevel = await userModel.currentLevel(user_id);
            currentLevel = currentLevel[0];
            var current_level_id = currentLevel.level_id;
            var additionalServicesDiscounts = await userModel.additionalServicesDiscounts(current_level_id);
            if(additionalServicesDiscounts.length > 0){
                additionalServicesDiscounts.forEach(element => {
                    if(element.additional_services_id == 1){
                        plagiarism_price = element.discounted_price;
                    }
                    if(element.additional_services_id == 2){
                        abstract_price =  element.discounted_price;
                    }
                    if(element.additional_services_id == 3){
                        priority_price =  element.discounted_price;
                    }
                });
            }
    
            var order_token = {
                order_id : summary.id,
                academic_level_id : summary.academic_level_id,
                paper_id : summary.paper_type_id,
                other_paper : summary.other_paper,
                subject_id : summary.subject_type_id,
                other_subject : summary.other_subject,
                topic : summary.topic,
                paper_instructions : summary.paper_instructions,
                sources : summary.sources,
                format_id : summary.paper_format_id,
                other_format : summary.other_format,
                pages : summary.pages,
                spacing : summary.spacing,
                deadline_id : summary.deadline_id,
                writer_category_id : summary.writer_category_id,
                slides : summary.slides,
                plagiarism_report : summary.plagiarism_report,
                abstract_page : summary.abstract_page,
                high_priority : summary.high_priority_lvl,
                total_price : summary.total_price,
                sub_total : summary.sub_total,
                coupon_id : summary.coupon_id,
                coupon_discount : summary.coupon_discount,
                referral_id : summary.referral_id,
                referral_discount : summary.referral_discount,
                customer_files : (customerFiles.length > 0) ? customerFiles : [],
                coupon_status : coupon_status,
                coupon_message : coupon_message,
                coupon_code : discount_code,
                cost_per_page : pageCost, 
                cost_per_slide : slideCost,
                page_total_cost : page_total_cost,
                slide_total_cost : slide_total_cost,
                plagiarism_price,
                abstract_price,
                priority_price
            }
            order_token = jwtHelper.encode(order_token);
            response.json({status : true , message : "Order Summary Loaded Successfully", data : {summary_data , order_token} });
        }else{
            response.json({status : false , message : "Order Not Found"});
        }
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Summary", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.removeFile = async(request,response) => {
    try {
        var body = request.body
        var unique_filename = body.unique_filename;
        var orderData = body.orderData;
        var customer_files = orderData.data.customer_files.filter(function(e, i) {
            return e.unique_filename != unique_filename;
        });
        if("order_id" in orderData.data){
            var order_id = orderData.data.order_id;
            var user_id = '';
            try {
                var auth = request.headers.authorization;
                var userData = jwtHelper.decode(auth);
                user_id = userData.data.id;
            } catch (error) {
                return response.json({status : false , message : 'Missing / Invalid Authorization Code'});
            }
            if(user_id){
                await orderModel.editUploads(order_id,user_id,moment().format('YYYY-MM-DD HH:mm:ss'),unique_filename);
            }
        }else{
            var checkFile =  await awsUploadHelper.fileStat(unique_filename,'customer-uploads');
            if(checkFile.status){
                await awsUploadHelper.removeFile(unique_filename,'customer-uploads');
            }
        }
        orderData.data.customer_files = customer_files;
        var order_token = jwtHelper.encode(orderData.data);
        response.json({status : true , message : "Uploaded Files Loaded Successfully", data : {order_token} });
    } catch (err) {
        response.json({status : false , message : "Something Went Wrong in Remove File", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.removeOrder = async (request, response) => {
    try {
        var params = request.params;
        var order_id = (params.order_id) ? params.order_id : '';
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var summary = await orderModel.summary(order_id,user_id);
        if (summary.length > 0) {
            summary = summary[0];
            if(summary.order_status == 0 ){
              await orderModel.editOrder(order_id,user_id,{is_deleted : 1});
              response.json({status : true , message : "Order Successfully Deleted"});
            }else{
                return response.json({status : false , message : `Order is currently ${summary.order_status_description} and Cannot be deleted`});
            }
        }else{
            response.json({status : false , message : "Order Not Found"});
        }
    } catch (err) {
        response.json({status : false , message : "Something Went Wrong in Save Order", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.history = async (request, response) => {
    try {
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var transaction = await orderModel.history(user_id);
        if(transaction.length > 0){
            response.json({status : true , message : "List of Transaction History Loaded Successfully" , data : transaction});
        }else{
            response.json({status : true , message : "No List of Transaction History Found" , data : []});
        }
    } catch (err) {
        response.json({status : false , message : "Something Went Wrong in Save Order", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.downloadFile = async (request , response) => {
    try {
        var query = request.query;
        var order_id = (query.order_id) ? query.order_id : '';
        var filename = (query.filename) ? query.filename : '';
        if(!order_id){
            return response.json({status : false, message : "Missing Order Id Parameter"});
        }
        if(!filename){
           return response.json({status : false, message : "Missing Filename Parameter"});
        }
        var writerFile = await orderModel.writerFile(order_id,filename);
        if(writerFile.length > 0){
            var checkFile = await awsUploadHelper.fileStat(filename,'writer-uploads');
            if(checkFile.status){
                var fileStream =  await awsUploadHelper.createStream(filename,'writer-uploads');
                response.attachment(filename);
                fileStream.pipe(response);
            }else{
                response.json({status : false, message : "File could not be Found"});
            }
        }else{
            response.json({status : false, message : "File could not be Found"});
        }
    } catch (err) {
        response.json({status : false , message : "Something Went Wrong in Downloading File", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.balance = async (request , response) => {
   try {
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var balance = await orderModel.balanceHistory(user_id);
        var history = [];
        if(balance.length > 0){
            var balance_amount  = 0;
            balance.forEach(element => {
                if(element.transaction_type){
                    balance_amount -= element.amount;
                    element.amount = '-' + element.amount;
                }else{
                    balance_amount += element.amount;
                    element.amount = '+' + element.amount;
                }
                var data = {
                    transaction: element.transaction,
                    amount: element.amount,
                    date_created: element.date_created,
                    balance : balance_amount.toFixed(2)
                }
                history.push(data);
            });
            response.json({status : true , message : "List of Balance History Loaded Successfully" , data : history.reverse()});
        }else{
            response.json({status : true , message : "No List of Balance History Found" , data : []});
        }
    }catch (err) {
        response.json({status : false , message : "Something Went Wrong in Getting Balance", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

