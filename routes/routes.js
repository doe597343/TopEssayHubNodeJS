var express = require('express');
var router = express.Router();

const calculatorController = require('../controllers/calculatorController');
router.get('/calculator/academic-levels', calculatorController.academicLevels);
router.get('/calculator/additional-services', calculatorController.additionalServices);
router.get('/calculator/deadlines', calculatorController.deadlines);
router.get('/calculator/paper-formats', calculatorController.paperFormats);
router.get('/calculator/spacing', calculatorController.spacing);
router.get('/calculator/writer-categories', calculatorController.writersCategories);
router.get('/calculator/paper-types/:academic_level_id', calculatorController.paperTypes);
router.get('/calculator/subject-types/:academic_level_id', calculatorController.subjectTypes);
router.post('/calculator/pricing',calculatorController.calculatePrice);
router.get('/calculator/countries', calculatorController.countries);

const authController = require('../controllers/authController');
const validationHelper = require('../helpers/validationHelper');
const validationResultHelper = require('../helpers/validationResultHelper');
router.post('/auth/signin', validationHelper.signin(), validationResultHelper.validateInputs,authController.signin);
router.post('/auth/signup',validationHelper.signup(), validationResultHelper.validateInputs,authController.signup);
router.post('/auth/social-login', validationHelper.socialLogin(), validationResultHelper.validateInputs, authController.socialLogin);
router.get('/auth/remove-account',authController.removeAccount);
router.post('/auth/forgot-password',validationHelper.forgotPassword(), validationResultHelper.validateInputs,authController.forgotPassword);
router.post('/auth/reset-password', validationHelper.resetPassword(), validationResultHelper.validateInputs,authController.resetPassword );
router.get('/auth/decode',authController.jwtDecoder);


const orderController = require('../controllers/orderController');
router.post('/orders/upload', validationHelper.upload(), validationResultHelper.validateInputs ,orderController.upload);
router.post('/orders/remove-file', validationHelper.removeFile(), validationResultHelper.validateInputs, orderController.removeFile);
router.post('/orders/save', validationHelper.validateHeader ,validationHelper.save(), validationResultHelper.validateInputs, orderController.save );
router.get('/orders/list',validationHelper.validateHeader,orderController.list);
router.get('/orders/summary/:order_id', validationHelper.validateHeader , orderController.summary);
router.post('/orders/remove-order/:order_id',validationHelper.validateHeader,orderController.removeOrder);
router.get('/orders/download-file', orderController.downloadFile);

const paymentController = require('../controllers/paymentController');
router.post('/payment/paypal/:order_id',validationHelper.validateHeader,paymentController.createPayment);
router.get('/payment/paypal',paymentController.verifyPayment);
router.post('/payment/redeem', validationHelper.validateHeader ,validationHelper.redeem(), validationResultHelper.validateInputs,  paymentController.redeem );
router.post('/payment/balance/:order_id',validationHelper.validateHeader,paymentController.balance);

router.get('/transaction/history',validationHelper.validateHeader,orderController.history);
router.get('/transaction/balance',validationHelper.validateHeader,orderController.balance);

const profileController = require('../controllers/profileController');
router.post('/profile/fullname',validationHelper.validateHeader,validationHelper.fullname(),validationResultHelper.validateInputs,profileController.fullname);
router.post('/profile/password',validationHelper.validateHeader, validationHelper.password(), validationResultHelper.validateInputs,profileController.password);
router.post('/profile/phone',validationHelper.validateHeader, validationHelper.phone(), validationResultHelper.validateInputs,profileController.phone);
router.post('/profile/picture',validationHelper.validateHeader, validationHelper.picture(), validationResultHelper.validateInputs,profileController.picture);

const userController = require('../controllers/userController');
router.get('/user/levels', userController.levels);
router.get('/user/level', validationHelper.validateHeader,userController.level);
router.get('/user/balance', validationHelper.validateHeader,userController.balance);


const pageController = require('../controllers/pageController');
router.get('/page/contents',pageController.contents);
router.get('/page/sitemap',pageController.sitemap);
router.get('/page/list',pageController.list);
router.post('/page/contact', validationHelper.contact(), validationResultHelper.validateInputs,pageController.contact);
router.get('/page/services',pageController.services);
/** Admin */

const adminController = require('../controllers/adminController');
// router.post('/admin/signup', validationHelper.adminSignup(),validationResultHelper.validateInputs, adminController.signup);
router.post('/admin/signin', validationHelper.adminSignin(), validationResultHelper.validateInputs, adminController.signin);
router.post('/admin/order-status', validationHelper.validateAdminHeader,validationHelper.orderStatus(), validationResultHelper.validateInputs,adminController.orderStatus);
router.post('/admin/upload', validationHelper.validateAdminHeader,validationHelper.adminUpload() , validationResultHelper.validateInputs, adminController.upload );
router.post('/admin/order-list', validationHelper.validateAdminHeader, validationHelper.orderList(), validationResultHelper.validateInputs, adminController.orderList );
router.get('/admin/order-detail/:order_id',validationHelper.validateAdminHeader, adminController.orderDetail);
module.exports = router;


