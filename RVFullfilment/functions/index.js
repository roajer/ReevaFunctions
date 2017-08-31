
var https = require('https');
'use strict';

const BigQuery = require('@google-cloud/bigquery');
//const reevaFulfillment = require('./reevaFulfillment');
var algoliasearch = require('algoliasearch');

// Note do below initialization tasks in index.js and
// NOT in child functions:
const functions = require('firebase-functions');
const admin = require('firebase-admin');

 
// Your Google Cloud Platform project ID
const projectId = 'reeva-d9399';
         
// Instantiates a client
const bigquery = BigQuery({
                 projectId: projectId
                  });

admin.initializeApp(functions.config().firebase);

//admin.initializeApp(functions.config().firebase); 
//var serviceAccount = require("./serviceAccountKey.json");
//admin.initializeApp({
//  credential: admin.credential.cert(serviceAccount),
//  databaseURL: 'https://reeva-d9399.firebaseio.com/'
//});


const database = admin.database();

// Pass database to child functions so they have access to it
exports.reevaFulfillment = functions.https.onRequest((req, res) => {
    let actionReq = req.body.result.action;
 //   reevaFulfillment.handler(req,res,https,database,bigquery);

  //let actionReq = req.body.result.action;
     console.log("ActionName : ",actionReq);
     if(actionReq && actionReq === "EmailSubScripton"){
        addEmailID(req,res,https);
     } else if
     (actionReq && actionReq === "ProductSearch"){
        searchProduct(req,res,https);
     }else{
        addToBigQuery(req,bigquery);
     }

    /************************************************************************************/
    function addToBigQuery(req,bigquery){

        console.log("Speech Data : ",req.body.result.resolvedQuery);
        console.log("SessionID Data : ",req.body.sessionId);
        console.log("resolvedEntities : ", req.body.result.metadata.intentName);
       
        const rows = [{sessionID: req.body.sessionId,userQueries:req.body.result.resolvedQuery,resolvedEntities:req.body.result.metadata.intentName, emailID: 'roajer@roajer.com'}];

        bigquery
        .dataset('reevatest')
        .table('web_analytics_copy')
        .insert(rows)
        .then((insertErrors) => {
              console.log('Inserted:');
              rows.forEach((row) => console.log(row));
        
              if (insertErrors && insertErrors.length > 0) {
                console.log('Insert errors:');
                insertErrors.forEach((err) => console.error(err));
        }
        })
        .catch((err) => {
              console.error('ERROR{:', err);
        });
    }


     /******************************************************************************/
     function addEmailID(req,res,https) {
         let emailID = req.body.result.contexts.find(function(element){
                  return (element.name = 'subscribe' && element.parameters.email)
             }).parameters.email;
             console.log("Email Function");
        console.log("EmailId : ",emailID);
            console.log("parameters : ", JSON.stringify(req.body.result.parameters));
            console.log("parameter name : ",Object.keys(req.body.result.parameters)[0]);
       // create the JSON object
        jsonObject = JSON.stringify({
                    "email_address": emailID,
                    "status": "subscribed"
                    });
     
        // prepare the header
        var postheaders = {
                        'Content-Type' : 'application/json',
                        'Content-Length' : Buffer.byteLength(jsonObject, 'utf8'),
                        'Authorization': 'Basic dXNlcjo5Y2JkZmNlMmEzZDAzYWQzM2I0MThiOGFmMTEyZDYyNC11czE2'
                            };

        // the post options
        var optionspost = {
                             host : 'us16.api.mailchimp.com',
                             port : 443,
                             path : '/3.0/lists/18f7f333d6/members',
                             method : 'POST',
                             headers : postheaders
                            };
        
        console.info('Options prepared:');
        console.info(optionspost);
        console.info('Do the POST call');

        // do the POST call
        var reqPost = https.request(optionspost, function(res) {
                         console.log("statusCode: ", res.statusCode);
                        // uncomment it for header details
                        //  console.log("headers: ", res.headers);
 
                        res.on('data', function(d) {
                        console.info('POST result:\n');
                        process.stdout.write(d);
                        console.info('\n\nPOST completed');
                            });
                    });
 
        // write the json data
        reqPost.write(jsonObject);
        reqPost.end();
        reqPost.on('error', function(e) {
        console.error(e);
          });
        console.log("resonse from api ",res);
        res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
         
        res.send(JSON.stringify({ "speech": "Succesfully subscribed !!!","displayText": "Success!!!!"}));
       
         
        // res.send(JSON.stringify({ "speech": JSON.stringify(snap.val().Welcome),"contextOut":contextOut, "displayText": JSON.stringify(snap.val().Welcome)}));
        // });
         
        console.log("response is ",res);
       // addToBigQuery(req,bigquery);
    }
    /*****************************************************************************************/
    
    
     function searchProduct(req,res,https,algoliasearch){
        console.log("Inside Product Search");
       // node examples/node.js
       var algoliasearch = require('algoliasearch');
       var client = algoliasearch('QQ0QXOBZRJ', '566a67d110d2a91c0453780cbcfa495e');
       var index = client.initIndex('products');
       index.search('oKbRdUFiJCf0FEn5HGdtgL6ozyH2 passion', function(err, results) {
       if (err) {
           console.log("Error : ",err)
            throw err;
        }

        var prodResult="";
        var messagesJson=[];
         var msg ="";
          msg={
                "type":0,
                 "speech": 'We got `' + results.nbHits + '` results'};
                messagesJson.push(msg);
        
        for (var h in results.hits) {
            console.log("count :"+h);
            console.log(" result count : "+results.hits);
    console.log('Hit(' + results.hits[h].objectID + '): ' + JSON.stringify(results.hits[h]));
            prodResult = prodResult + JSON.stringify(results.hits[h]);
            msg={
                "type":0,
                "speech": "Product Name : "+ results.hits[h].ProductName};
                messagesJson.push(msg);
             msg={
                "type":0,
                "speech": "Product URL : "+ results.hits[h].ProductURL};
                messagesJson.push(msg);
            // msg = msg +  {"type": 0,"speech": "Product Name : "+ results.hits[h].ProductName} +",";
            // msg = msg +  {"type": 0,"speech": "Product URL : "+ results.hits[h].ProductURL} ;
            // if(h<results.nbHits-1){
            //     msg=msg +",";
            // }
  }
  
         msg={
                "type":0,
                "speech": "Is this list useful ?"};
                messagesJson.push(msg);
       
        console.log('We got `' + results.nbHits + '` results');
        console.log(JSON.stringify({messages: messagesJson}));
        console.log('Here is the first one: ', results.hits[0].ProductURL);

  // call client.destroy() this when you need to stop the node.js client
  // it will release any keepalived connection
        client.destroy();

       
           
        res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
         
//           res.send(JSON.stringify({ "speech": 'We got `' + results.nbHits + '` results',
// "messages": [{"type": 0,"speech": "look at that image"},
//              {"type": 0,"speech": "look at that image 2222"},
//             {"type": 3,"imageUrl": "https://www.google.com/url?sa=i&rct=j&q=&esrc=s&source=images&cd=&cad=rja&uact=8&ved=0ahUKEwign6zu7NnVAhVRziYKHZ3dBzgQjRwIBw&url=https%3A%2F%2Fwww.w3schools.com%2Fcss%2Fcss3_images.asp&psig=AFQjCNHoLjLmuFA2boWXlGcktfUKuIm5tQ&ust=1502907492103771"
// }],
// "source": "sourcename","displayText": "Success!!!!"}));
    // if(results.nbHits > 0){
        res.send(JSON.stringify({ "speech": 'We got `' + results.nbHits + '` results',
        "messages": messagesJson,
        "source": "sourcename","displayText": "Success!!!!"}));
    // } 
    // else{
        // res.send(JSON.stringify({ "speech": 'Sorry I could not get any relevant information',
        // "messages": [{"type": 0,"speech": "Can you please ask some other information "}],
        // "source": "sourcename","displayText": "Success!!!!"}));
        // }
        
    });
      
    addToBigQuery(req,bigquery);

     }

});
