"use strict";

//Import services
const dynamoService = require('../services/dynamo.js');
const sqsService = require('../services/sqs.js');
const snsService = require('./../services/sns');
const axios = require('axios');

const AWS = require('aws-sdk');

var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const alerts_limit = 5;

process.env.events.counter = [
  'bbva-alert-tpv-collect-card',
  'bbva-alert-tpv-unsupported-function',	
  'bbva-alert-tpv-amount-invalid',	
  'bbva-alert-tpv-card-expired',	
  'bbva-alert-tpv-retry',
  'bbva-alert-tpv-exceeded-nip-attempts',		
  'bbva-alert-tpv-rejected',
  'bbva-alert-tpv-declined',
];

process.env.events.counterBlock = {
  'bbva-alert-tpv-collect-card': alerts_limit,
  'bbva-alert-tpv-unsupported-function': alerts_limit,	
  'bbva-alert-tpv-amount-invalid': alerts_limit,	
  'bbva-alert-tpv-card-expired': alerts_limit,	
  'bbva-alert-tpv-retry': alerts_limit,
  'bbva-alert-tpv-exceeded-nip-attempts': alerts_limit,		
  'bbva-alert-tpv-rejected': alerts_limit,
  'bbva-alert-tpv-declined': alerts_limit,
};

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

  let response;

  let snsParams = {
    // Message: "Mensaje de prueba", /* required */
    // Subject: '',
    // TopicArn: ''
  };

  let emailParams = {
    title: "",
    html: '<table width="100%" style="background: #ffffff;">\n'+ '<tr>\n' + '<td>\n' +
    '<table align="center" width="600px" height="200px;" style="width:600px; height:200px;">\n'+ '<tr>\n' +
    '<td align="center" style="background: #5ABCFD;">\n' +
    '<p style="font-family:Arial, Tahoma, Verdana, sans-serif;color:#000000;font-weight:normal;font-size:25px; padding:20px;">\n'+
    '<span style="font-size:30px;font-weight:bold;"> [ </span>\n'+
    'BBVA Hackaton 2021\n'+
    '<span style="font-size:30px;font-weight:bold;">  ] </span>\n'+
    '</p>\n'+ '</td>\n' + '</tr>\n' +
    '<tr>\n' + '<td align="left" style="background: #ffffff;">\n' +
    '<ul  style="font-family:Arial, Tahoma, Verdana, sans-serif;color:#000000;font-weight:normal;font-size:14px; padding:20px;">'
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
      if(process.env.events.counter.includes(snsParams.Subject)){
        if (process.env.events.counterBlock[snsParams.Subject]>0) {
          process.env.events.counterBlock[snsParams.Subject] = process.env.events.counterBlock[snsParams.Subject] - 1;
          
          const response = await axios.post(process.env.EMAIL_SERVICE, emailParams, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
      }
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

  if (errorCodes.includes(statusCode)) {
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

    html = html + '<li>SN TPV: '+message_data.details.serialNumberTpv+'</li>';
  }
  
  if(typeof message_data.details.ipAddress !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Direccion IP: " + message_data.details.ipAddress;

    html = html + '<li>Direccion IP: '+message_data.details.ipAddress+'</li>';
  }

  if(typeof message_data.details.bin !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Bin: " + message_data.details.bin;

    html = html + '<li>Bin: '+message_data.details.bin+'</li>';
  }
  
    if(typeof message_data.details.transactionId !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "ID de Transacción: " + message_data.details.transactionId;

    html = html + '<li>ID de Transacción: '+message_data.details.transactionId+'</li>';
  }

  if(typeof message_data.details.comercio_city !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Ciudad: " + message_data.details.comercio_city;

    html = html + '<li>Ciudad: '+message_data.details.comercio_city+'</li>';
  }

  if(typeof message_data.details.comercio_zipcode !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "CP: " + message_data.details.comercio_zipcode;

    html = html + '<li>CP: '+message_data.details.comercio_zipcode+'</li>';
  }

  if(typeof message_data.details.comercio_state !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Estado: " + message_data.details.comercio_state;

    html = html + '<li>Estado: '+message_data.details.comercio_state+'</li>';
  }

  if(typeof message_data.details.cliente_country !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Pais: " + message_data.details.cliente_country;

    html = html + '<li>Pais: '+message_data.details.cliente_country+'</li>';
  }

  if(typeof message_data.details.comercio_street !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Calle: " + message_data.details.comercio_street;

    html = html + '<li>Calle: '+message_data.details.comercio_street+'</li>';
  }

  if(typeof message_data.details.comercio_latitude !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Latitud: " + message_data.details.comercio_latitude;

    html = html + '<li>Latitud: '+message_data.details.comercio_latitude+'</li>';
  }

  if(typeof message_data.details.comercio_longitude !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Longitud: " + message_data.details.comercio_longitude
    + "\n" + "\n";

    html = html + '<li>Longitud: '+message_data.details.comercio_longitude+'</li>';
  }

  if(typeof message_data.details.ISAM.serie !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Serie TPV: " + message_data.details.ISAM.serie;

    html = html + '<li>Serie TPV: '+message_data.details.ISAM.serie+'</li>';
  }

  if(typeof message_data.details.ISAM.equipo !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Equipo TPV: " + message_data.details.ISAM.equipo;

    html = html + '<li>Equipo TPV: '+message_data.details.ISAM.equipo+'</li>';
  }

  if(typeof message_data.details.ISAM.marca !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Marca TPV: " + message_data.details.ISAM.marca;

    html = html + '<li>Marca TPV: '+message_data.details.ISAM.marca+'</li>';
  }

  if(typeof message_data.details.ISAM.modelo !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Modelo TPV: " + message_data.details.ISAM.modelo;

    html = html + '<li>Modelo TPV: '+message_data.details.ISAM.modelo+'</li>';
  }

  if(typeof message_data.details.ISAM.estatus !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Estatus TPV: " + message_data.details.ISAM.estatus;

    html = html + '<li>Estatus TPV: '+message_data.details.ISAM.estatus+'</li>';
  }

  if(typeof message_data.details.cliente_state !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "\n" +
    "Datos del cliente \n" +
    "Estado: " + message_data.details.cliente_state;

    html = html + '<li>Estado: '+message_data.details.cliente_state+'</li>';
  }
  if(typeof message_data.details.cliente_city !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Ciudad: " + message_data.details.cliente_city;

    html = html + '<li>Ciudad: '+message_data.details.cliente_city+'</li>';
  }
  if(typeof message_data.details.cliente_zipcode !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Código postal: " + message_data.details.cliente_zipcode;

    html = html + '<li>Codigo postal: '+message_data.details.cliente_zipcode+'</li>';
  }
  if(typeof message_data.details.cliente_street !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Dirección: " + message_data.details.cliente_street;

    html = html + '<li>Direccion: '+message_data.details.cliente_street+'</li>';
  }
  if(typeof message_data.details.cliente_firstName !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Nombre: " + message_data.details.cliente_firstName;

    html = html + '<li>Nombre: '+message_data.details.cliente_firstName+'</li>';
  }
  if(typeof message_data.details.cliente_lastName !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Apellidos: " + message_data.details.cliente_lastName;

    html = html + '<li>Apellidos: '+message_data.details.cliente_lastName+'</li>';
  }
  if(typeof message_data.details.transactionAmount !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Monto de la transacción: " + message_data.details.transactionAmount;

    html = html + '<li>Monto de la transacción: '+message_data.details.transactionAmount+'</li>';
  }
  if(typeof message_data.details.cliente_phone !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Teléfono: " + message_data.details.cliente_phone;

    html = html + '<li>Teléfono: '+message_data.details.cliente_phone+'</li>';
  }
  if(typeof message_data.details.cliente_account !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Cuenta: " + message_data.details.cliente_account;

    html = html + '<li>Cuenta: '+message_data.details.cliente_account+'</li>';
  }
  if(typeof message_data.details.cliente_accountName !== 'undefined'){
    snsParams.Message = snsParams.Message + "\n" + 
    "Nombre de cuenta: " + message_data.details.cliente_accountName;

    html = html + '<li>Nombre de cuenta: '+message_data.details.cliente_accountName+'</li>';
  }

  console.log("snsParams.Message",snsParams.Message);

  html = html + '</ul></td> </tr> </table></td> </tr> </table>';

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