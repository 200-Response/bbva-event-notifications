"use strict";

//Import services
const dynamoService = require('../services/dynamo.js');
const s3Service = require('../services/s3.js');
const sqsService = require('../services/sqs.js');
const csv = require('csvtojson');

exports.test = async (req, res) => {
  let responseObj = {
    status:'success',
    message: 'test controller'
  };
  console.log(responseObj);
  res.json(responseObj);
};