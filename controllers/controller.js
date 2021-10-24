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
    //   "TPV_dynamo_part_key": "MX0000_526",
    //   "ipAddress": "210.141.60.181",
    //   "comercio_longitude": "-86.87380453",
    //   "comercio_city": "Cancún",
    //   "comercio_zipcode": "",
    //   "comercio_latitude": "21.18126615",
    //   "comercio_state": "QUINTANA ROO",
    //   "statusCode": "03",
    //   "transactionId": "1gU7CJ4QUWmE1dFVpqREFcfFej9pTjJuk",
    //   "comercio_name": "CERVEFRIO",
    //   "cliente_country": "MX",
    //   "serialNumberTpv": "MX0000_526",
    //   "comercio_street": "JUAN DE LA BARRERA",
    //   "bin": "4000-0012-3456-2669",

  //   "TPV_dynamo_order_key": 1635033302913,
  //   "timestamp": 1635033302913,
  
  //   "comercio_country": "MX",
  //   "cliente_state": "Chihuahua",
  //   "cliente_city": "Alcántarbury",
  //   "cliente_zipcode": "82729",
  //   "cliente_street": "4313 Miranda Caserio",
  //   "cliente_firstName": "Jerónimo",
  //   "cliente_lastName": "Jaime",
  //   "cliente_longitude": "109.3821",
  //   "cliente_latitude": "-7.8969",
  //   "transactionAmount": 59079,
  //   "cliente_phone": "554 690 192",
  //   "cliente_account": "40641804",
  //   "cliente_created": "2021-01-14T15:34:21.846Z",
  //   "cliente_gender": "Agender",
  //   "cliente_accountName": "Personal Loan Account"
  
  //  }

  let response;

  let snsParams = {
    // Message: "Mensaje de prueba", /* required */
    // Subject: '',
    // TopicArn: ''
  };

  let emailParams = {
    title: "",
    html: '<div height="250px;" style="background: #1D1D1D;display: flex;justify-content: center; align-items: center; height:250px;">\n'+
    '<div width="600px" height="800px;" style="background: linear-gradient(to right, #5ABCFD, #082247); width:600px; height:250px; align-content: space-between;">\n'+
    '<p style="font-family:Arial, Tahoma, Verdana, sans-serif;color:#000000;font-weight:normal;font-size:55px; padding:20px;">\n'+
    '<span style="font-size:70px;font-weight:bold;"> [ </span>\n'+
    'Te encuentras en Lambda de Correos!\n'+
    '<span style="font-size:70px;font-weight:bold;">  ] </span>\n'+
    '</p>\n'+
    '<ul  style="font-family:Arial, Tahoma, Verdana, sans-serif;color:#000000;font-weight:normal;font-size:25px; padding:20px;">'
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

  snsParams.Message = "Error ID: "+ message_data.tpv_error_id + "\n";
  

  try {
    response = await dynamoService.queryItem(paramsDynamo);
    console.log(response);
    if (response.Count > 0) {

      // emailParams.html = "<p>"+"Estado: " + response.Items[0].TPV_error_dynamo_order_key+"</p>";
      emailParams.html = emailParams.html + '<li>Error ID: '+response.Items[0].TPV_error_dynamo_order_key+'</li>';
      
      snsParams.Message = "\n" + snsParams.Message +
      "Estado: " + response.Items[0].TPV_error_dynamo_order_key;
      
      let newMsg  = formatMessage(snsParams, message_data, emailParams.html);
      snsParams.Message = newMsg.Message;
      
      emailParams.html = newMsg.html;
      emailParams.title = response.Items[0].SNS_Topic;

      console.log("emailParams.html", emailParams.html);

      snsParams.Subject = response.Items[0].SNS_Topic;
      snsParams.TopicArn = response.Items[0].SNS_Topic_ARN;
    }
  } catch (e) {
    // params.Subject = body.errorType;
    // params.TopicArn = process.env.DMC_DefaultArn;
    console.log(e);
  }

  try {
    if(message_data.source.includes(process.env.BBVA_EVENTS_SQS)){
      // response = await snsService.publish(snsParams);

      const response = await axios.post(process.env.EMAIL_SERVICE, emailParams, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    else{
      // send to webhook
      let jsonData = await formatWebhookSlackCardMessage(message_data, snsParams);

      const response = await axios.post(process.env.WEBHOOK, jsonData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    
    }

  
  } catch (error) {
    console.log(error);
  }

  return;
};

exports.processDynamoMessage = async (req) => {

  // await callQuicksight();

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
  
  const errorCodes = ["41", "03", "74", "14", "04", "12"];

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
        "tpv_error_id": statusCode,
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

const formatMessage = (snsParams, message_data, html) => {

  if(typeof message_data.details.comercio_name !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Nombre del comercio: " + message_data.details.comercio_name;

    html = html + '<li>Nombre del comercio: '+message_data.details.comercio_name+'</li>';
  }
  
  if(typeof message_data.details.serialNumberTpv !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "SN TPV: " + message_data.details.serialNumberTpv;
  }
  
  if(typeof message_data.details.ipAddress !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Direccion IP: " + message_data.details.ipAddress;
  }

  if(typeof message_data.details.bin !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Bin: " + message_data.details.bin;
  }
  
    if(typeof message_data.details.transactionId !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "ID de Transacción: " + message_data.details.transactionId;
  }

  if(typeof message_data.details.comercio_city !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Ciudad: " + message_data.details.comercio_city;
  }

  if(typeof message_data.details.comercio_zipcode !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "CP: " + message_data.details.comercio_zipcode;
  }

  if(typeof message_data.details.comercio_state !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Estado: " + message_data.details.comercio_state;
  }

  if(typeof message_data.details.cliente_country !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Pais: " + message_data.details.cliente_country;
  }

  if(typeof message_data.details.comercio_street !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Calle: " + message_data.details.comercio_street;
  }

  if(typeof message_data.details.comercio_latitude !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Latitud: " + message_data.details.comercio_latitude;
  }

  if(typeof message_data.details.comercio_longitude !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Longitud: " + message_data.details.comercio_longitude
    + "\n" + "\n";
  }

  if(typeof message_data.details.ISAM.serie !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Serie TPV: " + message_data.details.ISAM.serie;
  }

  if(typeof message_data.details.ISAM.equipo !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Equipo TPV: " + message_data.details.ISAM.equipo;
  }

  if(typeof message_data.details.ISAM.marca !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Marca TPV: " + message_data.details.ISAM.marca;
  }

  if(typeof message_data.details.ISAM.modelo !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Modelo TPV: " + message_data.details.ISAM.modelo;
  }

  if(typeof message_data.details.ISAM.estatus !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Estatus TPV: " + message_data.details.ISAM.estatus;
  }

  if(typeof message_data.details.cliente_state !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "\n" +
    "Datos del cliente \n" +
    "Estado: " + message_data.details.cliente_state;
  }
  if(typeof message_data.details.cliente_city !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Ciudad: " + message_data.details.cliente_city;
  }
  if(typeof message_data.details.cliente_zipcode !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Código postal: " + message_data.details.cliente_zipcode;
  }
  if(typeof message_data.details.cliente_street !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Dirección: " + message_data.details.cliente_street;
  }
  if(typeof message_data.details.cliente_firstName !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Nombre: " + message_data.details.cliente_firstName;
  }
  if(typeof message_data.details.cliente_lastName !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Apellidos: " + message_data.details.cliente_lastName;
  }
  if(typeof message_data.details.transactionAmount !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Monto de la transacción: " + message_data.details.transactionAmount;
  }
  if(typeof message_data.details.cliente_phone !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Teléfono: " + message_data.details.cliente_phone;
  }
  if(typeof message_data.details.cliente_account !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Cuenta: " + message_data.details.cliente_account;
  }
  if(typeof message_data.details.cliente_accountName !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Nombre de cuenta: " + message_data.details.cliente_accountName;
  }

  console.log("snsParams.Message",snsParams.Message);

  html = html + '</ul> </div> </div>';

  return {Message: snsParams.Message, html: html};

};

const formatWebhookSlackCardMessage = (data, details) => {
  const initialMessageBodySchema = {
    "blocks": [
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ":ladybug: *Alerts*"
        }
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "image",
            "image_url": "https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png",
            "alt_text": "error level"
          },
          {
            "type": "mrkdwn",
            "text": "*Tipo:* " + details.Subject
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*TPV_Id:* " + data.details.TPV_dynamo_part_key
        }
      },
      {
        "type": "divider"
      },
      // {
      //   "type": "section",
      //   "text": {
      //     "type": "mrkdwn",
      //     "text": "*Detalles:* "
      //   }
      // },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Mensaje:* "+ details.Message
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Fecha:* " + new Date()
        }
      }
    ]
  };

  const jsonData = JSON.stringify(initialMessageBodySchema);
  return jsonData;
  
};