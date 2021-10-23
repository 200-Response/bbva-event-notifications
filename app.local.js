const AWS = require('aws-sdk');
const homedir = require('os').homedir();

const app = require('./app')
const port = 3001

process.env.athenaOutputQuerys = '';
process.env.LOCAL_AWSPROFILE = 'team-notificaciones';
process.env.LOCAL_AWSFILENAME = homedir+'/.aws/credentials';

process.env.BBVA_EVENTS_SQS = "https://sqs.us-east-1.amazonaws.com/327581952167/bbva-event-alert.fifo";

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
		  "tpv_error_id": "75",
		  "details": "none"
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
      MessageDeduplicationId: new Date().getTime(),
      MessageGroupId: new Date().getTime(),
      MessageBody: JSON.stringify(messageParams),
      QueueUrl: process.env.BBVA_EVENTS_SQS
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