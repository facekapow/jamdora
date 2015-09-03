'use strict';

function isWebWorker() {
  if (typeof onmessage !== 'undefined' && typeof postMessage !== 'undefined' && typeof self !== 'undefined' && typeof window === 'undefined') {
    return true;
  } else {
    return false;
  }
}

/* inherits */
function inherits(obj, parent) {
  obj._super = parent;
  obj.prototype = Object.create(parent.prototype, {
    constructor: {
      value: obj,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
}
/* End inherits */

/* guid(), courtesy of http://stackoverflow.com/a/105074 */
function guid() {
  function S4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
}
/* End guid() */

/* EventEmitter */
function EventEmitter() {
  this._events = {};
}

EventEmitter.prototype.on = function(e, cb) {
  if (!this._events[e]) {
    this._events[e] = {
      listeners: []
    }
  }
  this._events[e].listeners.push(cb);
}

EventEmitter.prototype.emit = function(e, data) {
  if (!this._events[e]) {
    this._events[e] = {
      listeners: []
    }
  }
  for (var i = 0; i < this._events[e].listeners.length; i++) {
    this._events[e].listeners[i](data);
  }
}
/* End EventEmitter */

if (!isWebWorker()) {
  /* Document prototype extensions */
  var doc = HTMLDocument || Document;
  doc.prototype.get = function(str) {
    if (str.substr(0, 1) === '#') {
      return this.getElementById(str.substr(1));
    }
    if (str.substr(0, 1) === '.') {
      return this.getElementsByClassName(str.substr(1));
    }
    return this.getElementsByTagName(str);
  }
  /* End Document prototype extensions */

  /* HTMLElement prototype extensions */
  HTMLElement.prototype.remove = function() {
    this.parentElement.removeChild(this);
  }

  HTMLElement.prototype.text = function(val) {
    if (!val) return this.textContent;
    this.textContent = val;
  }

  HTMLElement.prototype.css = function(props, val) {
    if (typeof props === 'string') {
      if (!val) return this.style[props];
      this.style[props] = val;
    } else if (typeof props === 'object') {
      for (var prop in props) {
        this.style[prop] = props[prop];
      }
    } else if (typeof props === 'array') {
      if (!val) {
        var ret = [];
        for (var i = 0; i < props.length; i++) {
          ret.push(this.style[props[i]]);
        }
        return ret;
      }
      if (props.length > val.length) throw new Error('element.css(): not enough values in value array argument.');
      for (var i = 0; i < props.length; i++) {
        this.style[props[i]] = this.style[val[i]];
      }
    } else {
      throw new Error('element.css(): unknown arguments.');
    }
  }

  HTMLElement.prototype.hasMultipleOfClass = function(classToSearch) {
    var arr = this.className.split(' ');
    var times_found = 0;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === classToSearch) {
        times_found++;
      }
    }
    return (times_found > 1) ? true : false;
  }

  HTMLElement.prototype.hasClass = function(classToSearch) {
    var arr = this.className.split(' ');
    var found = false;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === classToSearch) {
        found = true;
      }
    }
    return found;
  }

  HTMLElement.prototype.addClass = function(classToAdd) {
    this.className += ' ' + classToAdd;
  }

  HTMLElement.prototype.removeClass = function(classToRemove) {
    var arr = this.className.split(' ');
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === classToRemove) {
        arr.splice(i, 1);
      }
    }
    this.className = arr.join(' ');
  }
  /* End HTMLElement prototype extensions */
}
