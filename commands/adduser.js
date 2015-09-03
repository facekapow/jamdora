'use strict';

var fs = require('fs');

function userHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

function Adduser(args) {
  this._args = args;
  if (!this._args[0]) {
    console.log('you gotta give me a username!');
    process.exit(1);
  }
  if (!this._args[1]) {
    console.log('uhh, where\'s the password?');
    process.exit(1);
  }
}

Adduser.prototype.exec = function() {
  var users = JSON.parse(fs.readFileSync(userHome() + '/.jamdora-users.json'));
  users.records.push({
    username: this._args[0],
    password: this._args[1]
  });
  fs.writeFileSync(userHome() + '/.jamdora-users.json', JSON.stringify(users, null, '  '));
}

module.exports = {};
module.exports.command = Adduser;
module.exports.help = {
  title: 'adduser',
  description: 'add users to jamdora',
  synopsis: 'jamdora adduser username password',
  sudo: 'not required'
};
