#!/usr/bin/env node

'use strict';

var args = process.argv.slice(2);
var fs = require('fs');

function userHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

try {
  fs.statSync(userHome() + '/.jamdora.json'); // if no errors occured, it exists
} catch(e) {
  // there was an error, so it doesn't exist. create it:
  fs.writeFileSync(userHome() + '/.jamdora.json', fs.readFileSync(__dirname + '/default_config/jamdora.json'));
}

try {
  fs.statSync(userHome() + '/.jamdora-users.json'); // if no errors occured, it exists
} catch(e) {
  // there was an error, so it doesn't exist. create it:
  fs.writeFileSync(userHome() + '/.jamdora-users.json', fs.readFileSync(__dirname + '/default_config/jamdora-users.json'));
}

// Windows CTRL-C interupt normalization
require('node-sigint');

process.on('SIGINT', function() {
  process.exit(0);
});

if (args.length === 0) {
  console.log('need some arguments! try typing \"help\" as the first argument.');
}

var Subapp;
var subinstance;

try {
  fs.statSync(__dirname + '/commands/' + args[0] + '.js');
  Subapp = require(__dirname + '/commands/' + args[0]).command;
  subinstance = new Subapp(args.slice(1));
} catch(e) {
  console.log('no such command.');
  process.exit(1);
}

subinstance.exec();
