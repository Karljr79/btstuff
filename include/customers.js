//customers.js
//all sub merchant functions here

var nStore = require('nstore');
var exports = module.exports = {};

var customers = nStore.new('data/customers.db', function (){
  console.log('info', 'Customers Database Successfully loaded');
});

exports.saveCustomer = function(request, result) {
    customers.save(result.customer.id, {first_name: request.body.firstName, 
                                            last_name: request.body.lastName, 
                                            company: request.body.company, 
                                            email: request.body.emailAddress,
                                            phone: request.body.phoneNumber
                                            },  function(err, key) {
          if(err){
            console.log('error', "Error saving customer record to database: " + key );
            return false;
          }
          else {
            console.log('info', "Customer record saved successfully to customer DB: " + key );
            return true;
          }
      });
};