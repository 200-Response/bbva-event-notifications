"use strict";

//Import services
const dynamoService = require('../services/dynamo.js');
const s3Service = require('../services/s3.js');
const sqsService = require('../services/sqs.js');
const snsService = require('./../services/sns');

const csv = require('csvtojson');

exports.test = async (req, res) => {
  let responseObj = {
    status:'success',
    message: 'test controller'
  };
  console.log(responseObj);
  res.json(responseObj);
};

exports.processSQSMessage = async (req) => {

  let body = JSON.parse(req.body);
  let message_data = body.message_data;

  console.log("body", body);
  console.log("message_data", message_data);
  let response;

  let snsParams = {
    Message: "Mensaje de prueba", /* required */
    Subject: '',
    TopicArn: ''
  };

  let paramsDynamo = {
    TableName : process.env.DYNAMO_TABLE_ERROR_CODES,
    KeyConditionExpression: "#zc = :zz",
    ExpressionAttributeNames:{
        "#zc": "TPV_error_dynamo_part_key"
    },
    ExpressionAttributeValues: {
        ":zz": message_data.tpv_error_id,
    }
  };
  console.log(paramsDynamo);

  try {
    response = await dynamoService.queryItem(paramsDynamo);
    console.log(response);
    if (response.Count > 0) {
      snsParams.Subject = response.Items[0].SNS_Topic;
      snsParams.TopicArn = response.Items[0].SNS_Topic_ARN;
    }
  } catch (e) {
    // params.Subject = body.errorType;
    // params.TopicArn = process.env.DMC_DefaultArn;
    console.log(e);
  }

  try {
    response = await snsService.publish(snsParams);
  } catch (error) {
    console.log(error);
  }

  return;
  // let responseObj = {
  //   status:'success',
  //   message: 'test controller'
  // };
  // console.log(responseObj);
  // res.json(responseObj);
};

exports.processDynamoMessage = async (req) => {

  console.log("processDynamoMessage:body",req.body);
  // let body = JSON.parse(req.body);
  
  console.log("body.statusCode", req.body.statusCode);
  if(typeof req.body.statusCode !== 'undefined'){
    // here validate the enrichment data and
    // vlidate the sqs values

    await sendSQSMessage(req.body.statusCode, req.body);
  }
  
  return;
};

const sendSQSMessage = (statusCode, data) => {
  const errorCodes = ["05", "83"];

  let SQS_Type = process.env.BBVA_EVENTS_SQS;

  if (statusCode.includes(errorCodes)) {
    SQS_Type = process.env.BBVA_ERRORS_SQS;
  }

  return new Promise((resolve, reject) =>{
    let messageParams = {
      "type": "test",
      "client": "bbva",
      "client_id": "bbva",
      "message_data": {
        "tpv_error_id": "75",
        "details": data
      }
    };
  
    let messageParamsFromTrigger = {
      MessageAttributes: {
        "Client": {
          DataType: "String",
          StringValue: "BBVA"
        },
        "Type": {
          DataType: "String",
          StringValue: 'notifications handler'
        }
      },
      MessageDeduplicationId: "" + new Date().getTime(),
      MessageGroupId: "" + new Date().getTime(),
      MessageBody: JSON.stringify(messageParams),
      QueueUrl: SQS_Type
    }
  
    console.log(messageParamsFromTrigger);
    sqs.sendMessage(messageParamsFromTrigger, (err, data) => {
      // console.log("sqs send");
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log(data);
        resolve(data);
      }
    });
  });
};