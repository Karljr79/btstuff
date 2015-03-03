//routes.js

var customers = require('./handlers/customers.js');

module.exports = function(app){

	// customers routes
	app.get('/customers', customers.main);
  app.get('/customers/add', customers.add);
  app.get('/customers/add_payment', customers.addPayment); 
  app.get('/customers/search', customers.search);
  app.post('/customers/add', customers.addCustomer);
  app.post('/customers/search', customers.searchCustomer);
  app.post('/customers/delete', customers.deleteCustomer);

};