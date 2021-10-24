"use strict";

//Import services
const dynamoService = require('../services/dynamo.js');
const sqsService = require('../services/sqs.js');
const snsService = require('./../services/sns');
const axios = require('axios');
const Mailgun = require('mailgun-js');

const AWS = require('aws-sdk');
 var api_key = process.env.MAILGUN_KEY;
 var domain = '200response.mx';
 var from_who = 'info@200response.mx';

var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

exports.send = async (req, res) => {
    var mailgun = new Mailgun({apiKey: api_key, domain: domain});
    console.log(req.body);
    var data = {
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
    res.json('ok');
}