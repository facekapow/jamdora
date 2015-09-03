'use strict';

var jamdora = require('../');
var minimist = require('minimist');
var fs = require('fs');
var path = require('path');

function userHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

var cfg = JSON.parse(fs.readFileSync(userHome() + '/.jamdora.json'));

function Serve(args) {
  this._args = args;
  this._port = cfg.http.port;
  this._method = cfg.serverProtocol;
  if (this._method === 'https' || this._method === 'HTTPS') {
    this._port = cfg.https.port;
  }
  var dbfunc = new Function('__home', cfg.db);
  this._db = dbfunc(userHome());
  this._playlist = cfg.playlist;
  this._key = cfg.https.key;
  this._cert = cfg.https.cert;
  this._ipInfo = false;
  this._log = false;
  this._web = cfg.web;

  this._parsedArgs = minimist(this._args);

  // server protocol
  if (this._parsedArgs._[0]) this._method = this._parsedArgs._[0];
  if (this._method === 'https' || this._method === 'HTTPS') {
    this._port = cfg.https.port;
  }

  // port
  if (this._parsedArgs.port) this._port = this._parsedArgs.port;
  if (this._parsedArgs.p) this._port = this._parsedArgs.p;

  // https key
  if (this._parsedArgs.key) this._key = this._parsedArgs.key;
  if (this._parsedArgs.k) this._key = this._parsedArgs.k;

  // https certificate
  if (this._parsedArgs.cert) this._cert = this._parsedArgs.cert;
  if (this._parsedArgs.c) this._cert = this._parsedArgs.c;

  // playlist
  if (this._parsedArgs.playlist) this._playlist = this._parsedArgs.playlist;
  if (this._parsedArgs.P) this._playlist = this._parsedArgs.P;

  // db
  if (this._parsedArgs.db) this._db = this._parsedArgs.db;
  if (this._parsedArgs.d) this._db = this._parsedArgs.d;

  // log
  if (this._parsedArgs.log) {
    this._log = true;
  } else {
    this._log = false;
  }

  if (this._parsedArgs.l) {
    this._log = true;
  } else {
    this._log = false;
  }

  // ipinfo
  if (this._parsedArgs.ipinfo) {
    this._ipInfo = true;
  } else {
    this._ipInfo = false;
  }
  if (this._parsedArgs.i) {
    this._ipInfo = true;
  } else {
    this._ipInfo = false;
  }

  // web
  if (this._parsedArgs.web) {
    this._web = true;
  } else {
    this._web = false;
  }
  if (this._parsedArgs.w) {
    this._web = true;
  } else {
    this._web = false;
  }
}

Serve.prototype.exec = function() {
  var self = this;
  jamdora.serve(this._method, {
    playlist: path.resolve(this._playlist),
    dbCont: fs.readFileSync(path.resolve(this._db)),
    ipInfo: this._ipInfo,
    log: this._log,
    port: this._port,
    key: fs.readFileSync(path.resolve(this._key)),
    cert: fs.readFileSync(path.resolve(this._cert)),
    webFrontEnd: this._web
  }, function(err, server) {
    if (err) {
      console.log(err.stack);
      process.exit(1);
    }
    console.log(self._method + ' listening on :' + self._port + '...');
    process.on('SIGINT', function() {
      process.exit(0);
    });
  });
}


module.exports = {};
module.exports.command = Serve;
module.exports.help = {
  title: 'serve',
  description: 'serve up jamdora through http or https!',
  synopsis: 'jamdora serve [protocol] [-p port] -P playlist_file [-k https_key_file] [-c http_certificate_file] [-w]',
  sudo: 'only required if serving on a restricted port (like 80 or 443, etc)'
};
