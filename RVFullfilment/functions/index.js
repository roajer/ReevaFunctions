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
var YQL = require('yql');
// Note do below initialization tasks in index.js and
// NOT in child functions:

// Your Google Cloud Platform project ID
const projectId = 'reeva-d9399';
         
// Instantiates a client
const bigquery = BigQuery({
                 projectId: projectId
                  });

exports.reevaFulfillment = functions.https.onRequest((req, res) => {
    let actionReq = req.body.result.action;

    let optinFlag = 'false';
    let emailID = '';
    var emailid = '';
    
    let userid = req.body.result.contexts.find(function(element){
        return ( (element.name = 'context_number_one') && element.parameters.userid)
       }).parameters.userid;

     /*  if (req.body.result.contexts.parameters.optinflag !== null && req.body.result.contexts.parameters.optinflag !== 'undefined'){
        let optinFlag = req.body.result.contexts.parameters.optinflag;    
       } */
       if("optinflag" in req.body.result.contexts){
         optinFlag = req.body.result.contexts.find(function(element){
          return ( (element.name = 'context_number_one') && element.parameters.optinflag)
         }).parameters.optinflag; 
        console.log("optinFlag is in parameters");
      } 

  

    var forbidden = [userid, 'great', 'hi', 'hello', 'yes', 'sure' ];     
    
    var speech ='';

    var dataArray=[];

    if(actionReq && actionReq === "optinyes"){
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
              if (searchText && searchText.indexOf("") == -1){
                speech = 'Well that one was bit tricky for me, can you try asking little differently? ';
                stdResponse(dataArray, speech, 'false');

              }else {
              if (optinFlag && optinFlag.indexOf('true') >-1){
                searchOptin(searchText);
              } else {
                searchProduct(searchText);
              }
            }

     } else if (actionReq && actionReq === "about") {
        aboutus();
     } else if (actionReq && actionReq === "contacts") {
      contactus();
   } else if(actionReq && actionReq === "offers"){
      specialoffers();
   } else if(actionReq && actionReq === "weather"){
    currentweather();
 }

     function emailSubscription(){
      let emailID = req.body.result.contexts.find(function(element){
          return (element.name = 'subscribe' && element.parameters['email.original'])
         }).parameters['email.original'];

         admin.database().ref('/integrations/' + userid).once('value').then(function(snapshot) {
          
              if (snapshot.val() != null && snapshot.val().emailProvider =='mailchimp' ){
                  access_token= snapshot.val().access_token;
                  groupID = snapshot.val().groupID;
                  api_endpoint = snapshot.val().api_endpoint;   
                  mailchimpSub(groupID,api_endpoint,access_token );
              
              }else if (snapshot.val() != null && snapshot.val().emailProvider =='mailerlite'){
                  tokenid = snapshot.val().tokenid;
                  groupID = snapshot.val().groupID;
                  
                  mailerliteSub(groupID,tokenid );
              } else {

                getOptinResponse(dataArray);
              //  stdResponse(dataArray, 'emailid');


              }
              addToBigQuery(emailID, searchText);
          });

     }

     function mailerliteSub(groupID, tokenid){
      
      request.post('http://api.mailerlite.com/api/v2/groups/'+groupID+'/subscribers')
                      .set('Content-Type', 'application/json')
                      .set('X-MailerLite-ApiKey', tokenid )
                       .send(querystring.stringify({
                  'email': emailID,
                  'name': name            
                }))
                          .end((err, result) => {
                              if (err) {
                                  //res.status(500).json(err);
                                  speech = 'There was a error with the subscription, please try again later.';
                                  stdResponse(dataArray, speech, 'false');
                              } else {
                                getOptinResponse(dataArray);
                                  //stdResponse(dataArray, 'emailid', 'true');
                                  //res.json(result.body);
                              }
                          });
      }
      
      function mailchimpSub(integrationListID,api_endpoint,access_token ){
      
      request.post(api_endpoint + '/3.0/lists/'+integrationListID+'/members')
                      .set('Accept', 'application/json')
                      .set('Authorization', 'OAuth ' + access_token)
                      .send({
                          'email_address': emailID,
                          'status': 'subscribed',
                          'merge_fields': {
                                  'FNAME': name
                                          }
                          })
                          .end((err, result) => {
                              if (err) {
                                speech = 'There was a error with the subscription, please try again later.';
                                stdResponse(dataArray, speech, 'false');
                                  //res.status(500).json(err);
                                  console.log(err);
                              } else {
                                  //res.json(result.statusCode);
                                  getOptinResponse(dataArray);
                                  //stdResponse(dataArray, 'emailid', 'true');
                          
                              }
                          });
      
      }
  
  function searchProduct(searchText){
  //  userid = 'az4rdea6AXdFnvIUdIQDkjBveSG2';
   console.log('Just started search product', searchText);
    admin.database().ref('payments/'+userid+'/plan/id').once('value').then(function(snapshot) {

      console.log('Not sure what happend here', snapshot.val());
      if(snapshot.val() != null){

      
      let tempresults= index.search(userid+' '+searchText, {
          "hitsPerPage": "5",
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
                
                speech = 'Here are some of the products we found for you';
                stdResponse(dataArray, speech, 'false');
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
      speech = 'Seems like there was some problem, can you try asking differently?';
      stdResponse(dataArray, speech, 'false');

    });
  
  addToBigQuery(emailID, searchText);
   }


   function getOptinResponse(dataArray) {
     admin.database().ref('/users/'+userid+'/optinresponse').once('value').then(function(snapshot) {
    var optinresponse = snapshot.val();
      if (optinresponse !== null 
        && optinresponse !== undefined){
          speech = optinresponse;
          console.log('Inside speech if ...',speech);
    
        } else {
          speech = 'Got it, we will get in touch soon';
          console.log('Inside speech else ...',speech);
        } 
      stdResponse(dataArray, speech, 'true');
 });
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
                                console.log('**** PRINT WP RESULT****** ',cnt );
                                if(cnt !=0){
                                  for(var i = 0; i < cnt; i++) {
                                  //if(((result.body[i].title.rendered).indexOf(searchText))>-1){
                                    console.log('**** PRINT WP RESULT ****** ',result.body[i]);
                                    product = { 
                                    "name": result.body[i].title.rendered,
                                    "url": result.body[i].link
                                    };
                                   dataArray.push(product);
                                   resultLimit++;
                                //  }
                                 if(resultLimit ==3){
                                   break;
                                 }
                                }
                                speech = 'Here are some of the posts you might be interested';
                                stdResponse(dataArray, speech, 'false');
                              }else{
                                speech = 'I guess this blog havent posted on this topic yet or try asking differently';
                                stdResponse(dataArray, speech, 'false');
                              }
                              
                    }
                  });
          }).catch(
            (err) => {
            console.log(err);
            speech = 'Seems like there was some problem, can you try asking differently?';
            stdResponse(dataArray, speech, 'false');
          });
  }

function stdResponse(dataArray, speech, emailid){
  var messagesJson=[];
  var msg ='';
  
  if(emailid === 'false'){
    emailid='';
  } 

  console.log('Outside speech else ...',speech);
  msg={ 
    "type":4,
    "speech": speech,
    "payload":{
      "results":{
        "data":dataArray
                },
      "triggertext":"Is this the content you are looking for?",
      "emailid": emailid
      
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

function addToBigQuery(emailID, searchText){
  var date = new Date('YYYY-MM-DD');
  
    const rows = [{
            sessionID: req.body.sessionId, 
            userQueries:req.body.result.resolvedQuery,
            resolvedEntities:searchText, 
            blogUserID: userid,
            emailID: emailID ,
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
                      speech = results.hits[0].optinName;
                      stdResponse(dataArray, speech, 'false');
              // call client.destroy() this when you need to stop the node.js client it will release any keepalived connection
                   client.destroy();
                  }
                })
              } 
          }).catch(
            (err) => {

            console.log(err);
            speech ='error';
            stdResponse(dataArray, speech, 'false');
          });
     
         }

         function aboutus(){
          admin.database().ref('users/'+userid+'/aboutus').once('value').then(function(snapshot) {
            if (snapshot.val() !== null 
              && snapshot.val() !== undefined){
            speech =snapshot.val();
              } else {
            speech = 'We will post about us soon, check back after sometime. ';
              }
            stdResponse(dataArray, speech, 'false');
          });

         }
         function contactus(){
          admin.database().ref('users/'+userid+'/contactinfo').once('value').then(function(snapshot) {
            if (snapshot.val() !== null 
            && snapshot.val() !== undefined){
          speech =snapshot.val();
            } else {
          speech = 'We will post our contact information soon, check back after sometime. ';
            }
            stdResponse(dataArray, speech, 'false');
            });
        }

        function specialoffers(){
          admin.database().ref('users/'+userid+'/offerdet').once('value').then(function(snapshot) {
            if (snapshot.val() !== null 
            && snapshot.val() !== undefined){
          speech =snapshot.val();
            } else {
          speech = 'Looks like I am not able to find more details about this offer, contact us for more info';
            }
            stdResponse(dataArray, speech, 'false');
            });
        }

        function currentweather(){
          
      /*
              location = req.body.result.parameters.find(function(element){
                return ( (element.name = 'context_number_one') && element.parameters.optinflag)
               }).parameters.optinflag;
*/
          var query = new YQL('select * from weather.forecast where (location = 46033)');
          
          query.exec(function(err, data) {
            var location = data.query.results.channel.location;
            var condition = data.query.results.channel.item.condition;
            
            console.log('The current weather in ' + location.city + ', ' + location.region + ' is ' + condition.temp + ' degrees.');
          });


          var query1 = new YQL('select * from weather.forecast where (location = carmel IN)');
          
          query1.exec(function(err, data) {
            var location1 = data.query.results.channel.location;
            var condition1 = data.query.results.channel.item.condition;
            
            console.log('The current weather in ' + location1.city + ', ' + location1.region + ' is ' + condition1.temp + ' degrees.');
          });

          stdResponse(dataArray, "I am still learning to read Weather information, I will be able to help you with this request soon.", 'false');

        }

});