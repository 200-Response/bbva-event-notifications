'use strict';

const serverless = require('serverless-http');
const app = require('./app');

const controller = require('./controllers/controller.js');

const AWS = require('aws-sdk');

module.exports.main = serverless(app);

module.exports.eventHandlerForATriggerCall  = async (event, context, callback) => {
    // console.log("start triggered event v: 0.0.3");
    // console.log("");

    // console.log(event.Records[0].s3.object.key);
    // await controller.test(event.Records[0].s3.object.key);
    // console.log("end triggered event");
    // return {};
    console.log("start foreach");
    for(let i = 0; i < event.Records.length; i++){
        let { body } = event.Records[i];
        await controller.processSQSMessage({body: body});
    }
    console.log("end foreach");
    return {};
};
  
module.exports.eventHandlerForADynamoTriggerCall  = async (event, context, callback) => {
    console.log("eventHandlerForADynamoTriggerCall");
    // console.log("event.Records",event.Records);
    console.log("start foreach");
    for(let i = 0; i < event.Records.length; i++){
        if(!event.Records[i].eventName.includes('REMOVE')){
            console.log("event.Records[i]",event.Records[i].dynamodb);
            console.log("event.Records[i].dynamodb.NewImage",event.Records[i].dynamodb.NewImage);
            let data = event.Records[i].dynamodb.NewImage;
            await controller.processDynamoMessage({body: data});
        }
    }
    console.log("end foreach");
    return {};
};

module.exports.cron = function (event, context, callback) {
    var quicksight = new AWS.QuickSight();

  return new Promise((resolve, reject) =>{
    var params = {
      AwsAccountId: process.env.AwsAccountId, // '327581952167', /* required */
      DataSetId: process.env.DataSetId, // 'd639e92d-8c17-4497-a0c7-c8f93fb51a1f', /* required */
      IngestionId: process.env.IngestionId, // 'TPV Data Ingestion', /* required */
      // IngestionType: process.env.IngestionType // "INCREMENTAL_REFRESH"
    };
  
    console.log("callQuicksight - params", params);
  
    quicksight.createIngestion(params, function (err, data) {
      if (err){ 
        console.log(err, err.stack); // an error occurred
        reject(err);
      }
      else {
        console.log("quicksight.createIngestion data",data); 
        resolve(data);
      }          // successful response
    });
  });
};