const functions = require('firebase-functions');
const cors = require('cors')({origin: true});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
var https = require('https');

exports.mcKeyFunction = functions.https.onRequest((req, res) => {

  cors(req, res, () => {

    var request = require('superagent');
var querystring = require('querystring');

var posttype = req.query.reqtype;

if (posttype != null && posttype == 'post') {

} else if (posttype != null && posttype == 'get') {

}

function postRequest(){
request.post().send().end();

}

function getRequest(){
request.get().send().end();

}

  });
  });

