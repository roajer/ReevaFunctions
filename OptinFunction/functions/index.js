const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
var https = require('https');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const database = admin.database();


exports.optinFunction = functions.https.onRequest((req, res) => {

    cors(req, res, () => {
        //let actionReq = req.body.result.action;
        let UserID = req.query.userid;
        let SessionID = req.query.sessionid;
        let actionReq = req.query.query;
        let blacklisturl = req.query.url;

        req.method = "GET";

        console.log(blacklisturl);

        admin.database().ref(`/payments/${UserID}/plan/id`).once('value').then(snapshot => {
            var planID = snapshot.val();


            if (planID != null && (planID == 'reeva_99') || (planID == 'reeva_29')) {
                apiRequest(req, res, https);
            } else {
                getDefaultOptin(req, res, https);
            }
        });




        function getDefaultOptin(req, res, https) {
            admin.database().ref(`/users/${UserID}`).once('value').then(snapshot => {

                var responseMsg = JSON.stringify({
                    msg: snapshot.val().WelcomeMsg,
                    subtitle: snapshot.val().subtitle,
                    title: snapshot.val().title,
                    imgurl: snapshot.val().imageurl
                });

                res.send(responseMsg);
            });


        }


        function apiRequest(req, res, https) {
            var apiai = require("apiai");

            var app = apiai("2e2556d9eabf4a8e98c2ae9e5085d081");

            var options = {
                sessionId: SessionID,
                contexts: [{
                    name: 'optin',
                    parameters: {
                        'userid': UserID
                    }
                }]
            };

            var request = app.textRequest(actionReq, options);

            request.on('response', function(response) {

                admin.database().ref(`/users/${UserID}`).once('value').then(snapshot => {
                    var responseMsg = JSON.stringify({
                        msg: rows.result.fulfillment.speech,
                        subtitle: snapshot.val().subtitle,
                        title: snapshot.val().title,
                        optinid: rows.result.fulfillment.speech.id,
                        imgurl: snapshot.val().imageurl
                    });

                    res.send(responseMsg);
                });
            });

            request.on('error', function(error) {
                console.log(error);
            });

            request.end();
        }

    });
});