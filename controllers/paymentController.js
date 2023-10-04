var Paypal = require('paypal-express-checkout');
const { configs } = require('../config');
const orderModel = require('../models/orderModel');
const userModel = require('../models/userModel');
const authModel = require('../models/authModel');
const moment = require('moment');
const connection = require('../db');
const commonHelper = require('../helpers/commonHelper');
const { response } = require('express');
const calculaterController = require('./calculatorController');
const mailHelper = require('../helpers/mailHelper');
module.exports.createPayment = async (request , response) =>{
    try{
        var params = request.params;
        var order_id = (params.order_id) ? params.order_id : '';
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var summary = await orderModel.summary(order_id,user_id);
        if(summary.length <= 0){
            return response.json({status : false , message : "Order does not Exist or Invalid"});
        }
        summary = summary[0];
        if(summary.transaction_id && summary.status){
            return response.json({status : false , message : "Order Already Paid"});
        }
        if(summary.total_price <= 0){
            return response.json({status : false , message : "Cannot Proceed Paying through Paypal use Pay With Balance Instead"});
        }
        var discount_code = null;
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
            if(!checkDiscount.status){
                var orderData = {
                    coupon_id : 0,
                    referral_id : 0,
                    coupon_discount : 0,
                    referral_discount : 0,
                    total_price : summary.sub_total - summary.redeem
                }
                await orderModel.editOrder(summary.id,user_id,orderData);
                summary = await orderModel.summary(order_id,user_id);
                summary = summary[0];
            }
        }
        var paypal = Paypal.init(configs.paypal_username, configs.paypal_password, configs.paypal_signiture, configs.paypal_return, configs.paypal_cancel + order_id, false);
        var isTester = await userModel.isTester(user_id);
        if(isTester.length > 0){
            paypal = Paypal.init(configs.paypal_username_1, configs.paypal_password_1, configs.paypal_signiture_1, configs.paypal_return + '?user_id=' + user_id, configs.paypal_cancel + order_id, true);
        }
        paypal.pay(`${summary.id}`, summary.total_price, `Order # ${summary.id}`, 'USD', true, [{order_id : summary.id}], function(err, url) {
            if (err) {
                console.log(err);
                return;
            }
            response.json({status : true , message : "Payment Url Successfully Created", data : url});
        });
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Creating Payment Url", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}


module.exports.verifyPayment = async (request , response) => {
    try{
        var query = request.query;
        var paypal = Paypal.init(configs.paypal_username, configs.paypal_password, configs.paypal_signiture, configs.paypal_return, configs.paypal_cancel, false);
        var isTester = await userModel.isTester(query.user_id);
        if(isTester.length > 0){
            paypal = Paypal.init(configs.paypal_username_1, configs.paypal_password_1, configs.paypal_signiture_1, configs.paypal_return, configs.paypal_cancel, true);
        }
        paypal.detail(query.token, query.PayerID, async function(err, data) {
            if (err) {
                console.log(err);
                return;
            }
            if (data.success){
                var paymentData = {
                    transaction_id : data.PAYMENTINFO_0_TRANSACTIONID,
                    timestamp : moment(data.TIMESTAMP).format('YYYY-MM-DD HH:mm:ss'),
                    order_status : 1,
                    status : 1
                }
                await orderModel.paymentStatus(paymentData,data.INVNUM);
                var statusData = {
                    order_id : data.INVNUM,
                    status : 1
                }
                await orderModel.orderStatus(statusData);
                var user = await orderModel.orderUserId(data.INVNUM);
                user_id = user[0].user_id;
                var userOrderExist = await orderModel.userOrderExist(data.INVNUM,user_id);
                userOrderExist = userOrderExist[0];
                if(userOrderExist.redeem > 0){
                    var balance = {
                        order_id : data.INVNUM,
                        user_id : user_id,
                        transaction : 'Redeemed Amount in Order # ' + data.INVNUM,
                        transaction_type : 1,
                        amount : userOrderExist.redeem
                    }
                    await orderModel.balance(balance);
                    await userModel.balanceDeduct(userOrderExist.redeem,user_id);
                }
                if(userOrderExist.referral_id > 0){
                    var referral_benefit = userOrderExist.sub_total * (20 / 100);
                    var balance = {
                        order_id : data.INVNUM,
                        user_id : userOrderExist.referral_id,
                        transaction : 'Referral Benefit from User # ' + user_id,
                        transaction_type : 0,
                        amount : referral_benefit
                    }
                    await orderModel.balance(balance);
                    await userModel.balanceAdd(referral_benefit,userOrderExist.referral_id);
                }
                var amountPaid = await orderModel.amountPaid(user_id);
                amountPaid = amountPaid[0].sub_totals;
                var currentLevel = await userModel.currentLevel(user_id);
                currentLevel = currentLevel[0];
                var customer_name = currentLevel.customer_name;
                var current_level_id = currentLevel.level_id;
                var email = currentLevel.email;

                var user_level = await userModel.userLevel(amountPaid);
                if(user_level.length > 0){
                    user_level = user_level[0];
                    if(user_level.benefit_mode == 'Percentage'){
                        var benefit_value = userOrderExist.sub_total * (user_level.benefit_value / 100);
                    }else if(user_level.benefit_mode == 'Fixed'){
                        var benefit_value = user_level.benefit_value;
                    }
                    var balance = {
                        order_id : data.INVNUM,
                        user_id : user_id,
                        transaction : 'Account Benefit from Order # ' + data.INVNUM,
                        transaction_type : 0,
                        amount : benefit_value
                    }
                    await orderModel.balance(balance);
                    await userModel.balanceAdd(benefit_value,user_id);
                    await authModel.editLevel(user_id,user_level.id);
                    if(current_level_id != user_level.id){
                        var data = {
                            email : email,
                            customer_name : customer_name,
                            membership_level : user_level.level_name
                        }
                        var emailData = emailContent(data);
                        await mailHelper.mail(emailData);
                    }
                }
                response.redirect(configs.thank_you_page + data.INVNUM);
            }else{
                response.json({status : false , message : "Error Occured While Processing Payment"});
            }
        });
    }catch(err){
        console.log(err);
        response.json({status : false , message : "Something Went Wrong in Creating Payment Url", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}


module.exports.redeem = async (request,response) => {
    try{
        var body = request.body;
        var userData = body.userData;
        var orderData = body.orderData;
        var user_id = userData.data.id;
        var amount = body.amount;
        var balance = await userModel.balance(user_id);
        balance = balance[0].balance;
        if(amount > orderData.sub_total){
            return response.json({status : false , message : "Redeem Cannot be larger than the Order Sub Total Price"});
        }
        if(balance < orderData.sub_total){
            return response.json({status : false , message : "Not Enough Balance to proceed Redeem"});
        }
        var editOrder = {
            redeem : amount,
            total_price : (orderData.sub_total - (orderData.coupon_discount + orderData.referral_discount + amount)).toFixed(2)
        }
        await orderModel.editOrder(body.order_id,user_id,editOrder);
        response.json({status : true , message : "You Successfully Reedemed An Amount", data : editOrder });
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Redeem Amount", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.balance = async (request , response) => {
    try{
        var params = request.params;
        var order_id = (params.order_id) ? params.order_id : '';
        var body = request.body;
        var userData = body.userData;
        var user_id  = userData.data.id;
        var summary = await orderModel.summary(order_id,user_id);
        if(summary.length <= 0){
            return response.json({status : false , message : "Order does not Exist or Invalid"});
        }
        summary = summary[0];
        if(summary.transaction_id && summary.status){
            return response.json({status : false , message : "Order Already Paid"});
        }
        if(summary.total_price > 0){
            return response.json({status : false , message : "Cannot Proceed Paying through Balance use Pay With Paypal Instead"});
        }
        var discount_code = null;
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
            if(!checkDiscount.status){
                var orderData = {
                    coupon_id : 0,
                    referral_id : 0,
                    coupon_discount : 0,
                    referral_discount : 0,
                    total_price : summary.sub_total - summary.redeem
                }
                await orderModel.editOrder(summary.id,user_id,orderData);
                summary = await orderModel.summary(order_id,user_id);
                summary = summary[0];
            }
        }
        var paymentData = {
            transaction_id : 'FULL REDEEM',
            timestamp : moment().format('YYYY-MM-DD HH:mm:ss'),
            order_status : 1,
            status : 1
        }
        await orderModel.paymentStatus(paymentData,order_id);
        var statusData = {
            order_id : order_id,
            status : 1
        }
        await orderModel.orderStatus(statusData);
        var userOrderExist = await orderModel.userOrderExist(order_id,user_id);
        userOrderExist = userOrderExist[0];
        if(userOrderExist.redeem > 0){
            var balance = {
                order_id : order_id,
                user_id : user_id,
                transaction : 'Redeemed Amount in Order # ' + order_id,
                transaction_type : 1,
                amount : userOrderExist.redeem
            }
            await orderModel.balance(balance);
            await userModel.balanceDeduct(userOrderExist.redeem,user_id);
        }
        if(userOrderExist.referral_id > 0){
            var referral_benefit = userOrderExist.sub_total * (20 / 100);
            var balance = {
                order_id : order_id,
                user_id : userOrderExist.referral_id,
                transaction : 'Referral Benefit from User # ' + user_id,
                transaction_type : 0,
                amount : referral_benefit
            }
            await orderModel.balance(balance);
            await userModel.balanceAdd(referral_benefit,userOrderExist.referral_id);
        }
        var amountPaid = await orderModel.amountPaid(user_id);
        amountPaid = amountPaid[0].sub_totals;
        var currentLevel = await userModel.currentLevel(user_id);
        currentLevel = currentLevel[0];
        var customer_name = currentLevel.customer_name;
        var current_level_id = currentLevel.level_id;
        var email = currentLevel.email;

        var user_level = await userModel.userLevel(amountPaid);
        if(user_level.length > 0){
            user_level = user_level[0];
            if(user_level.benefit_mode == 'Percentage'){
                var benefit_value = userOrderExist.sub_total * (user_level.benefit_value / 100);
            }else if(user_level.benefit_mode == 'Fixed'){
                var benefit_value = user_level.benefit_value;
            }
            var balance = {
                order_id : order_id,
                user_id : user_id,
                transaction : 'Account Benefit from Order # ' + order_id,
                transaction_type : 0,
                amount : benefit_value
            }
            await orderModel.balance(balance);
            await userModel.balanceAdd(benefit_value,user_id);
            await authModel.editLevel(user_id,user_level.id);
            if(current_level_id != user_level.id){
                var data = {
                    email : email,
                    customer_name : customer_name,
                    membership_level : user_level.level_name
                }
                var emailData = emailContent(data);
                await mailHelper.mail(emailData);
            }
        }
        response.json({status : true , message : "You Successfully Paid An Order"});
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Full Redeem ", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

function emailContent (data) {
    var email = {
        to : data.email,
        from : configs.support_email,
        subject : 'Congratulations on Reaching the New Membership Level at TopEssayHub.com!',
        message : `
Dear ${data.customer_name},

I am thrilled to inform you that you have reached the new membership level in our writing service! Congratulations and thank you for being a loyal member of our community.
        
As a ${data.membership_level} level, you now have access to even more exclusive benefits and features that will help you to further enhance your writing skills and achieve your goals. Some of the exciting perks of this level include [insert benefits of the new level].
        
We want to make sure you have a smooth transition to your new level, so please don't hesitate to reach out to us if you have any questions or concerns. We are always here to assist you and ensure that you have the best experience possible with our service.
        
Once again, congratulations on your achievement and thank you for being a part of our community. We look forward to seeing the amazing work you will create with the help of our service.
        
Best regards,
Zoe
TopEssayHub.com Team
`
    }
    return email;
}