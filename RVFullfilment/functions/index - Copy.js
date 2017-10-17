var https = require('https');
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const database = admin.database();

var wsrequest = require('superagent');
const BigQuery = require('@google-cloud/bigquery');
var algoliasearch = require('algoliasearch');
var client = algoliasearch('QQ0QXOBZRJ', '566a67d110d2a91c0453780cbcfa495e');
var index = client.initIndex('products');
var optinindex = client.initIndex('optin');

// Note do below initialization tasks in index.js and
// NOT in child functions:

// Your Google Cloud Platform project ID
const projectId = 'reeva-d9399';
         
// Instantiates a client
const bigquery = BigQuery({
                 projectId: projectId
                  });

// Pass database to child functions so they have access to it
exports.reevaFulfillment = functions.https.onRequest((req, res) => {
    let actionReq = req.body.result.action;

    let userid = req.body.result.contexts.find(function(element){
        return ( (element.name = 'context_number_one') && element.parameters.userid)
       }).parameters.userid;

     /*  if (req.body.result.contexts.parameters.optinflag !== null && req.body.result.contexts.parameters.optinflag !== 'undefined'){
        let optinFlag = req.body.result.contexts.parameters.optinflag;    
       } */

    let optinFlag = req.body.result.contexts.find(function(element){
      return ( (element.name = 'context_number_one') && element.parameters.optinflag)
     }).parameters.optinflag; 

    var forbidden = [userid, 'great', 'hi', 'hello'];       

    if(actionReq && actionReq === "EmailSubScription"){
            emailSubscription();
     } else if (actionReq && actionReq === "ProductSearch"){
          var searchText= "";
          var tempCnt=0;
              for (var h in req.body.result.parameters) {       
              if(req.body.result.parameters[h].length>0 && searchText.indexOf(req.body.result.parameters[h])==-1 
              && forbidden.indexOf(req.body.result.parameters[h]) ==-1) {
                console.log('searchText: ',searchText);
                    searchText+= req.body.result.parameters[h]+" ";
                    console.log('works', searchText);
              }
              tempCnt+=1;
              }
              console.log(searchText);
              if (optinFlag && optinFlag.indexOf('true') >-1){
                searchOptin(searchText);
              } else {
                searchProduct(searchText);
              }

     } else if (actionReq && actionReq === "about") {
        aboutus();
     } else if (actionReq && actionReq === "contacts") {
      contactus();
   }

     function emailSubscription(){
      let orig_emailID = req.body.result.contexts.find(function(element){
          return (element.name = 'subscribe' && element.parameters['email.original'])
         }).parameters['email.original'];
      
      var emailurl ="https://us-central1-reeva-d9399.cloudfunctions.net/emailSubFunction";
      wsrequest.get(emailurl)
      .query({ emailid: orig_emailID, userid : userid, sessionid: req.body.sessionId })
      .end((err, result) => {
                if (err) {
                    res.status(500).json(err);
                    console.log("error in cloud email function ", err);
                } else {
                  console.log("Result from mail function : ", result);
                  sendDefaultResponse("Succesful mail subscription");
                }
              });
     }
  
  function searchProduct(searchText){
  //  userid = 'az4rdea6AXdFnvIUdIQDkjBveSG2';
   console.log('Just started search product', searchText);
    admin.database().ref('payments/'+userid+'/plan/id').once('value').then(function(snapshot) {

      console.log('Not sure what happend here', snapshot.val());
      if(snapshot.val() != null){

      var dataArray=[];
      let tempresults= index.search(userid+' '+searchText, {
          "hitsPerPage": "10",
          "page": "0",
          "attributesToRetrieve": "*",
          "facets": "[]"
           });
           tempresults.then(function(results) {
            console.log("Promise result for entity values : ",results);
            if(results && results.nbHits >0) {                                    
              //createWebResponse(results);
              for (var h in results.hits) {
            product={
                "name":results.hits[h].ProductName,
                "url": results.hits[h].ProductURL,
                "imageurl" : results.hits[h].imageURL
               };
                  dataArray.push(product);
                }
             stdResponse(dataArray, results.nbHits);
        // call client.destroy() this when you need to stop the node.js client it will release any keepalived connection
             client.destroy();
            }else{     //call Wordpress search
              console.log('Fired at the 0 array', searchText);
              
              wordpressSearch(searchText);
            }
          })
        } else{
          console.log('Fired at the null', searchText);
          wordpressSearch(searchText);
        }
    }).catch(
      (err) => {
      console.log(err);
    });
  
  addToBigQuery(searchText);
   }

function wordpressSearch(searchText){
  console.log("Wordpress search started ", searchText);
  admin.database().ref('/users/'+userid+'/blogurl').once('value').then(function(snapshot) {
    var messagesJson=[];
    var msg ="";
    var dataArray=[];
    var product="";
    var blogurl = snapshot.val();
 //   var str = searchText.replace(userid, "");
    console.log("searc text in WPsearch : ", searchText);
    wsrequest.get(blogurl+'/wp-json/wp/v2/posts')
                .query({ search: searchText })
                        .end((err, result) => {
                            if (err) {
                                res.status(500).json(err);
                            } else {
                                var resultLimit=0;
                                var cnt = Object.keys(result.body).length;
                                if(cnt !=0){
                                  for(var i = 0; i < cnt; i++) {
                                  if(((result.body[i].title.rendered).indexOf(searchText))>-1){
                                    product = { 
                                    "name": result.body[i].title.rendered,
                                    "url": result.body[i].link
                                    };
                                   dataArray.push(product);
                                   resultLimit++;
                                  }
                                 if(resultLimit ==3){
                                   break;
                                 }
                                }
                              }
                     stdResponse(dataArray, cnt);
                    }
                  });
          }).catch(
            (err) => {
            console.log(err);
          });
  }

function stdResponse(dataArray, resultsSize){
  var messagesJson=[];
  var msg ="";
  var speech = '';

  if (dataArray.length == 0){
    speech = 'Hmm, I dint find anything for that query. Try asking differently';
      } else if (dataArray.length > 10){
    speech = '';
      } else {
    speech = 'Here is what we found for you';
      }

  msg={ 
    "type":4,
    "speech": speech,
    "payload":{
      "results":{
        "data":dataArray
                },
      "triggertext":"Is this the content you are looking for?",
      "emailid":'',
      "optinid":''
      }};
      messagesJson.push(msg);
         
         res.setHeader('Content-Type', 'application/json'); 
         res.send(JSON.stringify({ 
         "speech": speech,
         "messages": messagesJson,
         "source": "reeva",
         "displayText": speech
        }));

}

function addToBigQuery(searchText){
  var date = new Date('YYYY-MM-DD');
  console.log(date);
    const rows = [{
            sessionID: req.body.sessionId, 
            userQueries:req.body.result.resolvedQuery,
            resolvedEntities:searchText, 
            blogUserID: userid,
            Date: date
          }];
  
          bigquery
          .dataset('reevatest')
          .table('web_analytics_copy')
          .insert(rows)
          .then((insertErrors) => {
                console.log('Inserted in Big Query');
             //   rows.forEach((row) => console.log(row));
                if (insertErrors && insertErrors.length > 0 && insertErrors.errors) {
                  console.log('Insert errors:');
                  insertErrors.forEach((err) => console.error(err.errors.message));
          }
          })
          .catch((err) => {
                console.error('ERROR{:', err);
          });
      }

      function searchOptin(searchText){
        //  userid = 'az4rdea6AXdFnvIUdIQDkjBveSG2';
         console.log('Just started search optin', searchText);
          admin.database().ref('payments/'+userid+'/plan/id').once('value').then(function(snapshot) {
      
            console.log('Not sure what happend here', snapshot.val());
            if(snapshot.val() != null){
      
            var dataArray=[];
            let tempresults= optinindex.search(userid+' '+searchText, {
                "hitsPerPage": "10",
                "page": "0",
                "attributesToRetrieve": "*",
                "facets": "[]"
                 });
                 tempresults.then(function(results) {
                  console.log("Promise result for entity values : ",results);
                  if(results && results.nbHits >0) {                                    
                    //createWebResponse(results);
                    for (var h in results.hits) {
                  product={
                      "name":results.hits[0].optinName,
                      "optinid" : results.hits[0].objectID
                     };
                        dataArray.push(product);
                      }
                   stdResponse(dataArray, results.nbHits);
              // call client.destroy() this when you need to stop the node.js client it will release any keepalived connection
                   client.destroy();
                  }
                })
              } 
          }).catch(
            (err) => {
            console.log(err);
          });
     
         }

         function aboutus(){

         }
         function contactus(){
          
        }
});