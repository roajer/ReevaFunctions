const functions = require('firebase-functions');
var mailgun = require('mailgun-js')({ apiKey: 'key-310ce08e132c982ddf3e823856b91b73', domain: 'www.thereeva.com' });

const moment = require('moment');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
//const rp = require('request-promise');
const promisePool = require('es6-promise-pool');
const PromisePool = promisePool.PromisePool;
//const secureCompare = require('secure-compare');

const MAX_CONCURRENT = 3;
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
exports.weekly_email_job =
    functions.pubsub.topic('weekly-tick').onPublish((event) => {
        console.log("This job is ran every week!")

        // getUserID();

        getUserStats("oKbRdUFiJCf0FEn5HGdtgL6ozyH2", "roajer@gmail.com");

        //  sendemailMG('roajer@gmail.com');

    });

function getUserID() {
    // Use a pool so that we delete maximum `MAX_CONCURRENT` users in parallel.
    //   const promisePool = new PromisePool(() => {

    var query = admin.database().ref('users').orderByKey();
    query.once("value")
        .then(function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
                // key will be "ada" the first time and "alan" the second time
                var key = childSnapshot.key;
                console.log('key', key);

                // childData will be the actual contents of the child
                var childData = childSnapshot.val();
                var emailID = childSnapshot.val().emailID;
                console.log('childData', childData);
                console.log('emailID', emailID);
                getUserStats(key, emailID);

            });
        });

    //  }, MAX_CONCURRENT);

    //promisePool.start().then(() => {
    //   console.log('User email sent');
    //    res.send('User cleanup finished');
    //});



}

//firebase auth:export users.json --format=json --project reeva-d9399
function getUserStats(userID, emailID) {

    const BigQuery = require('@google-cloud/bigquery');
    // Your Google Cloud Platform project ID
    const projectId = 'reeva-d9399';
    // The name for the new dataset
    const datasetName = 'reevatest';
    // Instantiates a client  
    const bigquery = BigQuery({
        projectId: projectId
    });


    //var strdate = moment().format("YYYYMMDD");
    //var enddate = moment.duration(1, 'weeks').format("YYYYMMDD");

     //const strdate = moment().subtract(1, 'day').startOf('isoWeek').format('YYYYMMDD');
     //const enddate = moment().subtract(1, 'day').endOf('isoWeek').format('YYYYMMDD');

     const strdate = moment().subtract(1, 'day').startOf('isoWeek').format();
     const enddate = moment().subtract(1, 'day').endOf('isoWeek').format();

    //const strdate = '20170918';
    //const enddate = '20170924';
    console.log('strdate', strdate);
    console.log('enddate', enddate);


    // The SQL query to run
    const sqlQuery = `SELECT COUNT(*) FROM reevatest.web_analytics_copy WHERE blogUserID ="${userID}" AND _PARTITIONTIME between TIMESTAMP("${strdate}") and TIMESTAMP("${enddate}")`;


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
          //  res.send(JSON.stringify({ "data": rows }));
            console.log(rows.f0_);
        })
        .catch((err) => {
            console.error('ERROR:', err);
        });

    //  sendemailMG(emailID);

}

function sendemailMG(emailID) {

    var data = {
        from: 'admin@thereeva.com',
        subject: 'Your Weekly Report',
        html: `<p>Welcome! </p>`,
        'h:Reply-To': 'admin@thereeva.com',
        to: emailID

    }

    mailgun.messages().send(data, function(error, body) {
        console.log('body', body);
        if (error){
        console.log('error', error);
        }
    })

}