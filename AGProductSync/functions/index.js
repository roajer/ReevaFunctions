const functions = require('firebase-functions');
const admin = require('firebase-admin');
var algoliasearch = require('algoliasearch');
var algoliasearch = require('algoliasearch');
var client = algoliasearch('QQ0QXOBZRJ', '566a67d110d2a91c0453780cbcfa495e');
var index = client.initIndex('products');
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
                            var product = event.data.val();
                            const userId = event.params.userId;
                            const productID = event.params.productID;
                            console.log(productID);
                            console.log(product);
                            product.objectID = productID;

                            index.saveObject(product, function(err, content) {
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