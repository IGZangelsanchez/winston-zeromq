/*
 * winston-zeromq.js: A ZeroMQ transport for Winston
 *
 * (C) 2010 Angel Sanchez
 * MIT LICENCE
 *
 */

var util = require('util'),
    winston = require('winston'),
    zmq = require('zmq');

//
// ### function ZeroMQ (options)
// #### @options {Object} Options for this instance.
// Constructor function for the ZeroMQ transport object responsible
// for persisting log messages and metadata to a terminal or TTY.
//
var ZeroMQ = exports.ZeroMQ = function (options) {
  winston.Transport.call(this, options);
  options = options || {};

  if (!options.socketAddress) {
    throw new Error('Cannot send messages to QLog server without socket address.');
  }

  var self = this;
  self.socketAddress = options.socketAddress;
  self.publisher = zmq.socket('push');

  self.publisher.on('error', function (err) {
    self.emit('error', err);
  });

  self.publisher.bindSync(self.socketAddress);

};

//
// Inherit from `winston.Transport`.
//
util.inherits(ZeroMQ, winston.Transport);

//
// Expose the name of this Transport on the prototype
//
ZeroMQ.prototype.name = 'ZeroMQ';

winston.transports.ZeroMQ = ZeroMQ;

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
ZeroMQ.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    return callback(null, true);
  }

  var self = this;

  var json = {
    level: level,
    timestamp: new Date().toJSON(),
    message: msg
  };

  if ( meta ) {
    json.meta = meta;
  }
  
  var self = this;
  process.nextTick(function () {
    self.publisher.send( JSON.stringify(json) );
  });

  self.emit('logged');
  callback(null, true);
};
