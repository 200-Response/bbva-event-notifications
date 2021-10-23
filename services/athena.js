const AthenaExpress = require("athena-express"),
AWS = require("aws-sdk");

//configuring athena-express with aws sdk object
let athenaExpressConfig;
//Initializing athena-express
let athenaExpress;

exports.testQuery = () =>{
	loadKeys();
  let query = {
    sql: "SELECT count(unique) FROM sgk.onetime_donation where mode='live' and ga_id='na'" /* required */,
    db: "sgk" /* optional. You could specify a database here or in the advance configuration option mentioned above*/
  };

  console.log("testing athena");
  athenaExpress
  .query(query)
    .then(results => {
      console.log(results);
    })
    .catch(error => {
      console.log(error);
  });
}

exports.runQuerys = (params, db) =>{
	// await secrets.getSecrets(secretNames);
	loadKeys();
	let records = [];
	let query = {
		sql: params /* required */,
		db: db, /* optional. You could specify a database here or in the advance configuration option mentioned above*/
		// getStats: true,
		skipResults: true
  };
  // console.log("athena query");
	return new Promise ((resolve, reject) => {
	  athenaExpress.query(query)
	    .then(results => {
				console.log("---------------------- results ------------------");
				// console.log(results);
				// records = results.Items;
				resolve(results);
	    })
	    .catch(error => {
	      console.log(error);
				reject(error);
	  });
	});
}

exports.runQuerysGetStoredResults = (params, db) =>{
	loadKeys();
	let records = [];
	let query = {
		sql: params /* required */,
		db: db, /* optional. You could specify a database here or in the advance configuration option mentioned above*/
		// getStats: true,
		skipResults: false
  };
  // console.log("athena query");
	return new Promise ((resolve, reject) => {
	  athenaExpress.query(query)
	    .then(results => {
				console.log(results.Items.length);
				// records = results.Items;
				resolve(results);
	    })
	    .catch(error => {
	      console.log(error);
				reject(error);
	  });
	});
}

function loadKeys(){
	AWS.config = new AWS.Config();
  
	AWS.config.update({
	  region: 'us-east-1'
	});
	// AWS.config.update(awsCredentials);
	//configuring athena-express with aws sdk object
	athenaExpressConfig = {
		aws: AWS, /* required */
		s3: "s3://"+process.env.athenaOutputQuerys,
		skipResults: true
	};
	//Initializing athena-express
	athenaExpress = new AthenaExpress(athenaExpressConfig);
  }
