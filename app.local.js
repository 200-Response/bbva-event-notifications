const AWS = require('aws-sdk');
const homedir = require('os').homedir();

const app = require('./app')
const port = 3001

process.env.athenaOutputQuerys = '';
process.env.LOCAL_AWSPROFILE = 'team-notificaciones';
process.env.LOCAL_AWSFILENAME = homedir+'/.aws/credentials';

process.env.BBVA_EVENTS_SQS = "https://sqs.us-east-1.amazonaws.com/327581952167/bbva-event-alert.fifo";
process.env.BBVA_ERRORS_SQS = "https://sqs.us-east-1.amazonaws.com/327581952167/bbva-error-handler.fifo";

var credentials = new AWS.SharedIniFileCredentials({
	profile: process.env.LOCAL_AWSPROFILE,
	filename: homedir+'/.aws/credentials'
});

AWS.config.credentials = credentials;
AWS.config.update({
	region: 'us-east-1'
});

app.listen(port);
console.log(`listening on http://localhost:${port}`);

///////////////////////////////////////////////////////////
// test sqs send
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

sqsSendMsg();

function sqsSendMsg(){

  let messageParams = {
      "type": "test",
      "client": "bbva",
      "client_id": "bbva",
	  "message_data": {
      "source": process.env.BBVA_ERRORS_SQS,  
		  "tpv_error_id": "75",
		  "details": {
           "bin":"4000-0012-3456-7848",
           "ipAddress":"96.26.76.77",
           "serialNumberTpv":"MX0000_448",
           "comercio_latitude":"21.15250287",
           "transactionId":"1m8a9rFnbpiShiUtcGUeczFT3BZjf6eA6",
           "TPV_dynamo_part_key":"MX0000_448",
           "comercio_longitude":"-86.85458232",
           "comercio_name":"ADMINISTRACION PRIVANZA YIKAL VILLAS PENCEL",
           "comercio_city":"Cancún",
           "transactionAmount":"82462",
           "comercio_zipcode":"77507",
           "comercio_country":"MX",
           "comercio_state":"QUINTANA ROO",
           "comercio_street":"NINGUNO",
           "TPV_dynamo_order_key":"1635033308189",
           "statusCode":"94",
           "timestamp":"1635033308189",
           "ISAM":{
              
           },
           "comercio_country": "MX",
          "cliente_state": "Chihuahua",
          "cliente_city": "Alcántarbury",
          "cliente_zipcode": "82729",
          "cliente_street": "4313 Miranda Caserio",
          "cliente_firstName": "Jerónimo",
          "cliente_lastName": "Jaime",
          "cliente_longitude": "109.3821",
          "cliente_latitude": "-7.8969",
          "transactionAmount": 59079,
          "cliente_phone": "554 690 192",
          "cliente_account": "40641804",
          "cliente_created": "2021-01-14T15:34:21.846Z",
          "cliente_gender": "Agender",
          "cliente_accountName": "Personal Loan Account"
        }
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
      MessageDeduplicationId: ""+new Date().getTime(),
      MessageGroupId: ""+new Date().getTime(),
      MessageBody: JSON.stringify(messageParams),
      QueueUrl: process.env.BBVA_ERRORS_SQS
  }
  console.log(messageParamsFromTrigger);
  sqs.sendMessage(messageParamsFromTrigger, (err, data)=>{
    console.log("sqs send");
    if (err) {
      console.log(err);
    } else {
      console.log(data);
    }
  });
}