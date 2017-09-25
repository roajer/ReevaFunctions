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
        addEmailID(req,res,https,database);
     } else if
     (actionReq && actionReq === "ProductSearch"){
        searchProduct(req,res,https,actionReq);
     }else{
       // addToBigQuery(req,bigquery);
     }

    /************************************************************************************/
    function addToBigQuery(req,bigquery){

        let userID = req.body.result.contexts.find(function(element){
          return (element.name = 'user_Context' && element.parameters.userID)
        }).parameters.userID;
        
        console.log("BigQuery sessioid :", req.body.sessionId);
        console.log("BigQuery resQuery :",req.body.result.resolvedQuery);
        console.log("BigQuery  resolvedEntities :", req.body.result.metadata.intentName);
        console.log("BigQuery  UseriD :",userID);
        const rows = [{sessionID: req.body.sessionId, userQueries:req.body.result.resolvedQuery,
          resolvedEntities:req.body.result.metadata.intentName, blogUserID: userID}];

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
     function addEmailID(req,res,https,database) {





      let userID = req.body.result.contexts.find(function(element){
        return (element.name = 'user_Context' && element.parameters.userID)
      }).parameters.userID;
      console.log("Reques : ",JSON.stringify(req.body.result.contexts));

      console.log("Reques parameters : ",JSON.stringify(req.body.result.contexts[0].parameters[0]));

      console.log("Reques param original : ",(req.body.result.contexts[0].parameters['email.original']));

      console.log("Reques param original 2 : ",JSON.stringify(req.body.result.contexts[0].parameters['email.original']));

      //hard coding userid for testing
      //userID = "az4rdea6AXdFnvIUdIQDkjBveSG2";

        //adding for testing
        var contexts = (req.body.result.contexts);
        var paramNames=[];
        var searchText="";
        console.log("context 1 : ",JSON.stringify(contexts[0]));
        console.log("context  2 : ",contexts[0].parameters[0] );
        console.log("context  3 : ",JSON.stringify(contexts[0].parameters[0]) );
        
                for (var h in contexts[0].parameters) {
                console.log("param name : ",contexts[0].parameters[h]);
                //searchText = contexts[0].parameters[h].toString();
                if(contexts[0].parameters[h] && contexts[0].parameters[h].length>0){
                  console.log("inside search if");
                  searchText += contexts[0].parameters[h].toString()+" " ;
                }
                console.log("searchText : ",searchText)
                paramNames.push(Object.keys(contexts[0].parameters[h]));
                }
                console.log("searchText final : ",searchText)
        // remove after testing

      //Get integration information for the user from Firebase DB
      usersRef = database.ref("users/"+userID);
      usersRef.once( 'value', function(snap) { 
         var integrationType = (snap.val().integrationType);
         var integrationListID = (snap.val().integrationListID);
         var integrationAPIKey = (snap.val().integrationAPIKey);
         console.log("integratonType : ",JSON.stringify(snap.val().integrationType));
         console.log("integratonType 2 : ",(snap.val().integrationType));
         console.log("integratonType  var: ",integrationType);
         console.log("integrationListID is : ",integrationListID);
         console.log("integrationAPIKey : ",integrationAPIKey);
         let emailID = req.body.result.contexts.find(function(element){
          return (element.name = 'subscribe' && element.parameters.email)
     }).parameters.email;

     let orig_emailID = req.body.result.contexts.find(function(element){
      return (element.name = 'subscribe' && element.parameters['email.original'])
 }).parameters['email.original'];

      console.log("Email Function inside : ",emailID);

      console.log("Original Email Function inside : ",orig_emailID);
     
     console.log("integrationType  before calling Integration: ",integrationType.toString());
      if(integrationType && integrationType === "mailchimp"){
        console.log("Inside IF condition");
      mailChimpSubscription(integrationListID,integrationAPIKey,orig_emailID,https)
      }
       });
       
      
        //  let emailID = req.body.result.contexts.find(function(element){
        //           return (element.name = 'subscribe' && element.parameters.email)
        //      }).parameters.email;
        //      console.log("Email Function");
        //     console.log("EmailId : ",emailID);
        //     console.log("parameters : ", JSON.stringify(req.body.result.parameters));
        //     console.log("parameter name : ",Object.keys(req.body.result.parameters)[0]);
        //  if(integrationType && integrationType.substring(1,integrationType.length-1) === "mailchimp"){
        //  mailChimpSubscription(integrationListID,integrationAPIKey,emailID)
        // }
       addToBigQuery(req,bigquery);
    }
    /*****************************************************************************************/
    function mailChimpSubscription(integrationListID,integrationAPIKey,emailID,https){

      console.log("Inside MailChimp");
     
      console.log("Email Function inside mailchimp : ",emailID);
      console.log("integrationListID is : ",integrationListID);
      console.log("integrationAPIKey : ",integrationAPIKey);
      // create the JSON object
      jsonObject = JSON.stringify({
        "email_address": emailID,
        "status": "subscribed"
        });
      var auth = 'Basic '+ integrationAPIKey; 
      console.log("auth :",auth);
      var postheaders = {
        'Content-Type' : 'application/json',
        'Content-Length' : Buffer.byteLength(jsonObject, 'utf8'),
        'Authorization': auth
            };

      var dc = integrationAPIKey.substring(integrationAPIKey.length-4,integrationAPIKey.length)
      console.log(" dc is : ",dc); 
      // the post options
      var optionspost = {
             host : 'us12.api.mailchimp.com',
             port : 443,
             path : '/3.0/lists/'+integrationListID+'/members',
             method : 'POST',
             headers : postheaders
            };
            console.info('Options prepared:');
            console.info(optionspost);
            console.info('Do the POST call');
    
            // do the POST call
            console.log("Calling MailChimp");
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
            console.log("Writing into MailChimp");
            reqPost.write(jsonObject);
            reqPost.end();
            reqPost.on('error', function(e) {
            console.error(e);
              });
            console.log("resonse from api ",res);
            res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
            console.log("Sending response after MailChimp");
            res.send(JSON.stringify({ "speech": "Succesfully subscribed !!!","displayText": "Success!!!!"}));
           
             
            // res.send(JSON.stringify({ "speech": JSON.stringify(snap.val().Welcome),"contextOut":contextOut, "displayText": JSON.stringify(snap.val().Welcome)}));
            // });
             
    }

    /*****************************************************************************************/
    
    
     function searchProduct(req,res,https,algoliasearch,actionReq){
        console.log("Inside Product Search");
        console.log("Request inside Product Search : ",JSON.stringify((req.body.result)));
        console.log("Parameters in request : ",Object.keys(req.body.result.parameters)[0]);
        console.log("Parameter any in request : ",Object.keys(req.body.result.parameters)[9]);
        console.log("Parameter value any in request : ",(req.body.result.parameters));
        var arr = (req.body.result.parameters)[9];
       
        var cnt=0;
        for(i in req.body.result.parameters){
          if(req.body.result.parameters[i].length>0) {
            console.log("Parameter Type in request : ", Object.keys(req.body.result.parameters)[cnt]);
          console.log("Array elemet: ",req.body.result.parameters[i].toString());
          }
          cnt+=1;
        }
        

        let userID = req.body.result.contexts.find(function(element){
          return (((element.name = 'user_Context') || (element.name = 'context_number_one')) && element.parameters.userID)
        }).parameters.userID;
          console.log("User id in Product search : ",userID);


        //adding for testing
      var contexts = (req.body.result.contexts);
      var paramNames=[];
      var searchText="";
      var searchTextEntities="";
      console.log("context 1 : ",JSON.stringify(contexts[0]));
      console.log("context  2 : ",contexts[0].parameters[0] );
      
      console.log("request parameters : ");
      console.log("parameter name : ",Object.keys(req.body.result.parameters)[0]);
      console.log("parameter name 2 : ",Object.keys(req.body.result.parameters)[1]);
              
              var tempCnt=0;
              for (var h in req.body.result.parameters) {
           
              if(req.body.result.parameters[h].length>0) {
                
                if((searchText.indexOf(req.body.result.parameters[h])==-1) ){
                searchText+= req.body.result.parameters[h]+" ";
                }
                searchTextEntities+=Object.keys(req.body.result.parameters)[tempCnt]+" ";
              }
              tempCnt+=1;
              console.log("searchText  : ",searchText);
              console.log("searchTextEntities  : ",searchTextEntities)
              
              }
              
              console.log("searchText final : ",searchText);
              console.log("searchTextEntities final : ",searchTextEntities);
       
       var algoliasearch = require('algoliasearch');
       var client = algoliasearch('QQ0QXOBZRJ', '566a67d110d2a91c0453780cbcfa495e');
       var index = client.initIndex('products');
       //index.search(userID +' passion', function(err, results) {
        let tempresults= index.search(searchTextEntities, {
          "hitsPerPage": "10",
          "page": "0",
          "attributesToRetrieve": "*",
          "facets": "[]"
         });

        // var searchFound = new Boolean(false);  

         tempresults.then(function(results) {
           console.log("Promise result for entities : ",results);
           if(results && results.nbHits >0) {
             console.log("To call create response for entity");
            createResponse(results);
            // call client.destroy() this when you need to stop the node.js client
            // it will release any keepalived connection
            client.destroy();
           }
           else{
               tempresults= index.search(searchText, {
              "hitsPerPage": "10",
              "page": "0",
              "attributesToRetrieve": "*",
              "facets": "[]"
               });
               tempresults.then(function(results) {
                console.log("Promise result for entity values : ",results);
                if(results && results.nbHits >0) {
                  console.log("To call create response for entity values");
                  createResponse(results);
                 // call client.destroy() this when you need to stop the node.js client
                 // it will release any keepalived connection
                 client.destroy();
                }
                else{
                  //call Wordpress search
                }
              })
           

           }
          })
        
  console.log("tempresults : ",tempresults);
    
    addToBigQuery(req,bigquery);

     }

/*****************************************************************************************/
     function createResponse(results){
      console.log("Inside create response");
      var messagesJson=[];
      var msg ="";
       msg={
             "type":0,
              "speech": 'We got `' + results.nbHits + '` results'};
             messagesJson.push(msg);
     
     for (var h in results.hits) {
         console.log("count :"+h);
         console.log(" result count : "+results.nbHits);
 console.log('Hit(' + results.hits[h].objectID + '): ' + JSON.stringify(results.hits[h]));
        
         msg={
             "type":0,
             "speech": "Product Name : "+ results.hits[h].ProductName};
             messagesJson.push(msg);
          msg={
             "type":0,
             "speech": "Product URL : "+ results.hits[h].ProductURL};
             messagesJson.push(msg); 
         if(results.hits[h].imageURL && results.hits[h].imageURL.length>0){
         msg={
               "type":3,  //type 3 for image urls
               "imageUrl": results.hits[h].imageURL};
               messagesJson.push(msg);
         }
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
     res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
     res.send(JSON.stringify({ "speech": 'We got `' + results.nbHits + '` results',
     "messages": messagesJson,
     "source": "sourcename","displayText": "Success!!!!"}));
     }

/*********************************************************************************************/
function wordpressSearch(){
  
  admin.database().ref('/users/' + userid+'/blogurl').once('value').then(function(snapshot) {
    var blogurl = snapshot.val().blogurl;
  });

}

});

