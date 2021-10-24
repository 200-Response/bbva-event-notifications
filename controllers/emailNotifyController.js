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
    let mailgun = new Mailgun({apiKey: api_key, domain: domain});
    console.log(req.body);
    let data = {
      from: from_who,
      to: req.body.email,
      subject: req.body.title,
      html: req.body.html
    }
    mailgun.messages().send(data, function (err, body) {
        if (err) {
            res.json(err);
            console.log("got an error: ", err);
        }
        else {
            console.log(body);
            res.json(`email was sent successfully ${req.body.email}`);
        }
    });
};


exports.addEmail = async(req,res) =>{
    let email = req.body.email;
    let bucket = 'bbva-los4-siniestros';
    let emailList =  await s3Service.getS3Object(bucket,'emailList.json');
    emailList = JSON.parse( emailList.Body.toString('utf-8') );
    console.log(emailList);
    res.json(emailList);
}