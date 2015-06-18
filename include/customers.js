//customers.js
//all customer db functions here

var nStore = require('nstore');
var exports = module.exports = {};

var customers = nStore.new('data/customers.db', function (){
  console.log('Customers Database Successfully loaded');
});

exports.saveCustomer = function(request, result) {
    customers.save(result.customer.id, {Name: request.body.firstName,
                                                    last_name: request.body.lastName
                                                    }, 
                                                    function(err, key) {
          if(err){
            console.log('error', "Error saving record to database: " + key );
            return false;
          }
          else {
            console.log('info', "Record saved successfully to customer DB: " + key );
            return true;
          }
      });
};