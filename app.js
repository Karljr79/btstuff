//app.js

//load dependencies
var express = require('express');
var braintree = require("braintree");
var bodyParser = require("body-parser");
var nStore = require('nstore');
var winston = require('winston');
var app = express();

//includes
var config = require('./include/config');

//setup payment variables
var  clientToken;

//finish setting up logging
winston.add(winston.transports.File, { filename: 'logs/serverlogs.log'});

//load db
//This would simulate the server storing a customer to use data later
var customers = nStore.new('data/customers.db', function (){
  winston.log('info', 'Customers Database Successfully loaded');
});

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
          winston.log('error', "Could not get client token");
        }
        else {
          winston.log('info', "Recieved Client Token");
          clientToken = response.clientToken;
          winston.log('info', 'Clientoken is '+ clientToken);
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
  var tagline = "Welcome";
  res.render('pages/index', {
    tagline: tagline
  });
});

//transactions page
app.get('/transactions', function(req, res) {
  var tagline = "Transactions";
  res.render('pages/transactions', {
    tagline: tagline
  });
});

// transactions - PayPal Only
app.get('/transactions/paypal', function(req, res) {
  var tagline = "PayPal Only";
  res.render('pages/trans_paypal', {
    tagline: tagline,
    clientToken: clientToken
  });
});

//transactions - drop in
app.get('/transactions/dropin', function(req, res) {
  var tagline = "Drop In UI";
  res.render('pages/trans_dropin', {
    tagline: tagline,
    clientToken: clientToken
  });
});

//transactions - custom
app.get('/transactions/custom', function(req, res) {
  var tagline = "Custom";
  res.render('pages/trans_custom', {
    tagline: tagline,
    clientToken: clientToken
  });
});

//transactions - payment token
app.get('/transactions/paymenttoken', function(req, res) {
  var tagline = "Transaction with Payment Token";
  res.render('pages/trans_paymenttoken', {
    tagline: tagline,
    clientToken: clientToken
  });
});

//transactions - customer id
app.get('/transactions/customerid', function(req, res) {
  var tagline = "Transaction with Customer ID";
  res.render('pages/trans_customerid', {
    tagline: tagline,
    clientToken: clientToken
  });
});


//transactions - success
app.get('/transactions/success', function(req, res) {
  var tagline = "Success";
  res.render('pages/success', {
    tagline: tagline,
  });
});

//transactions - search
app.get('/transactions/search', function(req, res) {
  var tagline = "Search Transaction";
  res.render('pages/trans_search', {
    tagline: tagline,
  });
});

//customers - main
app.get('/customers', function(req, res) {
  var tagline = "Customer Functions";
  var tagline2 = "Payment Method Functions";
  res.render('pages/customers', {
    tagline: tagline,
    tagline2: tagline2
  });
});

//customers - add
app.get('/customers/add', function(req, res) {
  var tagline = "Add a customer";
  res.render('pages/cust_add', {
    tagline: tagline,
  });
});

//customers - add
app.get('/customers/add_payment', function(req, res) {
  var tagline = "Add a customer";
  res.render('pages/cust_addpayment', {
    tagline: tagline,
    clientToken: clientToken
  });
});

//customers - search
app.get('/customers/search', function(req, res) {
  var tagline = "Search for a customer";
  
  var customerList = "";
  
  res.render('pages/cust_search', {
    tagline: tagline,
  });
});

//payment method search
app.get('/paymentmethod/search', function(req, res) {
  var tagline = "Search for a payment token";
  res.render('pages/payment_search', {
    tagline: tagline,
  });
});


app.post('/checkout', function(req, res) {
  var nonce = req.body.payment_method_nonce;
  var amount = req.body.amount;
  var transId, paymentType, debugId;
  var action = req.body.action;
  var bShouldSettle = true
  
  if(action == "Authorize") {
    bShouldSettle = false;
  }
  
  gateway.transaction.sale({
    amount: amount,
    orderId: "xyz123",
    paymentMethodNonce: nonce,
    options: {
      submitForSettlement: bShouldSettle
    },
    },function (err, result) {
        console.log("new sale arriving");
        if (err) throw err;

        if (result.success) {
          transId = result.transaction.id;
          winston.log('info', 'Transaction ID: ' + transId);
          res.render('pages/success', {
            tagline: "SUCCESS",
            transId: transId,
            message: "Transaction created successfully"
          });
        }
    });
});

app.post('/checkout/token', function(req, res) {
  var token = req.body.paymentToken;
  var amount = req.body.amount;
  gateway.transaction.sale({
    amount: amount,
    orderId: "xyz123",
    paymentMethodToken: token,
    options: {
      submitForSettlement: true
    },
    },function (err, result) {
        console.log("new payment token sale arriving");
        if (err) throw err;

        if (result.success) {
          var transId = result.transaction.id;
          winston.log('info', 'Transaction ID: ' + transId);
          res.render('pages/success', {
            tagline: "SUCCESS",
            transId: transId,
            message: "Payment Token transaction created successfully"
          });
        }
    });
});

app.post('/checkout/customerid', function(req, res) {
  var customerId = req.body.customerId;
  var amount = req.body.amount;
  gateway.transaction.sale({
    amount: amount,
    orderId: "xyz123",
    customerId: customerId,
    options: {
      submitForSettlement: true
    },
    },function (err, result) {
        console.log("new customer ID sale arriving");
        if (err) throw err;

        if (!result.success) {
          var message = result.message;
          winston.log('error', 'Customer ID Transaction Error ' + message);
          res.render('pages/error', {
            tagline: "Failure",
            message: message
          });
        } else {
          var transId = result.transaction.id;
          winston.log('info', 'Transaction ID: ' + transId);
          res.render('pages/success', {
            tagline: "SUCCESS",
            transId: transId,
            message: "Customer ID transaction created successfully"
          });
        }
    });
});


app.post('/transactions/void', function(req, res) {
  var transId = req.body.transid;
  gateway.transaction.void(transId, function (err, result) {
    if(err) {
      console.log("Error Voiding Transaction, this is not an AUTH please use Refund");
    }
    else {
      res.render('pages/success', {
            tagline: "SUCCESS",
            transId: transId,
            message: "Transaction Voided"
          });
    }
  });
});

app.post('/transactions/search', function(req, res) {
  var transId = req.body.transid;
  if (transId){
    gateway.transaction.find(transId, function (err, transaction) {
      if(err) {
        console.log("Transaction not found");
      }
      else {
        winston.log('info', "Successfully found transaction id: " + transId);
        res.render('pages/trans_details', { 
          tagline : "Details",
          transId: transId,
          paymentType: transaction.paymentInstrumentType,
          amount: transaction.amount,
          status: transaction.status
        });
      }
    });
  }
  else {
    //TODO
  }
});

app.post('/transactions/refund', function(req, res) {
  var transId = req.body.transId;
  if (transId){
    gateway.transaction.refund(transId, function (err, result) {
      if(err) {
        console.log("Could not refund transaction");
      }
      else {
        winston.log('info', "Successfully Refunded Id: " + transId);
        res.render('pages/trans_search', { tagline: "Search" })
      }
    });
  }
});

app.post('/transactions/clone', function(req, res) {
  var transId = req.body.transId;
  if (transId){
    gateway.transaction.cloneTransaction(transId, function (err, result) {
      if(err) {
        console.log("Could not clone transaction id: " + transId);
      }
      else {
        winston.log('info', "Successfully Cloned Transaction Id: " + transId);
        res.render('pages/trans_search', { tagline: "Search" })
      }
    });
  }
});

//add a customer
app.post('/customers/add', function(req, res) {
  var nonce = "";
  
  if (req.body.payment_method_nonce) {
    nonce = req.body.payment_method_nonce;
  }
  
  gateway.customer.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    company: req.body.company,
    email: req.body.emailAddress,
    phone: req.body.phoneNumber,
    id: req.body.customerId,
    paymentMethodNonce: nonce,
  }, function (err, result) {
    if(err) {
      winston.log('error', "Error creating customer: " + req.body.firstName + "" + req.body.lastName);
    }
    else {
      //store this customer in the db
      customers.save(result.customer.id, {first_name: req.body.firstName, 
                                            last_name: req.body.lastName, 
                                            company: req.body.company, 
                                            email: req.body.emailAddress,
                                            phone: req.body.phoneNumber
                                            }, 
                                            function(err, key) {
        if(err){
          winston.log('error', "Error saving record: " + key );
        }
        else {
          winston.log('info', "Record saved successfully to customer DB: " + key );
          res.render('pages/success', { tagline : "Success", transId: key, message: "Customer created and saved to the db"});
        }
      });
    }
  });
});

app.post('/customers/search', function(req, res) {
  var custId = req.body.custid;
  
  if (custId){
    gateway.customer.find(custId, function (err, customer) {
      if(err) {
        console.log("Customer not found");
      }
      else {
        winston.log('info', "Successfully found Customer id: " + customer.id);
        res.render('pages/cust_details', { tagline : "Test",  custId : customer.id });
      }
    });
  }
  else {
    //TODO
  }
});

app.post('/customers/delete', function(req, res) {
  var custId = req.body.custid;
  if (custId){
    gateway.customer.delete(custId, function (err) {
      if(err) {
        console.log("Customer not found");
      }
      else {
        winston.log('info', "Successfully deleted Customer id: " + custId);
        customers.remove(custId, function (err) {
          if (err) { throw err; }
          else {
            winston.log('info', "Deleted from the DB: " + custId );
          }
        });
        res.render('pages/cust_search', { tagline : "Search for a customer" });
      }
    });
  }
  else {
    //TODO
  }
});

app.post('/paymentmethod/search', function(req, res) {
  var tokenId = req.body.tokenid;
  if (tokenId){
    gateway.paymentMethod.find(tokenId, function (err, paymentMethod) {
      if(err) {
        console.log("Customer not found");
      }
      else {
        winston.log('info', "Successfully found Token id: " + paymentMethod.token);
        res.render('pages/payment_details', { tagline : "Details", 
                                              tokenId : paymentMethod.token,
                                              cardType: paymentMethod.cardType });
      }
    });
  }
  else {
    //TODO
  }
});

// error page 
app.get('/error', function(req, res) {
    res.render('pages/error', {
      message: req.param("message")
    });
});

//used for one time Braintree test Webhook
// app.get("/credentials", function (req, res) {
//   res.send(gateway.webhookNotification.verify(req.query.bt_challenge));
//   winston.log('info', 'Braintree Challenge Webhook Received' );
// });


// Serve the Mobile iOS Client with the token generated above
//his should only be called after the /login
app.get("/mobile/client_token", function (req, res) {
    
    if(gateway) {
    gateway.clientToken.generate({
      }, function (err, response) {
        if(err){
          winston.log('error', "Could not get client token");
        }
        else {
          winston.log('info', "Recieved Client Token");
          clientToken = response.clientToken;
          winston.log('info', 'Clientoken is '+ clientToken);
          res.send('{\"client_token\":\"'+clientToken+'\"}');
        }
      });
    }
    else {
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
          winston.log('info', 'Transaction ID: ' + transid);
          res.send('{\"transactionID\":\"'+transid+'\"}');
          res.end();
        } else {
          winston.log('error', result.message);
          res.send(500);
        }
      });
  }
  else //TODO add handling for saving to the vault.
  {
    
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
winston.log('8080 is the magic port');

module.exports = app;