const { response } = require('express');
const calculatorModel = require('../models/calculatorModel');
const jwtHelper = require('../helpers/jwtHelper');
const orderModel = require('../models/orderModel');
const moment = require('moment');
const connection = require('../db');
const commonHelper = require('../helpers/commonHelper');
const userModel = require('../models/userModel');

module.exports.academicLevels = async (request , response) => {
    try{
        var academicLevels = await calculatorModel.academicLevels();
        if(academicLevels.length > 0){
            response.json({status : true , message : "Academic Levels Loaded Successfully", data : academicLevels});
        }else{
            response.json({status : false , message : "No Academic Levels Found"});
        }
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Display Academic Levels", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.additionalServices = async (request , response) => {
    try{
        var headers = request.headers;
        var user_token = (headers.authorization) ? headers.authorization : '';
        var additionalServices = await calculatorModel.additionalServices();
        if(additionalServices.length > 0){
            if(user_token){
                try {
                    var result = jwtHelper.decode(user_token);
                    var user_id = result.data.id;
                    var currentLevel = await userModel.currentLevel(user_id);
                    currentLevel = currentLevel[0];
                    var current_level_id = currentLevel.level_id;
                    var additionalServicesDiscounts = await userModel.additionalServicesDiscounts(current_level_id);
                    if(additionalServicesDiscounts.length > 0){
                        additionalServicesDiscounts.forEach(element => {
                           if(element.additional_services_id == 1){
                                additionalServices[0].price = element.discounted_price;
                           }
                           if(element.additional_services_id == 2){
                                additionalServices[1].price =  element.discounted_price;
                           }
                           if(element.additional_services_id == 3){
                                additionalServices[2].price = element.discounted_price;
                           }
                        });
                    }
                } catch (error) {
                    return response.json({status : false , message : 'Missing / Invalid Authorization Code'});
                }
            }
            response.json({status : true , message : "Additional Services Loaded Successfully", data : additionalServices});
        }else{
            response.json({status : false , message : "No Additional Services Found"});
        }
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Display Additional Services", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.deadlines = async (request , response) => {
    try{
        var query = request.query;
        var academicLevelId = (query.academic_level_id) ? query.academic_level_id : 0;
        var checkAcademicLevelId = await calculatorModel.checkAcademicLevelId(academicLevelId);
        if(checkAcademicLevelId.length <= 0){
            response.json({status : false , message : "Invalid Academic Level Id"});
        }else{
            var deadlines = await calculatorModel.deadlines(academicLevelId);
            if(deadlines.length > 0){
                response.json({status : true , message : "Deadlines Loaded Successfully", data : deadlines});
            }else{
                response.json({status : false , message : "No Deadlines Found"});
            }
        }
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Display Deadlines", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.paperFormats = async (request , response) => {
    try{
        var paperFormats = await calculatorModel.paperFormats();
        if(paperFormats.length > 0){
            response.json({status : true , message : "Paper Formats Loaded Successfully", data : paperFormats});
        }else{
            response.json({status : false , message : "No Paper Formats Found"});
        }
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Display Paper Formats", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.spacing = async (request , response) => {
    try{
        var spacing = await calculatorModel.spacing();
        if(spacing.length > 0){
            response.json({status : true , message : "Spacing Loaded Successfully", data : spacing});
        }else{
            response.json({status : false , message : "No Spacing Found"});
        }
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Display Spacing", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}


module.exports.writersCategories = async (request , response) => {
    try{
        var writersCategories = await calculatorModel.writersCategories();
        if(writersCategories.length > 0){
            response.json({status : true , message : "Writer Categories Loaded Successfully", data : writersCategories});
        }else{
            response.json({status : false , message : "No Writer Categories Found"});
        }
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Display Writer Categories", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.paperTypes = async (request , response) => {
    try{
        var academic_level_id = request.params.academic_level_id; 
        var paperTypes = await calculatorModel.paperTypes(academic_level_id);
        if(paperTypes.length > 0){
            response.json({status : true , message : "Paper Types Loaded Successfully" , data : paperTypes});
        }else{
            response.json({status : true , message : "Paper Types Loaded Successfully" , data : []});
        }
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Display Paper Types", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.subjectTypes = async (request , response) => {
    try{
        var academic_level_id = request.params.academic_level_id; 
        var subjectTypes = await calculatorModel.subjectTypes(academic_level_id);
        if(subjectTypes.length > 0){
            response.json({status : true , message : "Subject Types Loaded Successfully" , data : subjectTypes});
        }else{
            response.json({status : true , message : "Subject Types Loaded Successfully" , data : []});
        }
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Display Subject Types", err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.calculatePrice = async (request, response) => {
    try{
        var body = request.body;
        var academic_level_id = (body.academic_level_id) ? parseInt(body.academic_level_id) : 1;
        var paper_id = (body.paper_id) ? parseInt(body.paper_id) : 1;
        var subject_id = (body.subject_id) ? parseInt(body.subject_id) : 1;
        var topic = (body.topic) ? body.topic.trim() : '';
        var paper_instructions = (body.paper_instructions) ? body.paper_instructions.trim() : '';
        var sources = (body.sources) ? parseInt(body.sources) : 0;
        var format_id = (body.format_id) ? parseInt(body.format_id) : 1;
        var pages = (body.pages) ? parseInt(body.pages) : 1;
        var spacing = (body.spacing) ? parseInt(body.spacing) : 1;
        var deadline_id = (body.deadline_id) ? parseInt(body.deadline_id) : 1;
        var writer_category_id = (body.writer_category_id) ? parseInt(body.writer_category_id) : 1;
        var slides = (body.slides) ? parseInt(body.slides) : 0;
        var plagiarism_report = (body.plagiarism_report) ? parseInt(body.plagiarism_report) : 0;
        var abstract_page = (body.abstract_page) ? parseInt(body.abstract_page) : 0 ;
        var high_priority = (body.high_priority) ? parseInt(body.high_priority) : 0 ;
        var coupon_code = (body.coupon_code) ? body.coupon_code : '';
        var order_token =  (body.order_token) ? body.order_token : '';
        var headers = request.headers;
        var user_token = (headers.authorization) ? headers.authorization : '';
        var other_paper = (body.other_paper) ? body.other_paper.trim() : '';
        var other_subject = (body.other_subject) ? body.other_subject.trim() : '';
        var other_format = (body.other_format) ? body.other_format.trim() : '';

        if(pages <= 0){
            pages = 1;
        }
        if(academic_level_id == 1 && !body.subject_id){
            subject_id = 1;
        }
        if([2 ,3, 4, 5].includes(academic_level_id) && !body.subject_id){
            subject_id = 28;
        }
        var checkAcademicLevelId =  await calculatorModel.checkAcademicLevelId(academic_level_id);
        if(checkAcademicLevelId.length <= 0){
            return response.json({status : false, message : "Invalid Academic Level Id"});
        }
        var checkPaperId = await calculatorModel.checkPaperId(paper_id);
        if(checkPaperId.length <= 0){
            return response.json({status : false , message : "Invalid Paper Id"});
        }
        var paperTypeCategory = calculatorModel.paperTypeCategory(paper_id,academic_level_id);
        if(paperTypeCategory.length <= 0){
            return response.json({status : false , message : "Invalid Paper Type Category"});
        }
        var checkSubjectId = await calculatorModel.checkSubjectId(subject_id);
        if(checkSubjectId <= 0 ){
            return response.json({status : false , message : "Invalid Subject Id"});
        }
        var subjectTypeCategory = await calculatorModel.subjectTypeCategory(subject_id,academic_level_id);
        if(subjectTypeCategory.length <= 0){
            return response.json({status : false , message : "Invalid Subject Type Category"});
        }
        if(!topic){
            topic = 'Writer\'s Choice';
        }
        var paperFormat = await calculatorModel.checkFormatId(format_id);
        if(paperFormat.length <= 0){
            return response.json({status : false , message : "Invalid Paper Format Id"});
        }
        var checkSpacingId = await calculatorModel.checkSpacingId(spacing);
        if(checkSpacingId <= 0 ){
            return response.json({status : false , message : "Invalid Spacing Id"});
        }
        var checkDealineId = await  calculatorModel.checkDealineId(deadline_id);
        if(checkDealineId <= 0 ){
            return response.json({status : false , message : "Invalid Deadline Id"});
        }
        var getPrices = await calculatorModel.getPrices(academic_level_id,deadline_id);
        if(getPrices.length <= 0){
            return response.json({status : false , message : "Invalid Deadline Category Id"});
        }
        var checkWriterCategoryId = await calculatorModel.checkWriterCategoryId(writer_category_id);
        if(checkWriterCategoryId <= 0 ){
            return response.json({status : false , message : "Invalid Writer Category Id"});
        }
        var writer_price = checkWriterCategoryId[0].price;
        if(![0 ,1].includes(plagiarism_report)){
            return response.json({status : false , message : "Invalid Plagiarism Report Parameter"});
        }
        if(![0 ,1].includes(abstract_page)){
            return response.json({status : false , message : "Invalid Abstract Page Parameter"});
        }
       
        if(![0 ,1].includes(high_priority)){
            return response.json({status : false , message : "Invalid High Priority Pameter"});
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
        var user_id = null;
        if(user_token){
            try {
                var result = jwtHelper.decode(user_token);
                user_id = result.data.id;
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
            } catch (error) {
                return response.json({status : false , message : 'Missing / Invalid Authorization Code'});
            }
        }
        var pageCost = getPrices[0].price;
        var slideCost = 5;
        var slide_total_cost = 0;
        var page_total_cost = 0;
        if(spacing == 2){
            pageCost = (writer_price * pages) + (pageCost * 2);
            slideCost = (writer_price * slides) + (slideCost * 2);
            page_total_cost =  pageCost * pages;
            slide_total_cost = slideCost * slides;
        }else{
            page_total_cost =  (writer_price * pages)  +  (pageCost * pages);
            slide_total_cost = (writer_price * slides)  + (slideCost * slides);
        }
        var totalPrice = page_total_cost + slide_total_cost;
        if(plagiarism_report){
            totalPrice += plagiarism_price;
        }
        if(abstract_page){
            totalPrice += abstract_price;
        }
        if(high_priority){
            totalPrice += priority_price;
        }
        paper_instructions = paper_instructions.replace(/(<([^>]+)>)/gi, "");
        var order_id;
        var customer_files = [];
        if(order_token){
            try {
                var result = jwtHelper.decode(order_token);
                if("order_id" in result.data){
                    order_id = result.data.order_id;
                }
                customer_files = result.data.customer_files;
            } catch (error) {
                return response.json({status : false , message : 'Invalid Order Token'}); 
            }
        } 
        var data = { 
            order_id,
            academic_level_id ,
            paper_id , 
            other_paper,
            subject_id,
            other_subject,
            topic,
            paper_instructions,
            sources,
            format_id,
            other_format,
            pages,
            spacing,
            deadline_id,
            writer_category_id,
            slides,
            plagiarism_report,
            abstract_page,
            high_priority,
            sub_total : Number(totalPrice.toFixed(2)),
            total_price : Number(totalPrice.toFixed(2)),
            coupon_id : 0,
            coupon_discount : 0.00,
            referral_id : 0,
            referral_discount : 0.00,
            customer_files : customer_files,
            coupon_status : false,
            coupon_message : '',
            coupon_code : '',
            cost_per_page : pageCost, 
            cost_per_slide : slideCost,
            page_total_cost : page_total_cost,
            slide_total_cost : slide_total_cost,
            plagiarism_price,
            abstract_price,
            priority_price
        }
        if(coupon_code){
            var applyCoupon = await applyCouponCode(coupon_code,user_id,data.total_price);
            if(applyCoupon.status){
                var coupon_data = applyCoupon.data;
                data.coupon_id = coupon_data.coupon_id,
                data.coupon_discount = coupon_data.coupon_discount;
                data.referral_id = coupon_data.referral_id;
                data.referral_discount = coupon_data.referral_discount;
                data.total_price = coupon_data.total_price;
                data.coupon_message = applyCoupon.message;
                data.coupon_status = applyCoupon.status;
            }else{
                data.coupon_status = applyCoupon.status;
                data.coupon_message = applyCoupon.message;
            }
            data.coupon_code = coupon_code;
        }
        data = jwtHelper.encode(data);
        response.json({status : true , message : "Price Successfully Calculated" , data : data});
    }catch(err){
        response.json({status : false , message : "Something went Wrong in Price Calculation" , err : err});
    }finally{
        commonHelper.connRelease(connection);
    }
}

module.exports.countries = async(request,response) => {
 try {
   var countries = await calculatorModel.countries();
   if(countries.length <= 0){
     return response.json({status : false , message : "No Data Found"});
   } 
    response.json({status : true , message : "Countries Successfully Loaded", data : countries});
 } catch (err) {
    response.json({status : false , message : "Something Went Wrong in Display Countries", err : err});
 }finally{
    commonHelper.connRelease(connection);
}
}

async function applyCouponCode(coupon_code,user_id = null,total_price){
    var coupon = await calculatorModel.coupon(coupon_code);
    if(coupon.length > 0){
        coupon = coupon[0];
        var status = coupon.status;
        if(!status){
            return {status : false , message : 'Coupon Code is Already Inactive'};
        }
        var start_date = coupon.start_date;
        var end_date =  coupon.end_date;
        var current_date = moment().format('YYYY-MM-DD');
        if(current_date < start_date){
            return {status : false , message : 'Coupon Code is Not Available to Use'};
        }
        if(current_date > end_date){
            return {status : false , message : 'Coupon Code is Expired'};
        }
        var coupon_id = coupon.id;
        var no_of_users = coupon.no_of_users;
        var noOfUsers = await orderModel.noOfUsers(coupon_id);
        if(noOfUsers.length > 0){
            if(noOfUsers[0].users_used >= no_of_users ){
                return {status : false , message : 'Coupon has Maxed Out'};
            }
        }
        var no_of_usage = coupon.no_of_usage;
        if(user_id){
            var noOfUsage = await orderModel.noOfUsage(coupon_id,user_id);
            if(noOfUsage.length > 0){
                if(noOfUsage[0].usage_count >= no_of_usage){
                    return {status : false , message : 'Coupon has Runned Out'};
                }
            }
            var coupon_for = coupon.coupon_for;
            var newUserOrder = await orderModel.newUser(user_id);
            if(coupon_for == 0 ){
                if(newUserOrder.length > 0){
                    if(newUserOrder[0].new_user_order > 0){
                        return {status : false , message : 'Coupon is only For First Time User'};
                    }
                }
            }
            if(coupon_for == 1){
                if(newUserOrder.length > 0){
                    if(newUserOrder[0].new_user_order == 0){
                        return {status : false , message : 'Coupon is only For Old User'};
                    }
                }
            }
        }
        var minimum_order_price = coupon.minimum_order_price;
        if(total_price < minimum_order_price){
            return {status : false , message : `Order Price must be ${minimum_order_price} to Apply Coupon`};
        }
        var coupon_disc = 0;
        if(coupon.discount_type == 'P'){
            coupon_disc = (coupon.discount / 100) * total_price;
        }else{
            coupon_disc = coupon.discount;
        }
        total_price = total_price - coupon_disc;
        var data = {
            total_price : Number(total_price.toFixed(2)),
            coupon_discount : Number(coupon_disc.toFixed(2)),
            coupon_id : coupon_id,
            referral_id : 0,
            referral_discount : 0.00
        }
        return {status : true , message : "Coupon Code Applied" , data : data}
    }else{
        var referral = await orderModel.referral(coupon_code);
        if(referral.length == 0){
            return {status : false , message : 'Invalid Coupon / Referral Code'};
        }
        if(user_id){
            var ownReferral = await orderModel.ownReferral(user_id);
            if(ownReferral.length > 0 ){
                if(coupon_code == ownReferral[0].referral_code){
                    return {status : false , message : 'Cannot Use Own Referral Code'};
                }
            }
            var newUserOrder = await orderModel.newUser(user_id);
            if(newUserOrder.length > 0){
                if(newUserOrder[0].new_user_order > 0){
                    return {status : false , message : 'Coupon is only For First Time User'};
                }
            }
        }
        var referral_disc = (15 / 100) * total_price;
        total_price = total_price - referral_disc;
        var data = {
            total_price : Number(total_price.toFixed(2)),
            referral_discount : Number(referral_disc.toFixed(2)),
            referral_id : referral[0].id,
            coupon_id : 0,
            coupon_discount : 0.00
        }
        return {status : true , message : "Referral Code Applied" , data : data}
    }
}

module.exports.applyCouponCode = applyCouponCode;





