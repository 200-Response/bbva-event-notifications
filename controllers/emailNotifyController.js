"use strict";

//Import services
const dynamoService = require('../services/dynamo.js');
const sqsService = require('../services/sqs.js');
const snsService = require('./../services/sns');
const s3Service = require('../services/s3');
const axios = require('axios');
const Mailgun = require('mailgun-js');

const AWS = require('aws-sdk');
const api_key = process.env.MAILGUN_KEY;
const domain = 'mg.200response.mx';
const from_who = 'info@200response.mx';

let sqs = new AWS.SQS({apiVersion: '2012-11-05'});

exports.send = async (req, res) => {
    console.log(req.body);

    if(req.body.email){
        console.log('sending single email');
        sendEmail(req.body.email,req.body.title,req.body.html);
    }else{
        console.log('sending multiple emails');
        let emailList =  await s3Service.getS3Object(bucket,'emailList.json');
        emailList = emailList.Body.toString('utf-8');
        emailList.split(',');
        for(let i=0;i<emailList.length;i++){
            await sendEmail(emailList,req.body.title,req.body.html);
        }
    }

    res.json('sent emails');
}


const sendEmail = (email, title, html)=>{
    new Promise(  (resolve,reject) => {
        let mailgun = new Mailgun({apiKey: api_key, domain: domain});

        let data = {
            from: from_who,
            to:  email,
            subject: title,
            html: html
          }
          mailgun.messages().send(data, function (err, body) {
              if (err) {
                  console.log("got an error: ", err);
                    reject(err);
              }
              else {
                  console.log(body);
                  resolve(`email was sent successfully ${req.body.email}`);
              }
          });
    });
    
}

   



exports.addEmail = async(req,res) =>{
    let email = req.body.email;
    let bucket = 'bbva-los4-siniestros';
    let emailList =  await s3Service.getS3Object(bucket,'emailList.json');
    emailList = emailList.Body.toString('utf-8');
    emailList.split(',');
    emailList.filter( item => item == email );

    if(emailList.length>0){
        return res.json('email was added successfully');
    }

    emailList.push(email);
    emailList.join(',');
    const params = {
        Bucket: bucket,
        Key: 'emailList.json',
        Body: emailList,
        ServerSideEncryption: 'AES256'
      };
    await s3Service.create(params);
    console.log(emailList);
    res.json(emailList.split(','));
}