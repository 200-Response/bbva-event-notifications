"use strict";

//Import services
const dynamoService = require('../services/dynamo.js');
const sqsService = require('../services/sqs.js');
const snsService = require('./../services/sns');
const axios = require('axios');

const AWS = require('aws-sdk');

var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

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
  let source_sqs = body

  console.log("body", body);
  console.log("message_data", message_data);

  // {
  //   "TPV_dynamo_part_key": "MX0000_806",
  //   "TPV_dynamo_order_key": 1635025182636,
  //   "comercio_state": "QUINTANA ROO",
  //   "ipAddress": "144.75.78.74",
  //   "comercio_longitude": "-86.85460944",
  //   "statusCode": "00",
  //   "transactionAmount": 56060,
  //   "comercio_country": "MX",
  //   "bin": "5433-8532-7024-3217",
  //   "timestamp": 1635025182636,
  //   "comercio_street": "La Luna",
  //   "transactionId": "1YjKXFbfmvK3D3Xr8Q2kmEHE4j",
  //   "comercio_name": "SIX YAQUIS",
  //   "comercio_city": "Cancún",
  //   "comercio_zipcode": "77500",
  //   "serialNumberTpv": "MX0000_806",
  //   "comercio_latitude": "21.13085503"
  //  }
  let response;

  let snsParams = {
    // Message: "Mensaje de prueba", /* required */
    // Subject: '',
    // TopicArn: ''
  };

  let paramsDynamo = {
    TableName : process.env.DYNAMO_TABLE_ERROR_CODES,
    KeyConditionExpression: "#zc = :zz",
    ExpressionAttributeNames:{
        "#zc": "TPV_error_dynamo_part_key",
    },
    ExpressionAttributeValues: {
        ":zz": message_data.tpv_error_id,
    }
  };
  console.log(paramsDynamo);

  snsParams.Message = "Error id: "+ message_data.tpv_error_id + "\n" +
  "example";
  

  try {
    response = await dynamoService.queryItem(paramsDynamo);
    console.log(response);
    if (response.Count > 0) {

    
      snsParams.Message = "\n" + snsParams.Message +
      " Mensaje: " + response.Items[0].TPV_error_dynamo_order_key;
      snsParams.Message = "\n" + snsParams.Message + "<div>" +
      "<h1>This is a heading</h1>" +
      "<p>This is a paragraph of text.</p>" +
      "<p><strong>Note:</strong> If you don\'t escape quotes properly, it will not work.</p>" +"</div>";
      
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
    // format json
    let formatedData = formatDyanamoJsonToJson(req.body);
    // here validate the enrichment data and
    
    // get stock data
    try {
      let response = await axios.get(process.env.BBVA_DB_ISAM+formatedData.TPV_dynamo_part_key);
      console.log(response.data);
      formatedData.ISAM = response.data;
      
    } catch (error) {
      console.log(error);
    }


    // vlidate the sqs values

    await sendSQSMessage(formatedData.statusCode, formatedData);
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
        "source": SQS_Type,
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

const formatDyanamoJsonToJson = (data) => {
  console.log("formatDyanamoJsonToJson:old", data);
  let keys = Object.keys(data);
  for (let index = 0; index < keys.length; index++) {
    const element = keys[index];
    let keysType = Object.keys(data[element]);
    data[element] = data[element][ keysType[0] ];
  }
  console.log("formatDyanamoJsonToJson:new", data);
  return data;
}; 