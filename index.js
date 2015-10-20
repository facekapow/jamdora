'use strict';

var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var xor = require('base64-xor');
var rand = require('rand-token');
var compression = require('compression');
var url = require('url');
var bp = require('body-parser');
var probe = require('node-ffprobe');
var coverArt = require('cover-art');
var getIP = require('ipware')().get_ip;
var JamdoraDB = require('./db');

var exports = module.exports = {};

function randNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function JamdoraServer(opt) {
  var isObject = typeof opt === 'object';
  if (isObject) {
    if (typeof opt.playlist === 'object') this._playlist = opt.playlist;
    if (typeof opt.playlist === 'string') this._playlist = JSON.parse(fs.readFileSync(opt.playlist));
  }
  if (isObject) {
    if (opt.db) this._db = new JamdoraDB(opt.db, 'object');
    if (opt.dbCont) this._db = new JamdoraDB(opt.dbCont, 'data');
    if (opt.dbPath) this._db = new JamdoraDB(opt.dbPath, 'path');
  }
  this._expressApp = express();
  if (isObject && !opt.compress == false) this._expressApp.use(compression());
  this._keys = [];
  this._sessionTokens = [];
  this._playlistIndex = 0;
  if (isObject && !opt.ipInfo == false) {
    this._expressApp.use(function(req, res, next) {
      getIP(req);
      next();
    });
  }
  this._expressApp.use(bp.json());
  var self = this;
  this._usedIndexes = [];
  this._expressApp.post('/get-token', function(req, res) {
    self._db.findByUsername(req.body.username, function(err, user) {
      if (err) {
        if (isObject && !opt.log == false) {
          var time = new Date();
          console.log(time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 500 internal server error @ \"/get-token\".');
        }
        return res.status(500).send('500 internal server error.');
      }
      if (!user) {
        if (isObject && !opt.log == false) {
          var time = new Date();
          var str = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 403 forbidden';
          if (!opt.ipInfo == false) ' w/ IP ' + req.clientIp;
          str += ' @ \"/get-token\".';
          console.log(str);
        }
        return res.status(403).send('403 forbidden.');
      }
      if (user.password !== req.body.password) {
        if (isObject && !opt.log == false) {
          var time = new Date();
          var str = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 403 forbidden';
          if (!opt.ipInfo == false) ' w/ IP ' + req.clientIp;
          str += ' @ \"/get-token\".';
          console.log(str);
        }
        return res.status(403).send('403 forbidden.');
      }
      var token = rand.generate(24).toString();
      self._sessionTokens.push({
        removed: false,
        hasBeenRegened: false,
        token: token,
        ip: req.clientIp
      });
      var tokPos = self._sessionTokens.length - 1;
      var key = rand.generate(12).toString();
      self._keys.push({
        removed: false,
        hasBeenRegened: false,
        key: key,
        ip: req.clientIp
      });
      var keyPos = self._keys.length - 1;
      var xor_token = xor.encode(key, token);
      res.status(200).send(JSON.stringify({
        aT: encodeURIComponent(xor_token),
        aAP:  encodeURIComponent(tokPos.toString()),
        aP: encodeURIComponent(keyPos.toString())
      }));
    });
  });
  this._expressApp.get('/stream', function(req, res) {
    var query = url.parse(req.url, true).query;
    if (self._keys[parseInt(decodeURIComponent(query.aP))] && self._sessionTokens[parseInt(decodeURIComponent(query.aAP))]) {
      if (self._keys[parseInt(decodeURIComponent(query.aP))].removed || self._sessionTokens[parseInt(decodeURIComponent(query.aAP))].removed) {
        if (isObject && !opt.log == false) {
          var time = new Date();
          var str = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 403 forbidden';
          if (!opt.ipInfo == false) ' w/ IP ' + req.clientIp;
          str += ' @ \"/stream\".';
          console.log(str);
        }
        res.status(403).send('403 forbidden.');
      } else {
        var decreypted_token = xor.decode(self._keys[parseInt(decodeURIComponent(query.aP))].key, decodeURIComponent(query.aT));
        if (self._sessionTokens[parseInt(decodeURIComponent(query.aAP))].token === decreypted_token) {
          var stream = fs.createReadStream(self._playlist.songs[self._playlistIndex]);
          res.append('Content-Type', 'audio/mpeg');
          res.append('Transfer-Encoding', 'chunked');
          res.append('Accept-Ranges', 'bytes');
          stream.pipe(res);
          var i = null;
          if (self._usedIndexes.length === self._playlist.songs.length) {
            self._usedIndexes = [];
          };
          if (typeof query.shuffle !== 'undefined' && query.shuffle !== null) {
            var tmp = randNum(0, self._playlist.songs.length);
            function randIt() {
              for (var i = 0; i < self._usedIndexes.length; i++) {
                if (self._usedIndexes[i] === tmp) {
                  tmp = randNum(0, self._playlist.songs.length);
                  randIt();
                }
              }
            }
            randIt();
            self._playlistIndex = tmp;
          } else {
            if (self._playlistIndex === (self._playlist.songs.length - 1)) {
              self._playlistIndex = 0;
            } else {
              self._playlistIndex++;
            }
          }
          self._usedIndexes.push(self._playlistIndex);
        } else {
          if (isObject && !opt.log == false) {
            var time = new Date();
            var str = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 403 forbidden';
            if (!opt.ipInfo == false) ' w/ IP ' + req.clientIp;
            str += ' @ \"/stream\".';
            console.log(str);
          }
          res.status(403).send('403 forbidden.');
        }
      }
    } else {
      if (isObject && !opt.log == false) {
        var time = new Date();
        var str = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 403 forbidden';
        if (!opt.ipInfo == false) ' w/ IP ' + req.clientIp;
        str += ' @ \"/stream\".';
        console.log(str);
      }
      res.status(403).send('403 forbidden.');
    }
  });
  this._expressApp.get('/track-info', function(req, res) {
    var index = (self._playlistIndex === 0) ? self._playlist.songs.length - 1 : self._playlistIndex - 1;
    probe(self._playlist.songs[index], function(err, info) {
      if (err) {
        if (isObject && !opt.log == false) {
          var time = new Date();
          console.log(time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 500 internal server error @ \"/track-info\".');
        }
        return res.status(500).send('500 internal server error.');
      }

      // remove server (and server FS) information
      info.filepath = null;
      info.file = null;
      info.streams = null;

      if (!info.metadata.title) {
        info.metadata.title = 'Unknown';
      }

      if (info.metadata.artist && info.metadata.album) {
        coverArt(info.metadata.artist, info.metadata.album, 'extralarge', function(err, artUrl) {
          if (err) {
            info.metadata.art_url = null;
          } else {
            info.metadata.art_url = url.format(artUrl);
          }

          res.send(JSON.stringify(info));
        });
      } else {
        info.metadata.art_url = null;
        info.metadata.artist = 'Unknown';
        info.metadata.album = 'Unknown';
        res.send(JSON.stringify(info));
      }
    });
  });
  this._expressApp.get('/playlist-info', function(req, res) {
    var ji = 0;
    var inf = {
      info: []
    };
    function probePlist() {
      probe(self._playlist.songs[ji], function(err, info) {
        if (err) {
          if (isObject && !opt.log == false) {
            var time = new Date();
            console.log(time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 500 internal server error @ \"/playlist-info\".');
          }
          return res.status(500).send('500 internal server error.');
        }

        // remove server (and server FS) information
        info.filepath = null;
        info.file = null;
        info.streams = null;

        inf.info.push(info);

        if (ji === (self._playlist.songs.length - 1)) {
          res.send(JSON.stringify(inf));
        } else {
          probePlist();
        }
      });
    }
  });
  this._expressApp.post('/remove-token', function(req, res) {
    if (self._keys[parseInt(decodeURIComponent(req.body.aP))] && self._sessionTokens[parseInt(decodeURIComponent(req.body.aAP))]) {
      if (self._keys[parseInt(decodeURIComponent(req.body.aP))].removed || self._sessionTokens[parseInt(decodeURIComponent(req.body.aAP))].removed) {
      } else {
        var decreypted_token = xor.decode(self._keys[parseInt(decodeURIComponent(req.body.aP))].key, decodeURIComponent(req.body.aT));
        if (self._sessionTokens[parseInt(decodeURIComponent(req.body.aAP))].token === decreypted_token) {
          self._sessionTokens[parseInt(decodeURIComponent(req.body.aAP))].removed = true;
          self._keys[parseInt(decodeURIComponent(req.body.aP))].removed = true;
          res.status(200).send('200 ok.');
        } else {
          if (isObject && !opt.log == false) {
            var time = new Date();
            var str = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 403 forbidden';
            if (!opt.ipInfo == false) ' w/ IP ' + req.clientIp;
            str += ' @ \"/remove-token\".';
            console.log(str);
          }
          res.status(403).send('403 forbidden.');
        }
      }
    } else {
      if (isObject && !opt.log == false) {
        var time = new Date();
        var str = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 403 forbidden';
        if (!opt.ipInfo == false) ' w/ IP ' + req.clientIp;
        str += ' @ \"/remove-token\".';
        console.log(str);
      }
      res.status(403).send('403 forbidden.');
    }
  });
  this._expressApp.post('/re-gen', function(req, res) {
    if (self._keys[parseInt(decodeURIComponent(req.body.aP))] && self._sessionTokens[parseInt(decodeURIComponent(req.body.aAP))]) {
      if (!self._keys[parseInt(decodeURIComponent(req.body.aP))].removed || !self._sessionTokens[parseInt(decodeURIComponent(req.body.aAP))].removed) {
        if (isObject && !opt.log == false) {
          var time = new Date();
          var str = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 403 forbidden';
          if (!opt.ipInfo == false) ' w/ IP ' + req.clientIp;
          str += ' @ \"/re-gen\".';
          console.log(str);
        }
        res.status(403).send('403 forbidden.');
      } else if (self._keys[parseInt(decodeURIComponent(req.body.aP))].hasBeenRegened || self._sessionTokens[parseInt(decodeURIComponent(req.body.aAP))].hasBeenRegened) {
        if (isObject && !opt.log == false) {
          var time = new Date();
          var str = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 403 forbidden';
          if (!opt.ipInfo == false) ' w/ IP ' + req.clientIp;
          str += ' @ \"/re-gen\".';
          console.log(str);
        }
        res.status(403).send('403 forbidden.');
      } else {
        var decreypted_token = xor.decode(self._keys[parseInt(decodeURIComponent(req.body.aP))].key, decodeURIComponent(req.body.aT));
        if (self._sessionTokens[parseInt(decodeURIComponent(req.body.aAP))].token === decreypted_token) {
          self._sessionTokens[parseInt(decodeURIComponent(req.body.aAP))].hasBeenRegened = true;
          self._keys[parseInt(decodeURIComponent(req.body.aP))].hasBeenRegened = true;
          var token = rand.generate(24).toString();
          self._sessionTokens.push({
            removed: false,
            hasBeenRegened: false,
            token: token,
            ip: req.clientIp
          });
          var tokPos = self._sessionTokens.length - 1;
          var key = rand.generate(12).toString();
          self._keys.push({
            removed: false,
            hasBeenRegened: false,
            key: key,
            ip: req.clientIp
          });
          var keyPos = self._keys.length - 1;
          var xor_token = xor.encode(key, token);
          res.json({
            aT: encodeURIComponent(xor_token),
            aAP: encodeURIComponent(tokPos.toString()),
            aP: encodeURIComponent(keyPos.toString())
          });
        } else {
          if (isObject && !opt.log == false) {
            var time = new Date();
            var str = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 403 forbidden';
            if (!opt.ipInfo == false) ' w/ IP ' + req.clientIp;
            str += ' @ \"/re-gen\".';
            console.log(str);
          }
          res.status(403).send('403 forbidden.');
        }
      }
    } else {
      if (isObject && !opt.log == false) {
        var time = new Date();
        var str = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ' 403 forbidden';
        if (!opt.ipInfo == false) ' w/ IP ' + req.clientIp;
        str += ' @ \"/re-gen\".';
        console.log(str);
      }
      res.status(403).send('403 forbidden.');
    }
  });
  if (opt.webFrontEnd && opt.webFrontEnd === true) {
    this._expressApp.use(express.static(__dirname + '/web'));
  }
}

exports.JamdoraUnsecureServer = function(opt) {
  this._jamInstance = new JamdoraServer(opt);
  this._server = http.createServer(this._jamInstance._expressApp);
}

exports.JamdoraUnsecureServer.prototype.listen = function(opt, cb) {
  this._server.listen(opt, cb);
}

exports.JamdoraSecureServer = function(opt) {
  this._jamInstance = new JamdoraServer(opt);
  this._server = https.createServer({
    key: opt.key,
    cert: opt.cert
  }, this._jamInstance._expressApp);
}

exports.JamdoraSecureServer.prototype.listen = function(opt, cb) {
  this._server.listen(opt, cb);
}

exports.serve = function(protocol, opt, cb) {
  switch (protocol) {
    case 'HTTP':
    case 'http':
      var server = new exports.JamdoraUnsecureServer(opt);
      server.listen((opt.port || 80), function(err) {
        if (err) cb(err);
        cb(null, server);
      });
      break;
    case 'HTTPS':
    case 'https':
      var server = new exports.JamdoraSecureServer(opt);
      server.listen((opt.port || 443), function(err) {
        if (err) cb(err);
        cb(null, server);
      });
      break;
    default:
      cb(new Error('serve(): unknown protocol.'), null);
      break;
  }
}
