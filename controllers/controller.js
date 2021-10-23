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