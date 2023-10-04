 const nodemailer = require('nodemailer');
 const { google } = require('googleapis');
 const { configs } = require('../config');

 module.exports.mail =  (data) => {
    return new Promise(async(resolve,reject)=> {
      // const oauth2client = new google.auth.OAuth2(configs.CLIENT_ID , configs.CLIENT_SECRET , configs.REDIRECT_URI);
      // oauth2client.setCredentials({refresh_token : configs.REFRESH_TOKEN}); 
      // const accessToken = await oauth2client.getAccessToken();
      // const transport = nodemailer.createTransport({
      //     service : 'gmail',
      //     auth : {
      //       type : 'Oauth2',
      //       user : 'topessayhub149@gmail.com',
      //       clientId : configs.CLIENT_ID,
      //       clientSecret : configs.CLIENT_SECRET ,
      //       refreshToken : configs.REFRESH_TOKEN,
      //       accessToken : accessToken,
      //     },tls: {
      //       rejectUnauthorized: false,
      //     },
      //   });
      // const mailOptions = {
      //   from: 'Support TopEssayHub 👻 <' + 'topessayhub149@gmail.com' + '>',
      //   to: email,
      //   subject: "new msg", 
      //   text: "Hello world?", 
      //   html: "<b>Hello world?</b>",
      // }
      // const info = await transport.sendMail(mailOptions);
      // console.log(info);
      // resolve(true);

        var transporter = nodemailer.createTransport(
            {
            host: 'smtp-relay.brevo.com',
            port: 587,
            auth: {
              user: configs.SMTP_EMAIL,
              pass: configs.SMTP_PASS
            }
            ,tls: {
              rejectUnauthorized: false,
            },
          }
        );

        var mailOptions = {
          from: data.from,
          to: data.to,
          subject: data.subject,
          text: data.message
        };

        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
            resolve(true);
          }
        });

    })
 }
