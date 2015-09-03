var fs = require('fs');

function JamdoraDB(pathOrContOrRecordsObject, type) {
  if (type === 'path') {
    this._records = JSON.parse(fs.readFileSync(pathOrContOrRecordsObject)).records;
  } else if (type === 'data') {
    this._records = JSON.parse(pathOrContOrRecordsObject).records;
  } else if (type === 'object') {
    this._records = pathOrContOrRecordsObject.records;
  } else {
    this._records = JSON.parse(fs.readFileSync(pathOrContOrRecordsObject)).records;
  }
}

JamdoraDB.prototype.findByUsername = function(username, cb) {
  var self = this;
  process.nextTick(function() {
    for (var i = 0, len = self._records.length; i < len; i++) {
      var record = self._records[i];
      if (record.username === username) {
        return cb(null, record);
      }
    }
    return cb(null, null);
  });
}

module.exports = JamdoraDB;
