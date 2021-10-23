//Configure AWS
const AWS = require('aws-sdk');
// Capture all AWS clients we create

var docClient = new AWS.DynamoDB.DocumentClient();
var dynamodb = new AWS.DynamoDB();

//Check if a database exists
exports.checkDatabase = (name) => {
  loadKeys();
    return new Promise((resolve, reject) =>{

        let params = {
            TableName: name
        };

        dynamodb.describeTable(params, (err, data) => {

          if (err){

              resolve(err);

          } else {

              resolve(data);

          }


        });


    });

};

//Create a database
exports.createDatabase = (params) => {
  loadKeys();
  return new Promise((resolve, reject) =>{

      dynamodb.createTable(params, (err, data) => {

          if(err){
            reject(err);
          }

          resolve(data);

      });

  });


};

//Update a database
exports.updateDatabase = (params) => {
  loadKeys();
  return new Promise((resolve, reject) =>{

      dynamodb.update(params, (err, data) => {

          if(err){
            reject(err);
          }

          resolve(data);

      });

  });

};

//Delete an Item from a database
exports.deleteItem = (params) => {
  loadKeys();
  return new Promise((resolve, reject) =>{

      docClient.delete(params, (err, data) => {

          if(err){
            reject(err);
          }

          resolve(data);

      });

    });

};

//Add am Item to a database
exports.addItem = (params) => {
  loadKeys();
  return new Promise((resolve, reject) =>{

      docClient.put(params, (err, data) => {

          if(err){
            reject(err);
          }

          resolve(data);

      });

  });

};

//Add am Item to a database
exports.putItem = (params) => {
  loadKeys();
  return new Promise((resolve, reject) =>{

      dynamodb.putItem(params, (err, data) => {

          if(err){
            reject(err);
          }

          resolve(data);

      });

  });

};

//Query a specific item from a database
exports.queryItem = (params) =>{
  loadKeys();
  return new Promise((resolve, reject) =>{
      // console.log("query...............................");
      docClient.query(params, (err, data) => {

          if(err){
            reject(err);
          }

          resolve(data);

      });

  });

}

//Get a specific item from a database
exports.getItem = (params) =>{
  loadKeys();
  return new Promise((resolve, reject) =>{

    docClient.get(params, (err, data) => {

      if(err){
        console.log(err);
        reject(err);
      }

      resolve(data);

    });


  });

}

//Update an Item
exports.updateItem = (params) => {
  loadKeys();
  return new Promise((resolve, reject) =>{

      docClient.update(params, (err, data) => {

          if(err){
            reject(err);
          }

          resolve(data);

      });

  });

};


//Get all items in a database TableName
exports.getAll = (table) =>{
  loadKeys();
  let params = {
     TableName: table
   };

  return new Promise((resolve, reject) =>{

      docClient.scan(params,(err, data) => {

          if(err){
            reject(err);
          }

          resolve(data);

      });


  });

};

//get single client maxmind data in dynamo
exports.getCacheRecord = (clientIP) => {
  loadKeys();
    var hrstart = process.hrtime();
    return new Promise(async (resolve, reject) => {

        let tableParams = {
            TableName: process.env.MM_DYNAMO_CACHE,
            Key: {
                'ipAddress': clientIP
            }
        };
        await docClient.get(tableParams, (err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            let hrend = process.hrtime(hrstart)
            if(data.Item){
                data.Count=1;
            }else{
                data.Count=0;
            }
            console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
            resolve(data);
        });
    });
}

function loadKeys(){
  AWS.config = new AWS.Config();
  
	AWS.config.update({
	  region: 'us-east-1'
	});
	
  docClient = new AWS.DynamoDB.DocumentClient();
  dynamodb = new AWS.DynamoDB();
}
