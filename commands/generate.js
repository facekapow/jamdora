'use strict';

var path = require('path');
var fs = require('fs');

function Generate(args) {
  this._args = args;
  if (!this._args[0]) {
    console.log('i need a folder to inspect!');
    process.exit(1);
  }
  if (this._args[1]) {
    if (this._args[1] === '-r' || this._args[1] === '--recurse') {
      this._recurse = true;
    } else {
      this._fn = this._args[1];
    }
  }
}

Generate.prototype.exec = function() {
  var self = this;
  try {
    var pathToFolder;
    var final_plist = {
      "songs": []
    }
    if (path.isAbsolute(this._args[0])) {
      pathToFolder = this._args[0];
    } else {
      pathToFolder = path.join(process.cwd(), this._args[0]);
    }
    function loopOver(folder) {
      var files = fs.readdirSync(folder);
      for (var i = 0; i < files.length; i++) {
        if (fs.statSync(path.join(folder, files[i])).isDirectory() && self._recurse) {
          loopOver(path.join(folder, files[i]));
        } else if (files[i].substr(files[i].length - 4) === ('.mp3' || '.ogg' || '.m4a' || 'aiff' || '.aac' || '.oga' || '.wav' || '.wma' || '.webm')) {
          final_plist.songs.push(path.join(folder, files[i]));
        }
      }
    }
    loopOver(pathToFolder);
    var writeFN = path.join(process.cwd(), 'playlist.json');
    if (this._fn) {
      if (path.isAbsolute(this._fn)) {
        writeFN = this._fn;
      } else {
        writeFN = path.join(process.cwd(), this._fn);
      }
    }
    fs.writeFileSync(writeFN, JSON.stringify(final_plist, null, '  '));
  } catch(e) {
    console.log('error reading folder.');
    process.exit(1);
  }

  process.exit(0);
}

module.exports = {};
module.exports.command = Generate;
module.exports.help = {
  title: 'generate',
  description: 'generate a playlist file from the files in the specified directory!',
  synopsis: 'jamdora generate path_to_folder [output_filename] [-r|--recurse]',
  sudo: 'only required if trying to read a restricted folder or write to a restricted path'
};
