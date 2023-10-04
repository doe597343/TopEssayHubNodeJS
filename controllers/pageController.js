const pageModel = require('../models/pageModel');
const connection = require('../db');
const commonHelper = require('../helpers/commonHelper');
const mailHelper = require('../helpers/mailHelper');
const { configs } = require('../config');
module.exports.contents = async(request , response) => {
    try{
        var query = request.query;
        var page_name = (query.page_name) ? query.page_name.trim() : '';
        if(page_name.length <= 0){
            return response.json({status : false , message : "No Page Name parameter provided"});
        }
        var contents = await pageModel.contents(page_name);
        if(contents.length <= 0){
            return response.json({status : false , message : "Page Name not found"});
        }
        contents = contents[0];
        var sub_contents = await pageModel.subContents(contents.id);
        var faqs = await pageModel.faqs(contents.id);
        var data = {
            id : contents.id,
            title : contents.title,
            date_created : contents.date_created,
            seo : {
                keywords : contents.keywords,
                description : contents.description,
            },
            content : {
                header : contents.header,
                content : contents.content,
            },
            sub_contents,
            faqs
        }
        response.json({status : true , message : "Page Contents Loaded Successfully", data : data});
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Page Contents", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.sitemap = async (request , response) => {
    try{
        var query = request.query;
        var types_collection = ['basic-pages','services'];
        if(!types_collection.includes(query.page_type)){
            return  response.json({status : false , message : "Invalid / Missing Page type"});
        }
        var type = types_collection.indexOf(query.page_type.trim());
        var sitemap = await pageModel.sitemap(type);
        response.json({status : true , message : "Sitemap Loaded Successfully", data : sitemap});
    }catch(err){
        console.log(err);
        response.json({status : false , message : "Something Went Wrong in Sitemap", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.list = async (request , response) => {
    try{
        var basic = await pageModel.services(0);
        basic = basic.map(function(obj) { return obj.page_name; });
        var services = await pageModel.services(1);
        services = services.map(function(obj) { return obj.page_name; });
        var data = {
            basic : basic,
            services : services
        }
        response.json({status : true , message : "Services Loaded Successfully", data :data });
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Services", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.services = async (request, response) => {
    try{
        var url_grp = [
            { id : 1 ,group :'Essay'},
            { id : 2 ,group :'Assignment'},
            { id : 3 ,group :'Research' },
            { id : 4 ,group :'Coursework'},
            { id : 5 ,group :'Case Study'},
            { id : 6 ,group :'Dissertation'},
            { id : 7 ,group :'Letter Writing'},
            { id : 8 ,group :'Resume/CV'},
            { id : 9 , group :'Homework Help'},
            { id : 10 , group :'Article'},
            { id : 11 , group :'Personal Statement'},
            { id : 12 , group :'Story'},
            { id : 13 , group :'Project'},
            { id : 14 , group :'Others'},
            { id : 15 , group :'Speech'},
            { id : 16 , group :'Proofreading'},
            { id : 17 , group :'Thesis'},
            { id : 18 , group :'Top Writers'},
            { id : 19 , group :'Sample PDF'},
            { id : 20 , group :'Basic Pages'},
            { id : 21 , group :'Policy Pages'},
            { id : 22 , group :'Powerpoint'},
            { id : 23 , group :'Tools'}
        ];

        var otherGroups = ['Top Writers' , 'Basic Pages' , "Sample PDF" , "Policy Pages" ,'Tools'];
        var list = url_grp.filter(function(el) { return !otherGroups.includes(el.group); }); 
        url_grp = list;
        var count = url_grp.length - 1;
        for (let index = 0; index <= count; index++) {
            var pages = await pageModel.servicesByPageType(url_grp[index].id);
            if(pages.length > 0){
                pages = pages.map(item => {
                    return  {id : item.id, page_name : item.page_name.split(' ')
                    .map(w => w[0].toUpperCase() + w.substring(1).toLowerCase())
                    .join(' ') , link : item.link } 
                })
                url_grp[index]['pages'] = pages;
                delete url_grp[index].id;
            }else{
                delete url_grp[index];
            }
        }
        url_grp = url_grp.filter((list) => {
            return list != null; 
        });
        var list_others = url_grp.filter(function(el) { return el.group == 'Others'; });
        if(list_others.length > 0){
            var element = url_grp.findIndex(function(el){ return  el.group == 'Others' });
            url_grp.splice(element,1);
            url_grp.push(list_others[0]);
        }
        response.json({status : true, message : "Services List Loaded Successfully" , data :  url_grp});
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Services List", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}

module.exports.contact = async (request , response) =>{
    try{
        var body = request.body;
        var full_name = (body.full_name) ? body.full_name : '';
        var phone_no = (body.phone_no) ? body.phone_no : '';
        var message = (body.message) ? body.message : '';
        var email = (body.email) ? body.email : '';

        var data = {
            to : configs.support_email,
            from : configs.support_email,
            subject : 'Customer Inquiry & Concerns',
            message : `
Name : ${full_name} ,

Email : ${email} ,

Phone : ${phone_no} ,

Message : ${message}'
`
        }
        await mailHelper.mail(data);
        response.json({status : true, message : "Message Successfully Sent"});
    }catch(err){
        response.json({status : false , message : "Something Went Wrong in Contact Us", err : err});
    }finally{
        commonHelper.connRelease(connection);
    } 
}