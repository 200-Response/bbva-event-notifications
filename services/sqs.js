//Configure AWS
const AWS = require('aws-sdk');
// Capture all AWS clients we create
// Create an SQS service object
let sqs; // = new AWS.SQS({apiVersion: '2012-11-05'});

exports.sendQueueMessage = (params)=>{
  loadKeys();

  return new Promise((resolve, reject) => {

      sqs.sendMessage(params, (err, data)=>{

        if (err) {
          reject(err);

        } else {

          resolve(data);

        }

      });

  });

}

function loadKeys(){
  AWS.config = new AWS.Config();
  
	AWS.config.update({
	  region: 'us-east-1'
	});
	
  sqs = new AWS.SQS({apiVersion: '2012-11-05'});
}

