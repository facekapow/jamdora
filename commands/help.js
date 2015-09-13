'use strict';

var glob = require('glob');

function Help(args) {
  this._help = {};
}

Help.prototype.exec = function() {
  var self = this;
  glob(__dirname + '/*.js', function(err, files) {
    for (var i = 0; i < files.length; i++) {
      var command = require(files[i].substr(0, files[i].length - 3));
      if (!command.help.hidden) {
        self._help[command.help.title] = command.help;
        self._help[command.help.title].subcommands = {};
      }
    }

    glob(__dirname + '/subcommands/**/*.js', function(err, subfiles) {
      for (var i = 0; i < subfiles.length; i++) {
        var subcommand = require(subfiles[i].substr(0, subfiles[i].length - 3));
        self._help[subcommand.help.owner].subcommands[subcommand.help.title] = subcommand.help;
      }

      for (var k in self._help) {
        console.log('command: ' + self._help[k].title);
        console.log('  description: ' + self._help[k].description);
        console.log('  synopsis: ' + self._help[k].synopsis);
        console.log('  sudo? ' + self._help[k].sudo);
        for (var subk in self._help[k].subcommands) {
          console.log('    subcommand: ' + self._help[k].subcommands[subk].title);
          console.log('    description: ' + self._help[k].subcommands[subk].description);
          console.log('    synopsis: ' + self._help[k].subcommands[subk].synopsis);
          console.log('    sudo? ' + self._help[k].subcommands[subk].sudo);
          console.log('');
        }
        console.log('');
      }
      process.exit(0);
    });
  });
}

module.exports = {};
module.exports.command = Help;
module.exports.help = {
  hidden: true
}
