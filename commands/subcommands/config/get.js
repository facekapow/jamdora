'use strict';

var minimist = require('minimist');
var fs = require('fs');

function userHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

var cfg = JSON.parse(fs.readFileSync(userHome() + '/.jamdora.json'));

function Config_Set(args) {
  this._args = minimist(args);
  if (!this._args._[0]) {
    console.log('ahem, what should I get?');
    process.exit(1);
  }
  this._key = this._args._[0];
  if (this._args._[1]) {
    this._subkey = this._args._[1];
  }
}

Config_Set.prototype.exec = function() {
  if (typeof cfg[this._key] === 'undefined' || cfg[this._key] === null) {
    console.log('nothing there, that key doesn\'t exist.');
    process.exit(1);
  }
  if (this._subkey) {
    console.log(cfg[this._key][this._subkey]);
  } else {
    console.log(cfg[this._key]);
  }
}

module.exports = {};
module.exports.command = Config_Set;
module.exports.help = {
  title: 'get',
  description: 'get config properties!',
  owner: 'config',
  synopsis: 'jamdora config get property_name [subproperty_name]',
  sudo: 'not required'
};
