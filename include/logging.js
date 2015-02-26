//logging.js

var winston = require('winston');

var myCustomLevels = { info: 0, warn: 1, error: 2, webhooks: 3 };

//set up logging transports
exports.logger = new (winston.Logger)({
  levels: myCustomLevels,
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({
      name: 'webhookfile',
      filename: './logs/webhook-logs.log',
      level: 'webhooks'
    }),
    new (winston.transports.File)({
      name: 'infofile',
      filename: './logs/info-logs.log',
      level: 'info'
    }),
    new (winston.transports.File)({
      name: 'errorfile',
      filename: './logs/error-logs.log',
      level: 'error'
    })
  ]
});