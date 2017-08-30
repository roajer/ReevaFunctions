const functions = require('firebase-functions');

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
    
  // [START bigquery_simple_app_query]
  // Imports the Google Cloud client library
  
  // The project ID to use, e.g. "your-project-id"
  // const projectId = "your-project-id";
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
  const sqlQuery = `SELECT * FROM reevatest.web_analytics_copy LIMIT 1000`;

  
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


});