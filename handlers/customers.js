//handlers/customers.js
var clientToken = require("app").clientToken;
var gateway = require("app").gateway;
var customers = require("app").customers;
var logs = require("app").logs;

//render customers main page
exports.main = function(req, res){
    var resTagline = "Customer Functions";
    var resTagline2 = "Payment Method Functions";
    res.render('pages/customers', {
        tagline: resTagline,
        tagline2: resTagline2
    });
};

exports.add = function(req, res){
    var resTagline = "Add a customer";
    res.render('pages/cust_add', {
        tagline: resTagline,
    });  
};

exports.addPayments = function(req, res){
    var resTagline = "Add a customer";
    res.render('pages/cust_addpayment', {
        tagline: resTagline,
        clientToken: clientToken
    });
}

exports.search = function(req, res){
    var resTagline = "Search for a customer";
    res.render('pages/cust_search', {
    tagline: resTagline,
    });
}

exports.addCustomer = function(req, res){
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
}