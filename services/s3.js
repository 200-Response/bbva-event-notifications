var AWS = require('aws-sdk');
const fs = require('fs');

// Capture all AWS clients we create
// const AWSXRay = require('aws-xray-sdk');
// const AWS = AWSXRay.captureAWS(require('aws-sdk'));

// get reference to S3 client
var s3;// = new AWS.S3();
// get reference to Bucket
var allKeys = [];
let promises = [];

exports.getS3ObjectTest = (bucket, key, s3Prefix) => {
  loadKeys();
  return s3.listObjectsV2({
    Bucket: bucket,
    Prefix: s3Prefix
  }).promise();
}

//Get all s3 names objects from today
exports.getS3Names = (bucket, dateS3, s3Prefix) => {
  loadKeys();
  return new Promise ((resolve, reject) => {
    if(dateS3 == null){
      console.log("date null");
      var cronDate = new Date();
      cronDate.setDate(cronDate.getDate() - 1);
      var year = cronDate.getFullYear();
      var month = cronDate.getMonth() + 1;
      cronDate = cronDate.toLocaleDateString("en-US");
      month = month < 10 ? '0' + month : '' + month;
      // console.log("year: ", year);
    }
    else{
      console.log("date set");
      var cronDate = new Date(dateS3);
      cronDate.setDate(cronDate.getDate() + 1);
      var year = cronDate.getFullYear();
      var month = cronDate.getMonth() + 1;
      cronDate = cronDate.toLocaleDateString("en-US");
      month = month < 10 ? '0' + month : '' + month;
    }
    console.log("dateToRequest", cronDate );
    s3.listObjectsV2({
      Bucket: bucket,
      Prefix: s3Prefix + year + '/' + month + '/'
    }, (error, data) =>{
      if(error) reject(error);
      else{
        var todayElements = [];
        var i = 0;
        data.Contents.forEach(function(element) {
          var fileDate = element.LastModified.toLocaleDateString("en-US");
          if( fileDate === cronDate ){ i=i+1; todayElements.push(element);}
        });
        console.log({"S3Count": i});
        resolve({"today": todayElements, "c": i});
      }

    });
  });
}

//Get all s3 names objects from today
exports.getS3NamesMonthly = (bucket, dateS3, s3Prefix) => {
  loadKeys();
  return new Promise ((resolve, reject) => {
    if(dateS3 == null){
      console.log("date null");
      var cronDate = new Date();
      cronDate.setDate(cronDate.getDate() - 1);
      var year = cronDate.getFullYear();
      var month = cronDate.getMonth() + 1;
      cronDate = cronDate.toLocaleDateString("en-US");
      month = month < 10 ? '0' + month : '' + month;
      // console.log("year: ", year);
    }
    else{
      console.log("date set");
      var cronDate = new Date(dateS3);
      cronDate.setDate(cronDate.getDate() + 1);
      var year = cronDate.getFullYear();
      var month = cronDate.getMonth() + 1;
      cronDate = cronDate.toLocaleDateString("en-US");
      month = month < 10 ? '0' + month : '' + month;
    }
    console.log("dateToRequest", cronDate );
    s3.listObjectsV2({
      Bucket: bucket,
      Prefix: s3Prefix + year + '/' + month + '/'
    }, (error, data) =>{
      if(error) reject(error);
      else{
        var todayElements = [];
        var i = 0;
        data.Contents.forEach(function(element) {
          i=i+1;
          todayElements.push(element);
        });
        console.log({"S3Count": i});
        resolve({"today": todayElements, "c": i});
      }

    });
  });
}

//Get all s3 names month for more than 1K
exports.getS3By1KBlocks = (bucket, s3Prefix) => {
  loadKeys();
  return new Promise (async  (resolve, reject) => {
    var keys = await nuListAllKeys(bucket, s3Prefix);
    if(keys)
      resolve({"count": keys});
    else {
      reject("error");
    }
  });
}

//Get a specific S3 object
exports.getS3Object = (bucket, key) => {
  // let s3 = new AWS.S3();
  loadKeys();

  let result;
  return  new Promise ((resolve, reject)=>{
    s3.getObject({
      Bucket: bucket,
      Key: key
    }, (error, data) =>{
      if(error) return reject(error);
      // console.log(data);
      if(data){
        // result = JSON.parse( data.Body.toString('utf-8') );
        result = data;
      }
      else {
        result = 'none';
      }
      resolve( result );
    });
  });
}

//Get a specific S3 object
exports.getS3ObjectStream = (bucket, key) => {
  // let s3 = new AWS.S3();
  loadKeys();

  let result;
  return  new Promise (async (resolve, reject)=>{
    result = await s3.getObject({
      Bucket: bucket,
      Key: key
    }).createReadStream();
    resolve( result );

  });
}

//Get a specific S3 object
function getS3Object(bucket, key){
  loadKeys();
  return new Promise (async (resolve, reject)=>{
    await s3.getObject({
      Bucket: bucket,
      Key: key
    }, (error, data) =>{
      if(error){
        console.log("error on get s3");
        reject(error);
        return;
      }
      if(typeof data !== 'undefined'){
        if( typeof data !== null){
          fs.appendFileSync('tempFileWithS3.txt', data.Body.toString('utf-8') + '\n');
        }
      }
      // resolve( JSON.parse( data.Body.toString('utf-8') ));
      resolve( "success" );
    });
  });
}

//Here lies the client schema
exports.getS3ClientSchema = (bucket, key) => {
  loadKeys();
  return  new Promise ((resolve, reject)=>{
    s3.getObject({
      Bucket: bucket,
      Key: key
    }, (error, data) =>{
      if(error) reject(error);
      resolve( JSON.parse( data.Body.toString('utf-8') ));
    });
  });
}

//Create a S3 url presigned
exports.getSignedUrl = (params) => {
  loadKeys();
  var s3 = new AWS.S3({
    signatureVersion: 'v4'
  });
  return  new Promise ((resolve, reject)=>{
    s3.getSignedUrl('putObject', params, (err, url) => {
      err ? reject(err) : resolve(url);
    }); 
  });
}

//Get a specific S3 object
exports.getS3ObjectAndcreateReadStream = (bucket, key, file) => {
  loadKeys();
  s3 = new AWS.S3({apiVersion: '2006-03-01'});
  let result;
  return  new Promise (async (resolve, reject)=>{
    await s3.getObject({
      Bucket: bucket,
      Key: key
    }).createReadStream()
    // .on('error', function(err){
    //     console.log("###################");
    //     console.log(err);
    // })
    .pipe(file);
    resolve( result );
  });
}

const nuListAllKeys = async function(bucket, s3Prefix)
{
  var opts = { Bucket: bucket, Prefix: s3Prefix };
  var keys = [];
  var token = null;
  let i = 0; //counter
  for(;;){
    if(token) opts.ContinuationToken = token;
    let promises = [];
    var data = await s3.listObjectsV2(opts).promise(); //, function(err, data){
    //the memory limit, to prevent better store in a file
    data.Contents.forEach(async (elem) => {
      i = i + 1;
      fs.appendFileSync('tempFileWithKeys.txt', elem.Key+'\n'); //data.Contents);
      promises.push(  getS3Object(bucket, elem.Key) );
    });
    await Promise.all(promises);
    // console.log("truncated?", data.IsTruncated, " ", i);
    process.stdout.write("-S3 count: ", i);

    if (!data.IsTruncated) {
      break;
    }
    token = data.NextContinuationToken
    // params.Marker = data.NextMarker;
  }
  return i; //keys;
}

function loadKeys(){
  AWS.config = new AWS.Config();
  
	AWS.config.update({
	  region: 'us-east-1'
	});
	
  // console.log(`ENV ${process.env.DMC_ENV}`);

  s3 = new AWS.S3();
}

