'use strict';

var fs = require('fs');

function Config(args) {
  this._args = args;
  if (!this._args[0]) {
    console.log('hello? command? please?');
    process.exit(1);
  }
}

Config.prototype.exec = function() {
  var Subcommand;
  var subinstance;

  try {
    fs.statSync(__dirname + '/subcommands/config/' + this._args[0] + '.js');
    Subcommand = require(__dirname + '/subcommands/config/' + this._args[0]).command;
    subinstance = new Subcommand(this._args.slice(1));
  } catch(e) {
    console.log('no such subcommand.');
    process.exit(1);
  }

  subinstance.exec();
}

module.exports = {};
module.exports.command = Config;
module.exports.help = {
  title: 'config',
  description: 'configure jamdora!',
  synopsis: 'jamdora config subcommand_here',
  sudo: 'not required'
};
