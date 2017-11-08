const functions = require('firebase-functions');
const admin = require('firebase-admin');
var algoliasearch = require('algoliasearch');
var algoliasearch = require('algoliasearch');
var client = algoliasearch('QQ0QXOBZRJ', '566a67d110d2a91c0453780cbcfa495e');
var index = client.initIndex('products');

var optinindex = client.initIndex('optin');
admin.initializeApp(functions.config().firebase);


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });



exports.productCreate = functions.database
                        .ref(`/products/{userId}/{productID}`)
                        .onWrite(event => {
                            var date = new Date();
                            var product = event.data.val();
                            const userId = event.params.userId;
                            const productID = event.params.productID;
                            console.log(productID);
                            console.log(product);
                            console.log(userId);
                            
                            product.objectID = productID;

                            index.saveObject({
                                productname: product.productName,
                                proddesc: product.productDescription,
                                produrl: product.productURL,
                                prodtags: product.productTag,
                                userId: userId,
                                objectID: productID,
                                currentdate: date
                            }, function(err, content) {
                                    if (err) {
                                     throw err;
                                        }
                        console.log('Firebase<>Algolia object saved', product.objectID);

                        });
                    });


exports.productDelete = functions.database
                        .ref(`/products/{userId}/{productID}`)
                        .onDelete(event => {
                            const productID = event.params.productID;
                        index.deleteObject(productID, function(err, content) {   
                            if (err) {      throw err;    }
                        console.log('Firebase<>Algolia object deleted', productID);
  });

                        });

 exports.optinCreate = functions.database
                        .ref(`/optin/{userId}/{optinID}`)
                        .onWrite(event => {
                            var date = new Date();
                            var optin = event.data.val();
                            const userId = event.params.userId;
                            const optinID = event.params.optinID;
                            console.log(optinID);
                            console.log(optin);
                            console.log(userId);
                            
                            optin.objectID = optinID;

                            optinindex.saveObject({
                                optinname: optin.optinName,
                                optindesc: optin.optinDescription,
                                optinurl: optin.optinURL,
                             //   optintags: optin.optinTag,
                                userId: userId,
                                objectID: optinID,
                                currentdate: date
                            }, function(err, content) {
                                    if (err) {
                                     throw err;
                                        }
                        console.log('Firebase<>Algolia object saved', optin.objectID);

                        });
                    });

  exports.optinDelete = functions.database
                    .ref(`/optin/{userId}/{optinID}`)
                    .onDelete(event => {
                        const optinID = event.params.optinID;
                        optinindex.deleteObject(optinID, function(err, content) {   
                        if (err) {      throw err;    }
                    console.log('Firebase<>Algolia object deleted', optinID);
});

                    });