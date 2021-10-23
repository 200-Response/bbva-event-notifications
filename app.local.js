const AWS = require('aws-sdk');
const homedir = require('os').homedir();

const app = require('./app')
const port = 3001

process.env.athenaOutputQuerys = '';
process.env.LOCAL_AWSPROFILE = 'team-notificaciones';
process.env.LOCAL_AWSFILENAME = homedir+'/.aws/credentials';

process.env.MAXMIND_API = 'https://gxlthcotef.execute-api.us-east-1.amazonaws.com/development';
process.env.TWTH_DYNAMO_TABLE = 'top-wealth-zipcode';

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