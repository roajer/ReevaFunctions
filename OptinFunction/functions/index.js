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

var algoliasearch = require('algoliasearch');
var client = algoliasearch('QQ0QXOBZRJ', '566a67d110d2a91c0453780cbcfa495e');
var optinindex = client.initIndex('optin');

exports.optinFunction = functions.https.onRequest((req, res) => {

    var triggermsg = 'Can I help you find anything else?';
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

if (snapshot.val().popupmsg != null){
                var responseMsg = JSON.stringify({
                    msg: snapshot.val().popupmsg,
                    subtitle: snapshot.val().offer,
                    title: snapshot.val().name,
                    imgurl: snapshot.val().imageurl,
                    optinid: 'default',
                    triggertext: triggermsg,
                    plan: 'free',
                    showchat: true
                });
            } else {
                var responseMsg = JSON.stringify({
                    msg: "",
                    subtitle: '',
                    title: "",
                    imgurl: "",
                    optinid: 'default',
                    triggertext: triggermsg,
                    plan: 'free',
                    showchat: false
                });
            }
                res.send(responseMsg);
            });
        }


        function apiRequest(req, res, https) {
            var apiai = require("apiai");

            var app = apiai("eaeb67944e454e788043ec95e041f79d");

            var options = {
                sessionId: SessionID,
                contexts: [{
                    name: 'context_number_one',
                    parameters: {
                        'userid': UserID,
                        'optinflag':'true'
                    }
                }]
            };

            var request = app.textRequest(actionReq, options);

            request.on('response', function(response) {
                console.log('response', response);
                console.log('response.result', response.result.fulfillment);
                var popupmessage = '';
                var optinID ='';
                          

                admin.database().ref(`/users/${UserID}`).once('value').then(snapshot => {
                    if (response.result.fulfillment.messages[0].type === 0) {
                        popupmessage = snapshot.val().popupmsg;
                        optinID = 'default';
                     } else if (response.result.fulfillment.messages[0].type === 4){
                        popupmessage = response.result.fulfillment.speech;
                        optinID = response.result.fulfillment.messages[0].payload.optinid;
                     };   
                     console.log('popupmessage', popupmessage);
                     console.log('optinID', optinID);
                    var responseMsg = JSON.stringify({
                        msg: popupmessage,
                        subtitle: snapshot.val().offer,
                        title: snapshot.val().name,
                        optinid: optinID,
                        imgurl: snapshot.val().imageurl,
                        triggertext: triggermsg,
                        plan: 'paid',
                        brand: snapshot.val().brand,
                        showchat: true
                    });
                    console.log('responseMsg', responseMsg);
                    res.send(responseMsg);
                });
            });

            request.on('error', function(error) {
                admin.database().ref(`/users/${UserID}`).once('value').then(snapshot => {
                    
                    var responseMsg = JSON.stringify({
                        msg: snapshot.val().popupmsg,
                        subtitle: snapshot.val().offer,
                        title: snapshot.val().name,
                        imgurl: snapshot.val().imageurl,
                        optinid: 'default',
                        triggertext: triggermsg,
                        brand: snapshot.val().brand,
                        plan: 'paid',
                        showchat: true
                    });
                  res.send(responseMsg);
                });
                console.error(error);
            });
            request.end();
        }

    });
});

exports.OptinFulfillment = functions.https.onRequest((req, res) => {
    let actionReq = req.body.result.action;
    var dataArray=[];
    var product="";
    let userid = req.body.result.contexts.find(function(element){
        return ( (element.name = 'context_number_one') && element.parameters.userid)
       }).parameters.userid;

       var forbidden = [userid, 'great', 'hi', 'hello', 'yes', 'sure' ];   

       console.log('userid', userid);

       console.log('Inside Action Search', actionReq);

      if (actionReq && actionReq === "ProductSearch"){
       console.log('Result and Parameters', req.body.result); 

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
            defaultOptin();
            
          }else {
         
            searchOptin(searchText);
         
        }

 } 

       function searchOptin(searchText){
        //  userid = 'az4rdea6AXdFnvIUdIQDkjBveSG2';
         console.log('Just started search optin', searchText);
          admin.database().ref('payments/'+userid+'/plan/id').once('value').then(function(snapshot) {
      
            console.log('Not sure what happend here', snapshot.val());
            if(snapshot.val() != null){
      
            //let tempresults= optinindex.search(userid+' '+searchText, {
                let tempresults= optinindex.search(searchText, {
                "hitsPerPage": "1",
                "page": "0",
                "attributesToRetrieve": "*",
                "facets": "[]",
                "filters": "userId:"+userid
              //  "filters": "userId:"+'az4rdea6AXdFnvIUdIQDkjBve2'
                 });
                 tempresults.then(function(results) {
                  console.log("Result for entity values : ",results);
                  if(results && results.nbHits >0) { 
                    //createWebResponse(results);
                    for (var h in results.hits) {
                  product={
                      "name":results.hits[0].optinname,
                      "optinid" : results.hits[0].objectID
                     };
                        dataArray.push(product);
                      }
                      console.log('results.hits[0].optinName', results.hits[0].optinname);
                      speech = results.hits[0].optinname;
                      stdResponse(dataArray, speech);
              // call client.destroy() this when you need to stop the node.js client it will release any keepalived connection
                   client.destroy();
                  } else {
                    defaultOptin();
                  }
                })
              } 
          }).catch(
            (err) => {

            console.error('Error', err);
           defaultOptin();
          });
     
         }

         function stdResponse(dataArray, speech){
             console.log('speech in response',speech);
            var messagesJson=[];
            var msg ='';
            var optinID = '';
            if(dataArray.length >0){
                optinID = dataArray[0].optinid;
            } 
            msg={ 
              "type":4,
              "speech": speech,
              "payload":{
                "results":{
                  "data":''
                          },
                "emailid": '',
                "optinid": optinID
                
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

          function defaultOptin(){
          
            admin.database().ref(`/users/${userid}`).once('value').then(snapshot => {
                var responseMsg = snapshot.val().popupmsg;
                stdResponse(dataArray, responseMsg);
                });

          }

          


});