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
    console.log('ahem, what should I change?');
    process.exit(1);
  }
  this._key = this._args._[0];
  this._value = this._args._[1];
  if (this._args._[2]) {
    this._subkey = this._args._[1];
    this._value = this._args._[2];
  }
  if (this._args.t) {
    this._value = true;
  } else if (this._args.true) {
    this._value = true;
  } else if (this._args.f) {
    this._value = false;
  } else if (this._args.false) {
    this._value = false;
  } else if (!this._args._[1]) {
    console.log('uhh, ok. now the value, please!');
    process.exit(1);
  }
}

Config_Set.prototype.exec = function() {
  if (typeof cfg[this._key] === 'undefined' || cfg[this._key] === null) {
    console.log('nothing there, that key doesn\'t exist.');
    process.exit(1);
  }
  if (this._subkey) {
    cfg[this._key][this._subkey] = this._value;
  } else {
    cfg[this._key] = this._value;
  }
  if (this._key === 'db') {
    cfg[this._key] = "return " + this._value;
  }
  fs.writeFileSync(userHome() + '/.jamdora.json', JSON.stringify(cfg, null, '  '));
}

module.exports = {};
module.exports.command = Config_Set;
module.exports.help = {
  title: 'set',
  description: 'set config properties!',
  owner: 'config',
  synopsis: 'jamdora config set property_name [subproperty_name] property_value',
  sudo: 'not required'
};
