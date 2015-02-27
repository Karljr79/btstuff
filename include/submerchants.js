//submerchants.js
//all sub merchant functions here

var nStore = require('nstore');
var exports = module.exports = {};

var subMerchants = nStore.new('data/submerchants.db', function (){
  console.log('Sub Merchants Database Successfully loaded');
});

exports.saveSubMerchant = function(request, result) {
    subMerchants.save(result.merchantAccount.id, {business_name: request.body.dbaName,
                                                    last_name: request.body.lastName, 
                                                    company: request.body.company, 
                                                    email: request.body.emailAddress,
                                                    phone: request.body.phoneNumber,
                                                    status: result.merchantAccount.status
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