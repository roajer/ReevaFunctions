var https = require('https');
'use strict';

var wsrequest = require('superagent');
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


const database = admin.database();

// Pass database to child functions so they have access to it
exports.reevaFulfillment = functions.https.onRequest((req, res) => {
    let actionReq = req.body.result.action;
 //   reevaFulfillment.handler(req,res,https,database,bigquery);

  //let actionReq = req.body.result.action;
     console.log("ActionName : ",actionReq);
     if(actionReq && actionReq === "EmailSubScription"){
        //addEmailID(req,res,https,database);
        let orig_emailID = req.body.result.contexts.find(function(element){
          return (element.name = 'subscribe' && element.parameters['email.original'])
         }).parameters['email.original'];
       let userid = req.body.result.contexts.find(function(element){
        return (((element.name = 'user_Context') || (element.name = 'context_number_one')) && element.parameters.userid)
       }).parameters.userid;
      var emailurl ="https://us-central1-reeva-d9399.cloudfunctions.net/emailSubFunction";
      console.log("About to call email cloud function :",userid);
      console.log("About to call email cloud function :",orig_emailID);
      wsrequest.get(emailurl)
      .query({ emailid: orig_emailID,userid : userid })
     .end((err, result) => {
                if (err) {
                    res.status(500).json(err);
                    console.log("error in cloud email function ",err);
                } else {
                  console.log("Result from mail function : ",result);
                  sendDefaultResponse("Succesful mail subscription");
                }
              });
       // https://us-central1-reeva-d9399.cloudfunctions.net/emailSubFunction?emailID=arwe@rs.com&name=rojd&userid=2qsdfsd
     } else if
     (actionReq && actionReq === "ProductSearch"){
        searchProduct(req,res,https);
     }else{
       // addToBigQuery(req,bigquery);
     }

    /************************************************************************************/
    function addToBigQuery(req,bigquery){

      let userID = req.body.result.contexts.find(function(element){
        return (((element.name = 'user_Context') || (element.name = 'context_number_one')) && element.parameters.userid)
      }).parameters.userid;
        
        console.log("BigQuery sessioid :", req.body.sessionId);
        console.log("BigQuery resQuery :",req.body.result.resolvedQuery);
        console.log("BigQuery  resolvedEntities :",req.body.result.metadata.intentName);
        console.log("BigQuery  UseriD :",userID);
        const rows = [{sessionID: req.body.sessionId,userQueries:req.body.result.resolvedQuery,
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
  function searchProduct(req,res,https){
        console.log("Inside Product Search");
        console.log("Request inside Product Search : ",JSON.stringify((req.body.result)));
        console.log("Parameter userid in request : ",(req.body.result.parameters.userid));
       // console.log("Request req : ",JSON.stringify(req));
        console.log("Request req.body : ",JSON.stringify(req.body));
        console.log("Request req.body.result : ",JSON.stringify(req.body.result));
        var arr = (req.body.result.parameters)[9];
        var cnt=0;
        for(i in req.body.result.parameters){
          if(req.body.result.parameters[i].length>0) {
            console.log("Parameter Type in request : ",Object.keys(req.body.result.parameters)[cnt]);
          console.log("Array elemet: ",req.body.result.parameters[i].toString());
          }
          cnt+=1;
        }
        
        let userID = req.body.result.contexts.find(function(element){
          return (((element.name = 'user_Context') || (element.name = 'context_number_one')) && element.parameters.userid)
        }).parameters.userid;
        console.log("User id in Product search : ",userID);
        //adding for testing
      var contexts = (req.body.result.contexts);
      var paramNames=[];
      var searchText="";
      var searchTextEntities="";
      
              
              var tempCnt=0;
              for (var h in req.body.result.parameters) {
           
              if(req.body.result.parameters[h].length>0) {
                
                if((searchText.indexOf(req.body.result.parameters[h])==-1) ){
                searchText+= req.body.result.parameters[h]+" ";
                console.log("search Text : ",searchText);
                }
                searchTextEntities+=Object.keys(req.body.result.parameters)[tempCnt]+" ";
              }
              tempCnt+=1;
                         
              }
              
              console.log("searchText final : ",searchText);
              console.log("searchTextEntities final : ",searchTextEntities);
       
       var algoliasearch = require('algoliasearch');

     var client = algoliasearch('QQ0QXOBZRJ', '566a67d110d2a91c0453780cbcfa495e');
       var index = client.initIndex('products');
       /********************************************Commented below code to avoid search on Entity names********************/
       //index.search(userID +' passion', function(err, results) {
        // let tempresults= index.search(userID+' '+searchTextEntities, {
        //   "hitsPerPage": "10",
        //   "page": "0",
        //   "attributesToRetrieve": "*",
        //   "facets": "[]"
        //  });
        //  tempresults.then(function(results) {
        //    console.log("Promise result for entities : ",results);
        //    if(results && results.nbHits >0) {
        //      console.log("To call create response for entity");
        //      createWebResponse(results);
        //     // call client.destroy() this when you need to stop the node.js client
        //     // it will release any keepalived connection
        //     client.destroy();
        //    }
        //    else{
          let tempresults= index.search(userID+' '+searchText, {
              "hitsPerPage": "10",
              "page": "0",
              "attributesToRetrieve": "*",
              "facets": "[]"
               });
               tempresults.then(function(results) {
                console.log("Promise result for entity values : ",results);
                if(results && results.nbHits >0) {
                  console.log("To call create response for entity values");
                  //createResponse(results);
                  createWebResponse(results);
                 // call client.destroy() this when you need to stop the node.js client
                 // it will release any keepalived connection
                 client.destroy();
                }
                else{
                  //call Wordpress search
                  wordpressSearch(userID,searchText);
                  
                }
              })
           

          //  }
          // })
        
  console.log("tempresults : ",tempresults);
    
    addToBigQuery(req,bigquery);

     }

/*****************************************************************************************/
function createWebResponse(results){
  console.log("Inside create Web response");
  var messagesJson=[];
  var msg ="";
  msg={
        "type":0,
         "speech": 'We got `' + results.nbHits + '` results'};
     
  var dataArray=[];
  var product="";
             
       for (var h in results.hits) {
                        console.log("count :"+h);
                        console.log(" result count : "+results.nbHits);
                                     
                product={
                             "name":results.hits[h].ProductName,
                             "url": results.hits[h].ProductURL,
                             "imageurl" : results.hits[h].imageURL
                            };
                            dataArray.push(product);
                    }



        msg={ "type":4,
                         "speech": 'We got `' + results.nbHits + '` results',"payload":{"results":{"data":dataArray},"triggertext":"Is this the content you are looking for?"}};
         messagesJson.push(msg);
         res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
         res.send(JSON.stringify({ "speech": 'We got `' + results.nbHits + '` results',
         "messages": messagesJson,
         "source": "sourcename","displayText": "Success!!!!"}));

}

/*********************************************************************************************/
function wordpressSearch(userid,searchText){
  console.log("Wordpress search started ");
  admin.database().ref('/users/' + userid+'/blogurl').once('value').then(function(snapshot) {
    var messagesJson=[];
    var msg ="";
    var dataArray=[];
    var product="";
    var blogurl = snapshot.val();
    var str = searchText.replace(userid, "");
    console.log("searc text in WPsearch : ",str);
    wsrequest.get(blogurl+'/wp-json/wp/v2/posts')
                .query({ search: str })
                        .end((err, result) => {
                            if (err) {
                                res.status(500).json(err);
                            } else {
                                var reslutLimit=0;
                                console.log("Wordpress result length : ",Object.keys(result.body).length);
                                var cnt = Object.keys(result.body).length;
                                if(cnt ==0){
                                 //create default response
                                 sendDefaultResponse("We have no results matching your query");
                                } 
                                else{
                                  // var resCnt;
                                  // if(cnt>5){
                                  //    resCnt=5;
                                  // } else {
                                  //   resCnt=cnt;
                                  // }
                                  for(var i = 0; i < cnt; i++) {
                                  if(((result.body[i].title.rendered).indexOf(str))!==-1){
                                    product = { "name": result.body[i].title.rendered,
                                    "url": result.body[i].link
                                    };
                                   dataArray.push(product);
                                   reslutLimit++;
                                  }
                                 if(reslutLimit ==3){
                                   break;
                                 }
                                
                                }
                              }
                     
                if(reslutLimit>0)   {         
                     msg={ "type":4,"payload":{"results":{"search":dataArray},"triggertext":"Is this the content you are looking for?"}};
                     messagesJson.push(msg);
                     res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
                    //  res.send(JSON.stringify({ "speech": 'We got `' + Object.keys(result.body).length + '` results',
                    res.send(JSON.stringify({ "speech": 'We got `' + reslutLimit + '` results',
                      "messages": messagesJson,
                      "source": "sourcename","displayText": "Success!!!!"}));
                            }
                        
                        else{
                          sendDefaultResponse("We have no results matching your query");
                        }
                      }
                      });
    });
    
}
//******************************************************************************************************************* */
function sendDefaultResponse(speech){

  res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
  res.send(JSON.stringify({ "speech": speech,
  "messages": { "type":4,"payload":{"results":{"triggertext":"Can I help you with something else?"}}},
  "source": "sourcename","displayText": "Success!!!!"}));

}

});