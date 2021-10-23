'use strict';

const serverless = require('serverless-http');
const app = require('./app');

const controller = require('./controllers/controller.js');

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
    console.log("start foreach");
    for(let i = 0; i < event.Records.length; i++){
        let { body } = event.Records[i];
        await controller.processSQSMessage({body: body});
    }
    console.log("end foreach");
    return {};
};