const functions = require('firebase-functions');
const moment = require('moment');

const cors = require('cors')({origin: true});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
// [START bigquery_quickstart]
// Imports the Google Cloud client library



var https = require('https');

exports.queryFunction = functions.https.onRequest((req, res) => {

  cors(req, res, () => {
  //let actionReq = req.body.result.action;
  let UserID = req.query.userid;
  let actionReq = req.query.query;

  console.log(actionReq);

  req.method = "POST";
   let strDate = req.query.strdate;
   let endDate = req.query.enddate;

      console.log("Start ",strDate);
      console.log("End ",endDate);

   const strformattedDate = moment().format(strDate);
   const endformattedDate = moment().format(endDate);

    console.log("FormatStr ",strformattedDate);
    
 if(actionReq && actionReq === "email"){
        emailReport();
     } else if
     (actionReq && actionReq === "topic"){
        topicReport(req,res,https);
     } else  if(actionReq && actionReq === "product"){
        productReport(req,res,https);
     } else if
     (actionReq && actionReq === "queries"){
        queriesReport(req,res,https);
     }

     

      if (!strDate) {
        console.log(strDate);
      // [START readBodyParam]
      //strDate = req.body.strDate;
      // [END readBodyParam]
    }



  // [START bigquery_simple_app_query]
  // Imports the Google Cloud client library
  
  // The project ID to use, e.g. "your-project-id"
  // const projectId = "your-project-id";
function emailReport(){

const BigQuery = require('@google-cloud/bigquery');
// Your Google Cloud Platform project ID
const projectId = 'reeva-d9399';
// The name for the new dataset
const datasetName = 'reevatest';
// Instantiates a client
const bigquery = BigQuery({
  projectId: projectId
});
  // The SQL query to run
  const sqlQuery = `SELECT * FROM reevatest.web_analytics_copy WHERE blogUserID = '`+UserID+`' AND _PARTITIONTIME between TIMESTAMP("`+strformattedDate+`") and TIMESTAMP("`+endformattedDate+`")  AND emailID IS NOT NULL`;
 
  console.log('sqlQuery: ',sqlQuery);
  // Query options list: https://cloud.google.com/bigquery/docs/reference/v2/jobs/query
  const options = {
    query: sqlQuery,
    useLegacySql: false // Use standard SQL syntax for queries.
  };
  
console.log("Inside email");
  
  // Runs the query
  bigquery
    .query(options)
    .then((results) => {
    const rows = results[0];
    //  printResult(rows);
    res.send(JSON.stringify({ "data": rows})); 
      console.log(rows);
    })
    .catch((err) => {
      console.error('ERROR:', err);
    });
  // [END bigquery_simple_app_query]

// [END bigquery_simple_app_all]
}

function topicReport(req,res,https){

const BigQuery = require('@google-cloud/bigquery');
// Your Google Cloud Platform project ID
const projectId = 'reeva-d9399';
// The name for the new dataset
const datasetName = 'reevatest';
// Instantiates a client
const bigquery = BigQuery({
  projectId: projectId
});
  // The SQL query to run
  //const sqlQuery = `SELECT * FROM reevatest.web_analytics_copy LIMIT 1000`;

  const sqlQuery = `SELECT * FROM reevatest.web_analytics_copy WHERE blogUserID = '`+UserID+`' AND _PARTITIONTIME between TIMESTAMP("`+strformattedDate+`") and TIMESTAMP("`+endformattedDate+`")  AND resolvedEntities IS NOT NULL`;
 
  // Query options list: https://cloud.google.com/bigquery/docs/reference/v2/jobs/query
  const options = {
    query: sqlQuery,
    useLegacySql: false // Use standard SQL syntax for queries.
  };
  
  // Runs the query
  bigquery
    .query(options)
    .then((results) => {
    const rows = results[0];
    //  printResult(rows);
    res.send(JSON.stringify({ "data": rows})); 
      console.log(rows);
    })
    .catch((err) => {
      console.error('ERROR:', err);
    });
  // [END bigquery_simple_app_query]

// [END bigquery_simple_app_all]
}


function productReport(req,res,https){

const BigQuery = require('@google-cloud/bigquery');
// Your Google Cloud Platform project ID
const projectId = 'reeva-d9399';
// The name for the new dataset
const datasetName = 'reevatest';
// Instantiates a client
const bigquery = BigQuery({
  projectId: projectId
});
  // The SQL query to run
  const sqlQuery = `SELECT * FROM reevatest.web_analytics_copy WHERE blogUserID = '`+UserID+`' AND _PARTITIONTIME between TIMESTAMP("`+strformattedDate+`") and TIMESTAMP("`+endformattedDate+`")  AND resolvedProducts IS NOT NULL`;
 
  // Query options list: https://cloud.google.com/bigquery/docs/reference/v2/jobs/query
  const options = {
    query: sqlQuery,
    useLegacySql: false // Use standard SQL syntax for queries.
  };
  
  // Runs the query
  bigquery
    .query(options)
    .then((results) => {
    const rows = results[0];
    //  printResult(rows);
    res.send(JSON.stringify({ "data": rows})); 
      console.log(rows);
    })
    .catch((err) => {
      console.error('ERROR:', err);
    });
  // [END bigquery_simple_app_query]

// [END bigquery_simple_app_all]
}

function queriesReport(req,res,https){

const BigQuery = require('@google-cloud/bigquery');
// Your Google Cloud Platform project ID
const projectId = 'reeva-d9399';
// The name for the new dataset
const datasetName = 'reevatest';
// Instantiates a client
const bigquery = BigQuery({
  projectId: projectId
});
  // The SQL query to run
  const sqlQuery = `SELECT * FROM reevatest.web_analytics_copy WHERE blogUserID = '`+UserID+`' AND _PARTITIONTIME between TIMESTAMP("`+strformattedDate+`") and TIMESTAMP("`+endformattedDate+`")  AND  userQueries IS NOT NULL`;
 
  // Query options list: https://cloud.google.com/bigquery/docs/reference/v2/jobs/query
  const options = {
    query: sqlQuery,
    useLegacySql: false // Use standard SQL syntax for queries.
  };
  
  // Runs the query
  bigquery
    .query(options)
    .then((results) => {
    const rows = results[0];
    //  printResult(rows);
    res.send(JSON.stringify({ "data": rows})); 
      console.log(rows);
    })
    .catch((err) => {
      console.error('ERROR:', err);
    });
  // [END bigquery_simple_app_query]

// [END bigquery_simple_app_all]
}

});
});