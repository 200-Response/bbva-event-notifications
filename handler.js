'use strict';

const serverless = require('serverless-http');
const app = require('./app');

const controller = require('./controllers/testController.js');

module.exports.main = serverless(app);

module.exports.eventHandlerForATriggerCall  = async (event, context, callback) => {
    console.log("start triggered event v: 0.0.3");
    console.log("");

    console.log(event.Records[0].s3.object.key);
    await controller.test(event.Records[0].s3.object.key);
    console.log("end triggered event");
    return {};
};
  