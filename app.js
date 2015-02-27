//app.js

//load dependencies
var express = require('express');
var braintree = require("braintree");
var bodyParser = require("body-parser");
var app = express();

//include modules
var config = require('./include/constants.js')
, submerchants = require('./include/submerchants.js')
, customers = require('./include/customers.js')
, logs = require('./include/logging.js');

var clientToken;

//create BT gateway with Sandbox Partner credentials
//these are emailed from BT Solutions
var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: config.merchantId,
  publicKey: config.publicKey,
  privateKey: config.privateKey
});

function generateClientToken() {
    gateway.clientToken.generate({
      }, function (err, response) {
        if(err){
          logs.logger.log('error', "Could not get client token");
        } else {
          logs.logger.log('info', "Recieved Client Token");
          clientToken = response.clientToken;
          logs.logger.log('info', 'Clientoken is '+ clientToken);
        }
      });
}

//let's get a client token
generateClientToken();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended:true
}));

//set the view engine to ejs
app.set('view engine', 'ejs');

//index page
app.get('/', function(req, res) {
  var resTagline = "Welcome";
  res.render('pages/index', {
    tagline: resTagline
  });
});

//transactions page
app.get('/transactions', function(req, res) {
  var resTagline = "Transactions";
  res.render('pages/transactions', {
    tagline: resTagline
  });
});

//transactions paypal only
app.get('/transactions/paypal', function(req, res) {
    var tagline = "PayPal Only";
    res.render('pages/transactions_paypal', {
      tagline: tagline,
      clientToken: clientToken,
      merchantId: config.merchantId
  });
});

//transactions drop in UI
app.get('/transactions/dropin', function(req, res) {
    var tagline = "Drop In UI";
    res.render('pages/transactions_dropin', {
      tagline: tagline,
      clientToken: clientToken,
      merchantId: config.merchantId
    });
});

//transactions custom UI
app.get('/transactions/custom', function(req, res) {
    var tagline = "Custom UI";
    res.render('pages/transactions_custom', {
      tagline: tagline,
      clientToken: clientToken
    });
});

//transactions - payment token
app.get('/transactions/paymenttoken', function(req, res) {
  var resTagline = "Transaction with Payment Token";
  res.render('pages/transactions_paymenttoken', {
    tagline: resTagline,
    clientToken: clientToken
  });
});

//transactions - customer id
app.get('/transactions/customerid', function(req, res) {
  var resTagline = "Transaction with Customer ID";
  res.render('pages/transactions_customerid', {
    tagline: resTagline,
    clientToken: clientToken
  });
});

//transactions - marketplace
app.get('/transactions/marketplace', function(req, res) {
   var resTagline = "Marketplace Transaction with Sub Merchant";
   res.render('pages/transactions_marketplace', {
      tagline: resTagline,
      clientToken: clientToken,
      merchantId: config.merchantId
   });
});

//transactions - success
app.get('/transactions/success', function(req, res) {
  var resTagline = "Success";
  res.render('pages/success', {
    tagline: resTagline,
  });
});

//transactions - search
app.get('/transactions/search', function(req, res) {
  var resTagline = "Search Transaction";
  res.render('pages/trans_search', {
    tagline: resTagline,
  });
});

//customers - main
app.get('/customers', function(req, res) {
  var resTagline = "Customer Functions";
  var resTagline2 = "Payment Method Functions";
  res.render('pages/customers', {
    tagline: resTagline,
    tagline2: resTagline2
  });
});

//customers - add
app.get('/customers/add', function(req, res) {
  var resTagline = "Add a customer";
  res.render('pages/cust_add', {
    tagline: resTagline,
  });
});

//customers - add
app.get('/customers/add_payment', function(req, res) {
  var resTagline = "Add a customer";
  res.render('pages/cust_addpayment', {
    tagline: resTagline,
    clientToken: clientToken
  });
});

//customers - search
app.get('/customers/search', function(req, res) {
  var resTagline = "Search for a customer";
  res.render('pages/cust_search', {
    tagline: resTagline,
  });
});

//payment method search
app.get('/paymentmethod/search', function(req, res) {
  var resTagline = "Search for a payment token";
  res.render('pages/payment_search', {
    tagline: resTagline,
  });
});

//payment method search
app.get('/paymentmethod/search', function(req, res) {
  var resTagline = "Search for a payment token";
  res.render('pages/payment_search', {
    tagline: resTagline,
  });
});

//marketplaces - main
app.get('/marketplaces', function(req, res) {
  var resTagline = "Marketplaces";
  res.render('pages/marketplaces', {
    tagline: resTagline,
  });
});

//marketplaces - add submerchant
app.get('/marketplaces/create', function(req, res) {
  var resTagline = "Createa Sub Merchant";
  res.render('pages/marketplaces_add', {
    tagline: resTagline,
  });
});

app.post('/checkout', function(req, res) {
  var reqNonce = req.body.payment_method_nonce;
  var reqAmount = req.body.amount;
  var reqTransId;
  var reqSale = req.body.optradioSale;
  var bShouldSettle = true;
  
  if(reqSale == "off") {
    bShouldSettle = false;
  }
  
  gateway.transaction.sale({
    amount: reqAmount,
    orderId: "xyz123",
    paymentMethodNonce: reqNonce,
    options: {
      submitForSettlement: bShouldSettle
    },
    },function (err, result) {
        console.log("new sale arriving");
        if (err) {
          throw err;
        } else if (!result.success) {
          var resultMessage = result.message;
          logs.logger.log('error', 'Payment Transaction Error ' + resultMessage);
          res.render('pages/error', {
            tagline: "Failure",
            message: resultMessage
          });
        } else {
          reqTransId = result.transaction.id;
          logs.logger.log('info', 'Successful sale! Transaction ID: ' + reqTransId);
          generateClientToken(); //generate a new token
          res.render('pages/success', {
            tagline: "SUCCESS",
            id: reqTransId,
            message: result.message
          });
        }
    });
});

app.post('/checkout/marketplace', function(req, res) {
  var reqNonce = req.body.payment_method_nonce;
  var reqAmount = req.body.amount;
  var reqSubId = req.body.subId;
  
  gateway.transaction.sale({
    amount: reqAmount,
    orderId: "xyz123",
    paymentMethodNonce: reqNonce,
    merchantAccountId: reqSubId,
    serviceFeeAmount: config.masterMerchantServiceFee,
    options: {
      submitForSettlement: true
    },
    },function (err, result) {
        console.log("new marketplace sale arriving");
        if (err) {
          throw err;
        } else if (!result.success) {
          var resultMessage = result.message;
          logs.logger.log('error', 'Payment Token Transaction Error ' + resultMessage);
          res.render('pages/error', {
            tagline: "Failure",
            message: resultMessage
          });
        } else {
          var resultTransId = result.transaction.id;
          logs.logger.log('info', 'Transaction ID: ' + resultTransId);
          generateClientToken(); //generate a new token
          res.render('pages/success', {
            tagline: "SUCCESS",
            id: resultTransId,
            message: "Marketplaces transaction created successfully"
          });
        }
    });
});

app.post('/checkout/token', function(req, res) {
  //create the sale
  gateway.transaction.sale({
    amount: req.body.amount,
    orderId: "xyz123",
    paymentMethodToken: req.body.paymentToken,
    options: {
      submitForSettlement: true
    },
    },function (err, result) {
        console.log("new payment token sale arriving");
        if (err) {
          throw err;
        }else if (!result.success) {
          logs.logger.log('error', 'Payment Token Transaction Error ' + result.message);
          res.render('pages/error', {
            tagline: "Failure",
            message: result.message
          });
        } else {
          var resultTransId = result.transaction.id;
          logs.logger.log('info', 'Transaction ID: ' + resultTransId);
          generateClientToken(); //generate a new token
          res.render('pages/success', {
            tagline: "SUCCESS",
            id: resultTransId,
            message: "Payment Token transaction created successfully"
          });
        }
    });
});

//checkout with a customer ID
app.post('/checkout/customerid', function(req, res) {
  gateway.transaction.sale({
    amount: req.body.amountt,
    orderId: "xyz123",
    customerId: req.body.customerId,
    options: {
      submitForSettlement: true
    },
    },function (err, result) {
        console.log("new customer ID sale arriving");
        if(err) {
          console.log("Error Voiding Transaction, this is not an AUTH please use Refund");
        } else if (!result.success) {
          logs.logger.log('error', 'Customer ID Transaction Error ' + result.message);
          res.render('pages/error', {
            tagline: "Failure",
            message: result.message
          });
        } else {
          logs.logger.log('info', 'Transaction ID: ' + result.transaction.id);
          generateClientToken();
          res.render('pages/success', {
            tagline: "SUCCESS",
            id: result.transaction.id,
            message: "Customer ID transaction created successfully"
          });
        }
    });
});

//transactions void
app.post('/transactions/void', function(req, res) {
  var reqTransId = req.body.transId;
  gateway.transaction.void(reqTransId, function (err, result) {
    if(err) {
      console.log("Error Voiding Transaction, this is not an AUTH please use Refund");
    } else if (!result.success) {
        logs.logger.log('error', 'Error refunding transaction, message:  ' + result.message);
        res.render('pages/error', {
          tagline: "Failure Voiding Transaction",
          message: result.message
        });
      } else {
        res.render('pages/success', { tagline : "Success", transId: reqTransId, message: "Successfully Voided Transaction"});
      }
    });
});

app.post('/transactions/settle', function(req, res) {
  var reqTransId = req.body.transId;
  gateway.transaction.submitForSettlement(reqTransId, function (err, result) {
    if(err) {
      console.log("Error Settling Transaction, this is not an AUTH please use Refund");
    } else if (!result.success) {
        logs.logger.log('error', 'Error refunding transaction, message:  ' + result.message);
        res.render('pages/error', {
          tagline: "Failure Voiding Transaction",
          message: result.message
        });
      } else {
        res.render('pages/success', { tagline : "Success", transId: reqTransId, message: "Successfully Settled Authorization"});
      }
    });
});

//transactions search
app.post('/transactions/search', function(req, res) {
  var reqTransId = req.body.transid;
  if (reqTransId){
    gateway.transaction.find(reqTransId, function (err, transaction) {
      if(err) {
        console.log("Transaction not found");
      } else {
        logs.logger.log('info', "Successfully found transaction id: " + reqTransId);
        res.render('pages/trans_details', { 
          tagline : "Details",
          transId: reqTransId,
          paymentType: transaction.paymentInstrumentType,
          amount: transaction.amount,
          status: transaction.status,
          type: transaction.type
        });
      }
    });
  } else {
    logs.logger.log('error', "No transaction Id provided");
    res.end();
  }
});

app.post('/transactions/refund', function(req, res) {
  var reqTransId = req.body.transId;
  
  gateway.transaction.refund(reqTransId, function (err, result) {
    if(err) {
      console.log("Could not refund transaction");
    } else if (!result.success) {
        logs.logger.log('error', 'Error refunding transaction, message:  ' + result.message);
        res.render('pages/error', {
          tagline: "Failure Refunding Transaction",
          message: result.message
        });
    } else {
      res.render('pages/success', { tagline : "Success", id: reqTransId, message: "Successfully Refunded Transaction"});
    }
  });
});

app.post('/transactions/clone', function(req, res) {
  var reqTransId = req.body.transId;
  if (reqTransId){
    gateway.transaction.cloneTransaction(reqTransId, function (err, result) {
      if(err) {
        console.log("Could not clone transaction id: " + reqTransId);
      } else if (!result.success) {
        logs.logger.log('error', 'Error cloning transaction, message:  ' + result.message);
        res.render('pages/error', {
          tagline: "Failure Cloning Transaction",
          message: result.message
        });
      } else {
        logs.logger.log('info', "Successfully Cloned Transaction Id: " + reqTransId);
        res.render('pages/success', { tagline : "Success", id: reqTransId, message: "Successfully Cloned Transaction"});
      }
    });
  }
});

//add a customer
app.post('/customers/add', function(req, res) {
  var reqNonce = "";
  
  if (req.body.payment_method_nonce) {
    reqNonce = req.body.payment_method_nonce;
  }
  
  gateway.customer.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    company: req.body.company,
    email: req.body.emailAddress,
    phone: req.body.phoneNumber,
    id: req.body.customerId,
    paymentMethodNonce: reqNonce,
  }, function (err, result) {
    if(err) {
      logs.logger.log('error', "Error creating customer: " + req.body.firstName + "" + req.body.lastName);
    } else if (!result.success) {
      logs.logger.log('error', 'Customer creation Error: ' + result.message);
      res.render('pages/error', {
        tagline: "Failure",
        message: result.message});
    } else {
      customers.saveCustomer(req, res);
      res.render('pages/success', { tagline : "Success", id: result.merchantAccount.id, message: "Sub Merchant created and saved to the db"});
    }
  });
});

app.post('/customers/search', function(req, res) {
  var reqCustId = req.body.custid;
  
  if (reqCustId){
    gateway.customer.find(reqCustId, function (err, customer) {
      if(err) {
        console.log("Customer not found");
      } else {
        logs.logger.log('info', "Successfully found Customer id: " + customer.id);
        res.render('pages/cust_details', { tagline : "Test",  custId : customer.id });
      }
    });
  } else {
    logs.logger.log('error', "No Customer Id provided");
    res.end();
  }
});

//delete a customer
app.post('/customers/delete', function(req, res) {
  var reqCustId = req.body.custid;
  if (reqCustId){
    gateway.customer.delete(reqCustId, function (err) {
      if(err) {
        console.log("Customer not found");
      }
      else {
        logs.logger.log('info', "Successfully deleted Customer id: " + reqCustId);
        customers.remove(reqCustId, function (err) {
          if (err) { throw err; }
          else {
            logs.logger.log('info', "Deleted from the DB: " + reqCustId );
          }
        });
        res.render('pages/cust_search', { tagline : "Search for a customer" });
      }
    });
  } else {
    logs.logger.log('error', "No Customer Id provided");
    res.end();
  }
});

//payment method search
app.post('/paymentmethod/search', function(req, res) {
  var reqTokenId = req.body.tokenid;
  if (reqTokenId){
    gateway.paymentMethod.find(reqTokenId, function (err, paymentMethod) {
      if(err) {
        console.log("Customer not found");
      } else {
        logs.logger.log('info', "Successfully found Token id: " + paymentMethod.token);
        res.render('pages/payment_details', { tagline : "Details", 
                                              tokenId : paymentMethod.token,
                                              cardType: paymentMethod.cardType });
      }
    });
  } else {
    logs.logger.log('error', "No Payment Token Id provided");
    res.end();
  }
});

//add a customer
app.post('/marketplaces/add', function(req, res) {
  
  var merchantAccountParams = {
    individual: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.emailAddress,
      phone: req.body.phoneNumber,
      dateOfBirth: req.body.dob,
      ssn: req.body.ssn,
      address: {
        streetAddress: "111 Main St",
        locality: "San Jose",
        region: "CA",
        postalCode: "95131"
      }
    },
    business: {
      legalName: req.body.legalName,
      dbaName: req.body.dbaName,
      taxId: req.body.taxId,
      address: {
        streetAddress: "111 Main St",
        locality: "San Jose",
        region: "CA",
        postalCode: "95131"
      }
  },
    funding: {
      descriptor: req.body.dbaName,
      destination: "bank",
      accountNumber: "1123581321",
      routingNumber: "071101307"
    },
    tosAccepted: true,
    masterMerchantAccountId: config.masterMerchantId,
    id: req.body.subMerchantId
  };
  
  gateway.merchantAccount.create(merchantAccountParams, function(err, result) {
    if (err){ 
      throw err
    } 
    if (!result.success) {
      logs.logger.log('error', 'Submerchant account creation Error: ' + result.message);
      res.render('pages/error', {
        tagline: "Failure",
        message: result.message});
    } else {
        submerchants.saveSubMerchant(req, result);
        res.render('pages/success', { tagline : "Success", id: result.merchantAccount.id, message: "Sub Merchant created and saved to the db"});
      }
    });
});

// error page 
app.get('/error', function(req, res) {
    res.render('pages/error', {
      message: req.param("message")
    });
});

//handle webhooks (all method because 1 time challenge will be a get)
app.all("/webhooks", function (req, res) {
  //for onetime braintree challenge
  if (req.method === 'GET') {
    res.send(gateway.webhookNotification.verify(req.query.bt_challenge));
    logs.logger.log('webhooks', 'Braintree Challenge Webhook Received. Challenge: ' + req.query.bt_challenge);
    res.end();
  } else {
     gateway.webhookNotification.parse(
      req.body.bt_signature,
      req.body.bt_payload,
      function (err, webhookNotification) {
        if (err) { 
          throw err; 
        } else {
          //is this a sub merchant approved webhook????
          if(webhookNotification.kind === "sub_merchant_account_approved") {
            logs.logger.log('webhooks', "===========New Webhook Received==========");
            logs.logger.log('webhooks', "Notification Type: " + webhookNotification.kind);
            logs.logger.log('webhooks', "Merchant Account ID: " +  webhookNotification.merchantAccount.id);
            logs.logger.log('webhooks', "Master Merchant Id: " + webhookNotification.merchantAccount.masterMerchantAccount.id);
            logs.logger.log('webhooks', "Merchant Account Status: " + webhookNotification.merchantAccount.status);
            logs.logger.log('webhooks', "===========End ==========================");
          } else {
            logs.logger.log('webhooks', "===========New Webhook Received==========");
            logs.logger.log('webhooks', "Notification Type: " + webhookNotification.kind);
            logs.logger.log('webhooks', "This Subscription's ID: " + webhookNotification.subscription.id);
            logs.logger.log('webhooks', "Master Plan Id: " + webhookNotification.subscription.planId);
            logs.logger.log('webhooks', "Price: " + webhookNotification.subscription.price);
            logs.logger.log('webhooks', "===========End ==========================");
          }
        }
    });
  }
});


// Serve the Mobile iOS Client with the token generated above
//his should only be called after the /login
app.get("/mobile/client_token", function (req, res) {
    
    if(gateway) {
    gateway.clientToken.generate({
      }, function (err, response) {
        if(err){
          logs.logger.log('error', "Could not get client token");
        } else {
          logs.logger.log('info', "Recieved Client Token");
          clientToken = response.clientToken;
          logs.logger.log('info', 'Clientoken is '+ clientToken);
          res.send('{\"client_token\":\"'+clientToken+'\"}');
        }
      });
    } else {
      res.redirect('/error' + '?message=You are not logged in, please call /login first with your merchant id');
    }
});

//handle grabbing the nonce from the client and creating a payment
app.post("/mobile/payment", function (req, res){
  var nonce = req.body["payment-method-nonce"];
  var amount = req.body.amount;
  var vault = req.body.vault;
  
  if (vault == "no")
  {
      gateway.transaction.sale({
        amount: amount,
        paymentMethodNonce: nonce,
      }, function (err, result) {
        console.log("new sale arriving");
        if (err) throw err;

        if (result.success) {
          var transid = result.transaction.id;
          logs.logger.log('info', 'Transaction ID: ' + transid);
          res.send('{\"transactionID\":\"'+transid+'\"}');
          res.end();
        } else {
          logs.logger.log('error', result.message);
          res.send(500);
        }
      });
  } else {
    //TODO add handling for saving to the vault.
  }
});

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// simple error handlers

//development error handler
//will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('pages/error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('pages/error', {
        message: err.message,
        error: err
    });
});

app.listen(process.env.PORT);
logs.logger.log('8080 is the magic port');

module.exports = app;