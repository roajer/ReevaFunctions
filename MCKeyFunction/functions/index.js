const functions = require('firebase-functions');
const cors = require('cors')({origin: true});

const BigQuery = require('@google-cloud/bigquery');
var request = require('superagent');
var querystring = require('querystring');
var dateTime = require('node-datetime');

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

// Your Google Cloud Platform project ID
const projectId = 'reeva-d9399';

// Instantiates a client
const bigquery = BigQuery({
        projectId: projectId
         });

exports.mcKeyFunction = functions.https.onRequest((req, res) => {

  cors(req, res, () => {
  //let actionReq = req.body.result.action;
  /*let UserID = req.query.userid;
  let SessionID = req.query.sessionid;
  let actionReq = req.query.query; */
//req.method = "GET";



  /* var exec = require('child_process').exec;
    var args = " --request POST --url 'https://login.mailchimp.com/oauth2/token' --data 'grant_type=authorization_code&client_id=228783371578&client_secret=5e0711480c62aa81f3d63992ad4bceb48f97409e2894bb0dfd&redirect_uri=https%3A%2F%2Fus-central1-reeva-d9399.cloudfunctions.net%2FmcKeyFunction&code=45f3c07d958e9de8b73674d6fd100fbf' --include"; 
     exec('curl ' + args, function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    }); 
    */
var userid = req.query.userid;

request.post('https://login.mailchimp.com/oauth2/token')
         .send(querystring.stringify({
            'grant_type': 'authorization_code',
            'client_id': '228783371578',
            'client_secret': '5e0711480c62aa81f3d63992ad4bceb48f97409e2894bb0dfd',
            'redirect_uri': 'http://127.0.0.1:4200/#/pages/integration',
            'code': req.query.code
          }))
            .end((err, result) => {
                if (err) {
                    console.log(err);
                    res.send('An unexpected error occured while trying to perform MailChimp oAuth');
                } else {
                    console.log(result);
                  // we need to get the metadata for the user
                  request.get('https://login.mailchimp.com/oauth2/metadata')
                    .set('Accept', 'application/json')
                    .set('Authorization', 'OAuth ' + result.body.access_token)
                        .end((err, metaResult) => {
                            if (err) {
                                console.log(err);
                                res.send('An unexpected error occured while trying to get MailChimp meta oAuth');
                            } else {
                                // save the result.body.access_token
                                // save the metadata in metaResult.body
                                // against the current user
                                var mailchimpConf = metaResult;
                                mailchimpConf.access_token = result.body.access_token;
                                console.log(mailchimpConf.access_token);
                                
                                admin.database().ref(`/integrations/`+userid).set({
                                    emailProvider: 'mailchimp',
                                    access_token: mailchimpConf.access_token,
                                    dc: mailchimpConf.body.dc,
                                    role: metaResult.body.role,
                                    accountname: metaResult.body.accountname,
                                    user_id: metaResult.body.user_id,
                                    login_details: metaResult.body.login,
                                   // email: metaResult.login.email,
                                   // login_id: metaResult.login.login_id,
                                   // login_name : metaResult.login.login_name,
                                  //  login_email: metaResult.login.login_email,

                                    login_url: metaResult.body.login_url,
                                    api_endpoint: metaResult.body.api_endpoint
                                });

                                res.send(JSON.stringify({ "data": mailchimpConf.access_token})); 
                              //  dataStore.saveMailChimpForUser(mailchimpConf.login.email, metaResult);
                              //  res.redirect('/pick-a-list.html?email=' + mailchimpConf.login.email)
                            }
                        });
                }
            });



  });
});

exports.getMailList = functions.https.onRequest((req, res) => {
    
      cors(req, res, () => {
        var userid = req.query.userid;
        var emailprovider = '';
        admin.database().ref('/integrations/' + userid).once('value').then(function(snapshot) {
            emailprovider = snapshot.val().emailProvider;
            if(emailprovider != null && emailprovider == 'mailchimp'){

                var api_endpoint = snapshot.val().api_endpoint;
                var access_token = snapshot.val().access_token;

                request.get(api_endpoint + '/3.0/lists')
                .set('Accept', 'application/json')
                .set('Authorization', 'OAuth ' + access_token)
                    .end((err, result) => {
                        if (err) {
                            res.status(500).json(err);
                        } else {
                            res.json(result.body.lists);
                        }
                    });

            } else if(emailprovider != null && emailprovider == 'mailerlite'){

                var tokenid = snapshot.val().access_token;
            request.get('http://api.mailerlite.com/api/v2/groups')
                          //  .set('Accept', 'application/json')
                            .set('X-MailerLite-ApiKey', access_token )
                                .end((err, result) => {
                                    if (err) {
                                        res.status(500).json(err);
                                    } else {
                                        res.json(result.body);
                                    }
                                });
            }
            


        });
      });
    });




exports.mcGetListFunction = functions.https.onRequest((req, res) => {

  cors(req, res, () => {

    var userid = req.query.userid;
    /* var mailchimpConf= '';
     admin.database().ref(`/integrations/`+userid).once('value').then(snapshot => {
        mailchimpConf=snapshot.val();
        return snapshot.val();
    });  */
var api_endpoint = '';
var access_token = '';
admin.database().ref('/integrations/' + userid).once('value').then(function(snapshot) {
    api_endpoint = snapshot.val().api_endpoint;
    access_token = snapshot.val().access_token;
    console.log(api_endpoint);
   // res.status(200).send(username);

request.get(api_endpoint + '/3.0/lists')
                .set('Accept', 'application/json')
                .set('Authorization', 'OAuth ' + access_token)
                    .end((err, result) => {
                        if (err) {
                            res.status(500).json(err);
                        } else {
                            res.json(result.body.lists);
                        }
                    });
  });
  });
});


exports.mlGetListFunction = functions.https.onRequest((req, res) => {

  cors(req, res, () => {

    var tokenid = req.query.tokenid;
    

request.get('http://api.mailerlite.com/api/v2/groups')
              //  .set('Accept', 'application/json')
                .set('X-MailerLite-ApiKey', tokenid )
                    .end((err, result) => {
                        if (err) {
                            res.status(500).json(err);
                        } else {
                            res.json(result.body);
                        }
                    });
  });
});






exports.emailSubFunction = functions.https.onRequest((req, res) => {

  cors(req, res, () => {

    var emailID = req.query.emailid;
    var sessionID = req.query.sessionid;
    var name = req.query.name;
    var userid = req.query.userid;
    var optinID = req.query.optinid;
// First get the integration data from DB   

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
        res.status(200).json("success");
    }
    
addBigQuery();
});

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
                            res.status(500).json(err);
                        } else {
                            res.json(result.body);
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
                            res.status(500).json(err);
                            console.log(err);
                        } else {
                            res.json(result.statusCode);
                    
                        }
                    });

}
function addBigQuery(){
    
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d');

      const rows = [{
        sessionID: sessionID ,
        emailID: emailID ,
        userName: name ,
        blogUserID: userid,
        Date: formatted
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

});



});




exports.wpSearchFunction = functions.https.onRequest((req, res) => {

  cors(req, res, () => {

    var search = req.query.query;
    var userid = req.query.userid;

admin.database().ref(`/users/${userid}/blogurl`).once('value').then(function(snapshot) {
var blogurl = snapshot.val();

request.get(blogurl+'/wp-json/wp/v2/posts')
            .query({ search: search })
              //  .set('Accept', 'application/json')
              //  .set('X-MailerLite-ApiKey', tokenid )
                    .end((err, result) => {
                        if (err) {
                            res.status(500).json(err);
                        } else {
                            var output = {}; var data = [];
                            for(var i = 0; i < 5; i++) {
                                //result.body
                              //  console.log(result.body[i]);

                              output[i] = {
                                  name: result.body[i].title.rendered,
                                  url: result.body[i].link
                              };                                                              
                              //  output['title'] = result.body[i].title.rendered;
                              //  output['url'] = result.body[i].link;
                               // data[i]=output;
                            console.log('op in for', output);
                            }
                            data.push(output); 
                        //for(var attributename in result.body){}
                            console.log(output);

                            res.json(data);
                        }
                    });

});
  });
});
