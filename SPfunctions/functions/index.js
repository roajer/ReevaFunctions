const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.testkey);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.stripeCharge = functions.database
                        .ref(`/payments/{userId}`)
                        .onWrite(event => {
                            const payment = event.data.val();
                            const userId = event.params.userId;
                            //const paymentId = event.params.paymentId;
                            console.log(event);
                            console.log(payment);

                            // check if payment exists or it has already been charged
                            if(!payment || payment.charge) return;

                            return admin.database()
                                        .ref(`/users/${userId}`)
                                        .once('value')
                                        .then(snapshot => {
                                            return snapshot.val();
                                        })
                                        .then(customer => {
                                         //  console.log(payment);

                                         stripe.customers.create({
                                                email: payment.token.email,
                                                source: payment.token.id
                                              }).then(function(stripeCustomer) {

                                              //  admin.database()
                                              //  .ref(`/payments/${userId}/customerId`)
                                              //  .set(stripeCustomer.id);

                                                return stripe.subscriptions.create({
                                                  customer: stripeCustomer.id,
                                                  items: [{plan: payment.plan.id,},],
                                                });
                                              }).then(function(charge) {
                                                console.log(charge);
                                                return admin.database()
                                                .ref(`/payments/${userId}`)
                                                .update({customerId:  charge.customer, subscriptionID: charge.id});
                                                // New charge created on a new customer
                                              }, function(err) {
                                                console.log(err);
                                                // Deal with an error
                                              });

                                              })
                                            });
                                          //var stripeCustomer= stripe.customers.create({email: payment.token.email});
                                           // const amount = payment.amount;
                                         //  console.log(stripeCustomer);
                                         // console.log(stripeCustomer.id);
                                           // const idempotency_key = paymentId; // prevent duplicate charges
                                           // console.log(payment.token);
                                           // const source = payment.token.id;

                                          //  const currency = 'usd';
                                            //const charge = { amount, currency, source };
                                         // return stripe.subscriptions.create( {customer: stripeCustomer.id, items: [{plan: payment.plan.id,},],});
                                            //return stripe.charges.create(charge, { idempotency_key: idempotency_key });

                                      /*  .then(charge => {
                                            return admin.database()
                                                .ref(`/payments/${userId}${paymentId}/charge`)
                                                .set(payment.plan.id);
                                        });
                                              */

