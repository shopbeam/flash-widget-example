;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

// not implemented
// The reason for having an empty file and not throwing is to allow
// untraditional implementation of this module.

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
﻿(function() {
  var topWindowService = require('./topWindowService')
    , deferredConfig = function(callback) {
      topWindowService.window().then(function(topWindow) {
          callback({
            url         : topWindow.Shopbeam.HOST + '/v1/analytics',
            publisherUrl: topWindow.location.href,
            topDocument : topWindow.document
          });
        }
      )
      ;
    };

  try {
    angular.module('shopbeamShared').service('analyticsService', [
      '$http',
      function($http) {
        this.post = function(data) {
          deferredConfig(function(config) {
            $http.post(config.url, angular.extend({
              publisherUrl: config.publisherUrl,
              referrer    : config.topDocument.referrer
            }, data));
          })
        }
      }
    ]);
  } catch (err) {
    console.warn('error caught while trying to register angular component: ', err);

    module.exports = {
      post: function(data) {
        deferredConfig(function(config) {
          var request = new XMLHttpRequest();
          
          data.referrer = config.topDocument.referrer;
          data.publisherUrl = config.publisherUrl;
          
          request.open('post', config.url, true);
          request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
          request.setRequestHeader('Accept', 'application/json, text/plain, */*');
          request.send(JSON.stringify(data));
        })
      }
    };
  }
}());

},{"./topWindowService":5}],4:[function(require,module,exports){
﻿(function() {
  var throttle = function(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last,
      deferTimer;
    return function() {
      var context = scope || this;

      var now = +new Date,
        args = arguments;
      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function() {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  };

  try {
    angular.module('shopbeamShared').value('throttle', throttle)
  } catch (err) {
    console.warn('error caught while trying to register angular component: ', err)
  }

  module.exports = throttle
}());

},{}],5:[function(require,module,exports){
﻿(function(service) {

  var pmrpc = require('../../lib/izuzak/pmrpc')
    , q = require('../../lib/kriskowal/q')
//    , $ = require('../../../widget/app/loader/build')
    , test = window.top.location
    , isTopWindow
    , crossDomain
    ;

  crossDomain = (typeof test != "object" && test.href);
  try {
    test.href;
    crossDomain = false;
  } catch (err) {
    crossDomain = true;
  }

  if (!crossDomain) {
    service.hash = function(hash) {
      return deferredFactory(function(deferred) {
        return function() {
          if (hash !== null && hash !== undefined) {
            if (hash !== '') hash = '#' + hash;
            window.top.history.replaceState(null, '',
                window.top.location.href
                  .replace(window.top.location.hash, '') + hash
            )
          }

          deferred.resolve(window.top.location.hash);
        }
      }, true)
    };

    service.href = function() {
      return deferredFactory(function(deferred) {
        return function() {
          deferred.resolve(window.top.location.href);
        }
      }, true)
    };

    service.location = function() {
      return deferredFactory(function(deferred) {
        return function() {
          var keys = ['hash', 'href', 'host', 'hostname', 'origin', 'pathname', 'port', 'protocol']
            , locationData = {};

          keys.forEach(function(key) {
            locationData[key] = window.top.location[key]
          });

          deferred.resolve(locationData);
        }
      }, true)
    };

    service.document = function() {
      return deferredFactory(function(deferred) {
        return function() {
          deferred.resolve(window.top.document);
        }
      }, true)
    };

    service.window = function() {
      return deferredFactory(function(deferred) {
        return function() {
          deferred.resolve(window.top);
        }
      }, true)
    };


  } else {
    //TODO: CROSS DOMAIN NOT WORKING YET LOOK AT TODO BELOW!!!
    service.hash = function(hash) {
      return deferredFactory(function(deferred) {
        pmrpc.call({
          destination        : 'publish',
          publicProcedureName: 'hash',
          params             : [hash],
          onSuccess          : function(returnObj) {
            deferred.resolve(returnObj.returnValue);
          }
        })
      })
    };

    service.location = function() {
      return deferredFactory(function(deferred) {
        pmrpc.call({
          destination        : 'publish',
          publicProcedureName: 'location',
          onSuccess          : function(returnObj) {
            deferred.resolve(returnObj.returnValue);
          }
        })
      })
    };

    service.href = function() {
      return deferredFactory(function(deferred) {
        pmrpc.call({
          destination        : 'publish',
          publicProcedureName: 'href',
          onSuccess          : function(returnObj) {
            deferred.resolve(returnObj.returnValue);
          }
        })
      })
    };

    service.window = function() {
      return deferredFactory(function(deferred) {
        pmrpc.call({
          destination        : 'publish',
          publicProcedureName: 'window',
          onSuccess          : function(returnObj) {
            deferred.resolve(returnObj.returnValue)
          }
        })
      })
    }

//    service.document = function() {
//      return deferredFactory(function(deferred) {
//        pmrpc.call({
//          destination        : 'publish',
//          publicProcedureName: 'document',
//          onSuccess          : function(returnObj) {
//            deferred.resolve(returnObj.returnValue);
//          }
//        })
//      })
//    };
  }

  try {
    angular.module('shopbeamShared').service('topWindowService', [
      function() {
        angular.copy(service, this);
      }
    ]);
  } catch (err) {
    //probably either no angular or no "shopbeamShared" module - it's k!
    console.warn('error caught while trying to register angular component: ', err)
  }


  //Only register rpc functions if you're the top window
  if (window === window.top) {
    pmrpc.register({
      publicProcedureName: 'hash',
      procedure          : function(hash) {
        try {
          return service.hash(hash);
        } catch (err) {
          console.error(err);
        }
      }
    });

    // TODO: make the rest of these async using `location` as a model
    pmrpc.register({
      publicProcedureName: 'location',
      isAsynchronous     : true,
      procedure          : function(onSuccess) {
        try {
          service.location().then(function(location) {
            onSuccess(location);
          });
        } catch (err) {
          console.error(err);
        }
      }
    });

    pmrpc.register({
      publicProcedureName: 'window',
      procedure          : function() {
        try {
//          return $.extend([window, {top: null, window: null}]);
          //TODO: write my own PostMessage RPC library and get rid of this useless pmrpc shit!
          return {
            document: {
              referrer: window.document.referrer
            },
            location: window.location,
            Shopbeam: {
              HOST: window.Shopbeam.HOST
            }
          };
//          return service.window();
        } catch (err) {
          console.error(err);
        }
      }
    })
  }

  function deferredFactory(fn, shouldSetTimeout) {
    var deferred = q.defer();
    if (shouldSetTimeout) {
      setTimeout(fn(deferred), 0);
    } else {
      fn(deferred);
    }
    return deferred.promise;
  }
}(exports));


},{"../../lib/izuzak/pmrpc":10,"../../lib/kriskowal/q":11}],6:[function(require,module,exports){
﻿/*!
 * Adaptation of the $(document).ready() function from jQuery
 * library for use in simple JavaScript scenarios.
 *
 * --------------------------------------------------------------------- 
 * jQuery JavaScript Library v1.4.3
 * http://jquery.com/ 
 *
 * Copyright (c) 2010 John Resig, http://jquery.com/
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ----------------------------------------------------------------------
 */

var w3c = !!document.addEventListener,
  loaded = false,
  toplevel = false,
  fns = [];

if (w3c) {
  document.addEventListener("DOMContentLoaded", contentLoaded, true);
  window.addEventListener("load", ready, false);
}
else {
  document.attachEvent("onreadystatechange", contentLoaded);
  window.attachEvent("onload", ready);

  try {
    toplevel = window.frameElement === null;
  } catch (e) {
  }
  if (document.documentElement.doScroll && toplevel) {
    scrollCheck();
  }
}

function contentLoaded() {
  (w3c) ?
    document.removeEventListener("DOMContentLoaded", contentLoaded, true) :
    document.readyState === "complete" &&
      document.detachEvent("onreadystatechange", contentLoaded);
  ready();
}

// If IE is used, use the trick by Diego Perini
// http://javascript.nwbox.com/IEContentLoaded/
function scrollCheck() {
  if (loaded) {
    return;
  }

  try {
    document.documentElement.doScroll("left");
  }
  catch (e) {
    window.setTimeout(arguments.callee, 15);
    return;
  }
  ready();
}

function ready() {
  if (loaded) {
    return;
  }
  loaded = true;

  var len = fns.length,
    i = 0;

  for (; i < len; i++) {
    fns[i].call(document);
  }
}

module.exports = function(fn) {
  // if the DOM is already ready,
  // execute the function
  return (loaded) ?
    fn.call(document) :
    fns.push(fn);
};

},{}],7:[function(require,module,exports){
﻿/*!
 * EventEmitter v4.2.3 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */

(function () {
	'use strict';

	/**
	 * Class for managing events.
	 * Can be extended to provide event functionality in other classes.
	 *
	 * @class EventEmitter Manages event registering and emitting.
	 */
	function EventEmitter() {}

	// Shortcuts to improve speed and size

	// Easy access to the prototype
	var proto = EventEmitter.prototype;

	/**
	 * Finds the index of the listener for the event in it's storage array.
	 *
	 * @param {Function[]} listeners Array of listeners to search through.
	 * @param {Function} listener Method to look for.
	 * @return {Number} Index of the specified listener, -1 if not found
	 * @api private
	 */
	function indexOfListener(listeners, listener) {
		var i = listeners.length;
		while (i--) {
			if (listeners[i].listener === listener) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Alias a method while keeping the context correct, to allow for overwriting of target method.
	 *
	 * @param {String} name The name of the target method.
	 * @return {Function} The aliased method
	 * @api private
	 */
	function alias(name) {
		return function aliasClosure() {
			return this[name].apply(this, arguments);
		};
	}

	/**
	 * Returns the listener array for the specified event.
	 * Will initialise the event object and listener arrays if required.
	 * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
	 * Each property in the object response is an array of listener functions.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Function[]|Object} All listener functions for the event.
	 */
	proto.getListeners = function getListeners(evt) {
		var events = this._getEvents();
		var response;
		var key;

		// Return a concatenated array of all matching events if
		// the selector is a regular expression.
		if (typeof evt === 'object') {
			response = {};
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					response[key] = events[key];
				}
			}
		}
		else {
			response = events[evt] || (events[evt] = []);
		}

		return response;
	};

	/**
	 * Takes a list of listener objects and flattens it into a list of listener functions.
	 *
	 * @param {Object[]} listeners Raw listener objects.
	 * @return {Function[]} Just the listener functions.
	 */
	proto.flattenListeners = function flattenListeners(listeners) {
		var flatListeners = [];
		var i;

		for (i = 0; i < listeners.length; i += 1) {
			flatListeners.push(listeners[i].listener);
		}

		return flatListeners;
	};

	/**
	 * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Object} All listener functions for an event in an object.
	 */
	proto.getListenersAsObject = function getListenersAsObject(evt) {
		var listeners = this.getListeners(evt);
		var response;

		if (listeners instanceof Array) {
			response = {};
			response[evt] = listeners;
		}

		return response || listeners;
	};

	/**
	 * Adds a listener function to the specified event.
	 * The listener will not be added if it is a duplicate.
	 * If the listener returns true then it will be removed after it is called.
	 * If you pass a regular expression as the event name then the listener will be added to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListener = function addListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var listenerIsWrapped = typeof listener === 'object';
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
				listeners[key].push(listenerIsWrapped ? listener : {
					listener: listener,
					once: false
				});
			}
		}

		return this;
	};

	/**
	 * Alias of addListener
	 */
	proto.on = alias('addListener');

	/**
	 * Semi-alias of addListener. It will add a listener that will be
	 * automatically removed after it's first execution.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addOnceListener = function addOnceListener(evt, listener) {
		return this.addListener(evt, {
			listener: listener,
			once: true
		});
	};

	/**
	 * Alias of addOnceListener.
	 */
	proto.once = alias('addOnceListener');

	/**
	 * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
	 * You need to tell it what event names should be matched by a regex.
	 *
	 * @param {String} evt Name of the event to create.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvent = function defineEvent(evt) {
		this.getListeners(evt);
		return this;
	};

	/**
	 * Uses defineEvent to define multiple events.
	 *
	 * @param {String[]} evts An array of event names to define.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvents = function defineEvents(evts) {
		for (var i = 0; i < evts.length; i += 1) {
			this.defineEvent(evts[i]);
		}
		return this;
	};

	/**
	 * Removes a listener function from the specified event.
	 * When passed a regular expression as the event name, it will remove the listener from all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to remove the listener from.
	 * @param {Function} listener Method to remove from the event.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListener = function removeListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var index;
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				index = indexOfListener(listeners[key], listener);

				if (index !== -1) {
					listeners[key].splice(index, 1);
				}
			}
		}

		return this;
	};

	/**
	 * Alias of removeListener
	 */
	proto.off = alias('removeListener');

	/**
	 * Adds listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
	 * You can also pass it a regular expression to add the array of listeners to all events that match it.
	 * Yeah, this function does quite a bit. That's probably a bad thing.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListeners = function addListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(false, evt, listeners);
	};

	/**
	 * Removes listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be removed.
	 * You can also pass it a regular expression to remove the listeners from all events that match it.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListeners = function removeListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(true, evt, listeners);
	};

	/**
	 * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
	 * The first argument will determine if the listeners are removed (true) or added (false).
	 * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be added/removed.
	 * You can also pass it a regular expression to manipulate the listeners of all events that match it.
	 *
	 * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
		var i;
		var value;
		var single = remove ? this.removeListener : this.addListener;
		var multiple = remove ? this.removeListeners : this.addListeners;

		// If evt is an object then pass each of it's properties to this method
		if (typeof evt === 'object' && !(evt instanceof RegExp)) {
			for (i in evt) {
				if (evt.hasOwnProperty(i) && (value = evt[i])) {
					// Pass the single listener straight through to the singular method
					if (typeof value === 'function') {
						single.call(this, i, value);
					}
					else {
						// Otherwise pass back to the multiple function
						multiple.call(this, i, value);
					}
				}
			}
		}
		else {
			// So evt must be a string
			// And listeners must be an array of listeners
			// Loop over it and pass each one to the multiple method
			i = listeners.length;
			while (i--) {
				single.call(this, evt, listeners[i]);
			}
		}

		return this;
	};

	/**
	 * Removes all listeners from a specified event.
	 * If you do not specify an event then all listeners will be removed.
	 * That means every event will be emptied.
	 * You can also pass a regex to remove all events that match it.
	 *
	 * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeEvent = function removeEvent(evt) {
		var type = typeof evt;
		var events = this._getEvents();
		var key;

		// Remove different things depending on the state of evt
		if (type === 'string') {
			// Remove all listeners for the specified event
			delete events[evt];
		}
		else if (type === 'object') {
			// Remove all events matching the regex.
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					delete events[key];
				}
			}
		}
		else {
			// Remove all listeners in all events
			delete this._events;
		}

		return this;
	};

	/**
	 * Emits an event of your choice.
	 * When emitted, every listener attached to that event will be executed.
	 * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
	 * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
	 * So they will not arrive within the array on the other side, they will be separate.
	 * You can also pass a regular expression to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {Array} [args] Optional array of arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emitEvent = function emitEvent(evt, args) {
		var listeners = this.getListenersAsObject(evt);
		var listener;
		var i;
		var key;
		var response;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				i = listeners[key].length;

				while (i--) {
					// If the listener returns true then it shall be removed from the event
					// The function is executed either with a basic call or an apply if there is an args array
					listener = listeners[key][i];

					if (listener.once === true) {
						this.removeListener(evt, listener.listener);
					}

					response = listener.listener.apply(this, args || []);

					if (response === this._getOnceReturnValue()) {
						this.removeListener(evt, listener.listener);
					}
				}
			}
		}

		return this;
	};

	/**
	 * Alias of emitEvent
	 */
	proto.trigger = alias('emitEvent');

	/**
	 * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
	 * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {...*} Optional additional arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emit = function emit(evt) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.emitEvent(evt, args);
	};

	/**
	 * Sets the current value to check against when executing listeners. If a
	 * listeners return value matches the one set here then it will be removed
	 * after execution. This value defaults to true.
	 *
	 * @param {*} value The new value to check for when executing listeners.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.setOnceReturnValue = function setOnceReturnValue(value) {
		this._onceReturnValue = value;
		return this;
	};

	/**
	 * Fetches the current value to check against when executing listeners. If
	 * the listeners return value matches this one then it should be removed
	 * automatically. It will return true by default.
	 *
	 * @return {*|Boolean} The current value to check for or the default, true.
	 * @api private
	 */
	proto._getOnceReturnValue = function _getOnceReturnValue() {
		if (this.hasOwnProperty('_onceReturnValue')) {
			return this._onceReturnValue;
		}
		else {
			return true;
		}
	};

	/**
	 * Fetches the events object and creates one if required.
	 *
	 * @return {Object} The events storage object.
	 * @api private
	 */
	proto._getEvents = function _getEvents() {
		return this._events || (this._events = {});
	};

	// Expose the class either via AMD, CommonJS or the global object
	if (typeof define === 'function' && define.amd) {
		define(function () {
			return EventEmitter;
		});
	}
	else if (typeof module === 'object' && module.exports){
		module.exports = EventEmitter;
	}
	else {
		this.EventEmitter = EventEmitter;
	}
}.call(this));

},{}],8:[function(require,module,exports){
﻿/*!
 * eventie v1.0.3
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 */

/*jshint browser: true, undef: true, unused: true */
/*global define: false */

(function(window) {

  'use strict';

  var docElem = document.documentElement;

  var bind = function() {
  };

  if (docElem.addEventListener) {
    bind = function(obj, type, fn) {
      obj.addEventListener(type, fn, false);
    };
  } else if (docElem.attachEvent) {
    bind = function(obj, type, fn) {
      obj[ type + fn ] = fn.handleEvent ?
        function() {
          var event = window.event;
          // add event.target
          event.target = event.target || event.srcElement;
          fn.handleEvent.call(fn, event);
        } :
        function() {
          var event = window.event;
          // add event.target
          event.target = event.target || event.srcElement;
          fn.call(obj, event);
        };
      obj.attachEvent("on" + type, obj[ type + fn ]);
    };
  }

  var unbind = function() {
  };

  if (docElem.removeEventListener) {
    unbind = function(obj, type, fn) {
      obj.removeEventListener(type, fn, false);
    };
  } else if (docElem.detachEvent) {
    unbind = function(obj, type, fn) {
      obj.detachEvent("on" + type, obj[ type + fn ]);
      try {
        delete obj[ type + fn ];
      } catch (err) {
        // can't delete window object properties
        obj[ type + fn ] = undefined;
      }
    };
  }

  var eventie = {
    bind  : bind,
    unbind: unbind
  };

// transport
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(eventie);

  } else if (typeof module === 'object' && module.exports) {
    module.exports = eventie;
  } else {
    // browser global
    window.eventie = eventie;
  }

})(this);

},{}],9:[function(require,module,exports){
﻿/*!
 * imagesLoaded v3.0.4
 * JavaScript is all like "You images are done yet or what?"
 */

(function(window) {

  'use strict';

  var $ //= window.jQuery;
  var console = window.console;
  var hasConsole = typeof console !== 'undefined';

// -------------------------- helpers -------------------------- //

// extend objects
  function extend(a, b) {
    for (var prop in b) {
      a[ prop ] = b[ prop ];
    }
    return a;
  }

  var objToString = Object.prototype.toString;

  function isArray(obj) {
    return objToString.call(obj) === '[object Array]';
  }

// turn element or nodeList into an array
  function makeArray(obj) {
    var ary = [];
    if (isArray(obj)) {
      // use object if already an array
      ary = obj;
    } else if (typeof obj.length === 'number') {
      // convert nodeList to array
      for (var i = 0, len = obj.length; i < len; i++) {
        ary.push(obj[i]);
      }
    } else {
      // array of single index
      ary.push(obj);
    }
    return ary;
  }

// --------------------------  -------------------------- //

  function defineImagesLoaded(EventEmitter, eventie) {

    /**
     * @param {Array, Element, NodeList, String} elem
     * @param {Object or Function} options - if function, use as callback
     * @param {Function} onAlways - callback function
     */
    function ImagesLoaded(elem, options, onAlways) {
      // coerce ImagesLoaded() without new, to be new ImagesLoaded()
      if (!( this instanceof ImagesLoaded )) {
        return new ImagesLoaded(elem, options);
      }
      // use elem as selector string
      if (typeof elem === 'string') {
        elem = document.querySelectorAll(elem);
      }

      this.elements = makeArray(elem);
      this.options = extend({}, this.options);

      if (typeof options === 'function') {
        onAlways = options;
      } else {
        extend(this.options, options);
      }

      if (onAlways) {
        this.on('always', onAlways);
      }

      this.getImages();

      if ($) {
        // add jQuery Deferred object
        this.jqDeferred = new $.Deferred();
      }

      // HACK check async to allow time to bind listeners
      var _this = this;
      setTimeout(function() {
        _this.check();
      });
    }

    ImagesLoaded.prototype = new EventEmitter();

    ImagesLoaded.prototype.options = {};

    ImagesLoaded.prototype.getImages = function() {
      this.images = [];

      // filter & find items if we have an item selector
      for (var i = 0, len = this.elements.length; i < len; i++) {
        var elem = this.elements[i];
        // filter siblings
        if (elem.nodeName === 'IMG') {
          this.addImage(elem);
        }
        // find children
        var childElems = elem.querySelectorAll('img');
        // concat childElems to filterFound array
        for (var j = 0, jLen = childElems.length; j < jLen; j++) {
          var img = childElems[j];
          this.addImage(img);
        }
      }
    };

    /**
     * @param {Image} img
     */
    ImagesLoaded.prototype.addImage = function(img) {
      var loadingImage = new LoadingImage(img);
      this.images.push(loadingImage);
    };

    ImagesLoaded.prototype.check = function() {
      var _this = this;
      var checkedCount = 0;
      var length = this.images.length;
      this.hasAnyBroken = false;
      // complete if no images
      if (!length) {
        this.complete();
        return;
      }

      function onConfirm(image, message) {
        if (_this.options.debug && hasConsole) {
          console.log('confirm', image, message);
        }

        _this.progress(image);
        checkedCount++;
        if (checkedCount === length) {
          _this.complete();
        }
        return true; // bind once
      }

      for (var i = 0; i < length; i++) {
        var loadingImage = this.images[i];
        loadingImage.on('confirm', onConfirm);
        loadingImage.check();
      }
    };

    ImagesLoaded.prototype.progress = function(image) {
      this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
      // HACK - Chrome triggers event before object properties have changed. #83
      var _this = this;
      setTimeout(function() {
        _this.emit('progress', _this, image);
        if (_this.jqDeferred) {
          _this.jqDeferred.notify(_this, image);
        }
      });
    };

    ImagesLoaded.prototype.complete = function() {
      var eventName = this.hasAnyBroken ? 'fail' : 'done';
      this.isComplete = true;
      var _this = this;
      // HACK - another setTimeout so that confirm happens after progress
      setTimeout(function() {
        _this.emit(eventName, _this);
        _this.emit('always', _this);
        if (_this.jqDeferred) {
          var jqMethod = _this.hasAnyBroken ? 'reject' : 'resolve';
          _this.jqDeferred[ jqMethod ](_this);
        }
      });
    };

    // -------------------------- jquery -------------------------- //

    if ($) {
      $.fn.imagesLoaded = function(options, callback) {
        var instance = new ImagesLoaded(this, options, callback);
        return instance.jqDeferred.promise($(this));
      };
    }


    // --------------------------  -------------------------- //

    var cache = {};

    function LoadingImage(img) {
      this.img = img;
    }

    LoadingImage.prototype = new EventEmitter();

    LoadingImage.prototype.check = function() {
      // first check cached any previous images that have same src
      var cached = cache[ this.img.src ];
      if (cached) {
        this.useCached(cached);
        return;
      }
      // add this to cache
      cache[ this.img.src ] = this;

      // If complete is true and browser supports natural sizes,
      // try to check for image status manually.
      if (this.img.complete && this.img.naturalWidth !== undefined) {
        // report based on naturalWidth
        this.confirm(this.img.naturalWidth !== 0, 'naturalWidth');
        return;
      }

      // If none of the checks above matched, simulate loading on detached element.
      var proxyImage = this.proxyImage = new Image();
      eventie.bind(proxyImage, 'load', this);
      eventie.bind(proxyImage, 'error', this);
      proxyImage.src = this.img.src;
    };

    LoadingImage.prototype.useCached = function(cached) {
      if (cached.isConfirmed) {
        this.confirm(cached.isLoaded, 'cached was confirmed');
      } else {
        var _this = this;
        cached.on('confirm', function(image) {
          _this.confirm(image.isLoaded, 'cache emitted confirmed');
          return true; // bind once
        });
      }
    };

    LoadingImage.prototype.confirm = function(isLoaded, message) {
      this.isConfirmed = true;
      this.isLoaded = isLoaded;
      this.emit('confirm', this, message);
    };

    // trigger specified handler for event type
    LoadingImage.prototype.handleEvent = function(event) {
      var method = 'on' + event.type;
      if (this[ method ]) {
        this[ method ](event);
      }
    };

    LoadingImage.prototype.onload = function() {
      this.confirm(true, 'onload');
      this.unbindProxyEvents();
    };

    LoadingImage.prototype.onerror = function() {
      this.confirm(false, 'onerror');
      this.unbindProxyEvents();
    };

    LoadingImage.prototype.unbindProxyEvents = function() {
      eventie.unbind(this.proxyImage, 'load', this);
      eventie.unbind(this.proxyImage, 'error', this);
    };

    // -----  ----- //

    return ImagesLoaded;
  }

// -------------------------- transport -------------------------- //

  if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      '../../../bower_components/eventEmitter/EventEmitter',
      'eventie/eventie'
    ],
      defineImagesLoaded);
  } else if (typeof module !== 'undefined' && module.exports) {
    var EventEmitter = require('./EventEmitter')
      , eventie = require('./eventie')
      ;

    module.exports = defineImagesLoaded(
      EventEmitter,
      eventie
    );
  } else {
    // browser global
    window.imagesLoaded = defineImagesLoaded(
      window.EventEmitter,
      window.eventie
    );
  }

})(window);

},{"./EventEmitter":7,"./eventie":8}],10:[function(require,module,exports){
﻿/*
 * pmrpc 0.7.1 - Inter-widget remote procedure call library based on HTML5
 *               postMessage API and JSON-RPC. https://github.com/izuzak/pmrpc
 *
 * Copyright 2012 Ivan Zuzak, Marko Ivankovic
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


//pmrpc = self.pmrpc =  function() {
module.exports = function pmrpc() {
  // check if JSON library is available
  if (typeof JSON === "undefined" || typeof JSON.stringify === "undefined" ||
    typeof JSON.parse === "undefined") {
    throw "pmrpc requires the JSON library";
  }

  // TODO: make "contextType" private variable
  // check if postMessage APIs are available
  if (typeof this.postMessage === "undefined" &&  // window or worker
    typeof this.onconnect === "undefined") {  // shared worker
    throw "pmrpc requires the HTML5 cross-document messaging and worker APIs";
  }

  // Generates a version 4 UUID
  function generateUUID() {
    var uuid = [], nineteen = "89AB", hex = "0123456789ABCDEF";
    for (var i = 0; i < 36; i++) {
      uuid[i] = hex[Math.floor(Math.random() * 16)];
    }
    uuid[14] = '4';
    uuid[19] = nineteen[Math.floor(Math.random() * 4)];
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    return uuid.join('');
  }

  // Checks whether a domain satisfies the access control list. The access
  // control list has a whitelist and a blacklist. In order to satisfy the acl,
  // the domain must be on the whitelist, and must not be on the blacklist.
  function checkACL(accessControlList, origin) {
    var aclWhitelist = accessControlList.whitelist;
    var aclBlacklist = accessControlList.blacklist;

    var isWhitelisted = false;
    var isBlacklisted = false;

    for (var i = 0; i < aclWhitelist.length; ++i) {
      if (origin.match(new RegExp(aclWhitelist[i]))) {
        isWhitelisted = true;
        break;
      }
    }

    for (var j = 0; j < aclBlacklist.length; ++j) {
      if (origin.match(new RegExp(aclBlacklist[j]))) {
        isBlacklisted = true;
        break;
      }
    }

    return isWhitelisted && !isBlacklisted;
  }

  // Calls a function with either positional or named parameters
  // In either case, additionalParams will be appended to the end
  function invokeProcedure(fn, self, params, additionalParams) {
    if (!(params instanceof Array)) {
      // get string representation of function
      var fnDef = fn.toString();

      // parse the string representation and retrieve order of parameters
      var argNames = fnDef.substring(fnDef.indexOf("(") + 1, fnDef.indexOf(")"));
      argNames = (argNames === "") ? [] : argNames.split(", ");

      var argIndexes = {};
      for (var i = 0; i < argNames.length; i++) {
        argIndexes[argNames[i]] = i;
      }

      // construct an array of arguments from a dictionary
      var callParameters = [];
      for (var paramName in params) {
        if (typeof argIndexes[paramName] !== "undefined") {
          callParameters[argIndexes[paramName]] = params[paramName];
        } else {
          throw "No such param: " + paramName;
        }
      }

      params = callParameters;
    }

    // append additional parameters
    if (typeof additionalParams !== "undefined") {
      params = params.concat(additionalParams);
    }

    // invoke function with specified context and arguments array
    return fn.apply(self, params);
  }

  // JSON encode an object into pmrpc message
  function encode(obj) {
    return "pmrpc." + JSON.stringify(obj);
  }

  // JSON decode a pmrpc message
  function decode(str) {
    return JSON.parse(str.substring("pmrpc.".length));
  }

  // Creates a base JSON-RPC object, usable for both request and response.
  // As of JSON-RPC 2.0 it only contains one field "jsonrpc" with value "2.0"
  function createJSONRpcBaseObject() {
    var call = {};
    call.jsonrpc = "2.0";
    return call;
  }

  // Creates a JSON-RPC request object for the given method and parameters
  function createJSONRpcRequestObject(procedureName, parameters, id) {
    var call = createJSONRpcBaseObject();
    call.method = procedureName;
    call.params = parameters;
    if (typeof id !== "undefined") {
      call.id = id;
    }
    return call;
  }

  // Creates a JSON-RPC error object complete with message and error code
  function createJSONRpcErrorObject(errorcode, message, data) {
    var error = {};
    error.code = errorcode;
    error.message = message;
    error.data = data;
    return error;
  }

  // Creates a JSON-RPC response object.
  function createJSONRpcResponseObject(error, result, id) {
    var response = createJSONRpcBaseObject();
    response.id = id;

    if (typeof error === "undefined" || error === null) {
      response.result = (result === "undefined") ? null : result;
    } else {
      response.error = error;
    }

    return response;
  }

  // dictionary of services registered for remote calls
  var registeredServices = {};
  // dictionary of requests being processed on the client side
  var callQueue = {};

  var reservedProcedureNames = {};
  // register a service available for remote calls
  // if no acl is given, assume that it is available to everyone
  function register(config) {
    if (config.publicProcedureName in reservedProcedureNames) {
      return false;
    } else {
      registeredServices[config.publicProcedureName] = {
        "publicProcedureName": config.publicProcedureName,
        "procedure"          : config.procedure,
        "context"            : config.procedure.context,
        "isAsync"            : typeof config.isAsynchronous !== "undefined" ?
          config.isAsynchronous : false,
        "acl"                : typeof config.acl !== "undefined" ?
          config.acl : {whitelist: ["(.*)"], blacklist: []}};
      return true;
    }
  }

  // unregister a previously registered procedure
  function unregister(publicProcedureName) {
    if (publicProcedureName in reservedProcedureNames) {
      return false;
    } else {
      delete registeredServices[publicProcedureName];
      return true;
    }
  }

  // retreive service for a specific procedure name
  function fetchRegisteredService(publicProcedureName) {
    return registeredServices[publicProcedureName];
  }

  // receive and execute a pmrpc call which may be a request or a response
  function processPmrpcMessage(eventParams) {
    var serviceCallEvent = eventParams.event;
    var eventSource = eventParams.source;
    var isWorkerComm = typeof eventSource !== "undefined" && eventSource !== null;

    // if the message is not for pmrpc, ignore it.
    if (serviceCallEvent.data.indexOf("pmrpc.") !== 0) {
      return;
    } else {
      var message = decode(serviceCallEvent.data);

      if (typeof message.method !== "undefined") {
        // this is a request

        var newServiceCallEvent = {
          data          : serviceCallEvent.data,
          source        : isWorkerComm ? eventSource : serviceCallEvent.source,
          origin        : isWorkerComm ? "*" : serviceCallEvent.origin,
          shouldCheckACL: !isWorkerComm
        };

        var response = processJSONRpcRequest(message, newServiceCallEvent);

        // return the response
        if (response !== null) {
          sendPmrpcMessage(
            newServiceCallEvent.source, response, newServiceCallEvent.origin);
        }
      } else {
        // this is a response
        processJSONRpcResponse(message);
      }
    }
  }

  // Process a single JSON-RPC Request
  function processJSONRpcRequest(request, serviceCallEvent, shouldCheckACL) {
    if (request.jsonrpc !== "2.0") {
      // Invalid JSON-RPC request
      return createJSONRpcResponseObject(
        createJSONRpcErrorObject(-32600, "Invalid request.",
          "The recived JSON is not a valid JSON-RPC 2.0 request."),
        null,
        null);
    }

    var id = request.id;
    var service = fetchRegisteredService(request.method);

    if (typeof service !== "undefined") {
      // check the acl rights
      if (!serviceCallEvent.shouldCheckACL ||
        checkACL(service.acl, serviceCallEvent.origin)) {
        try {
          if (service.isAsync) {
            // if the service is async, create a callback which the service
            // must call in order to send a response back
            var cb = function(returnValue) {
              sendPmrpcMessage(
                serviceCallEvent.source,
                createJSONRpcResponseObject(null, returnValue, id),
                serviceCallEvent.origin);
            };
            // create a errorback which the service
            // must call in order to send an error back
            var eb = function(errorValue) {
              sendPmrpcMessage(
                serviceCallEvent.source,
                createJSONRpcResponseObject(
                  createJSONRpcErrorObject(
                    -1, "Application error.", errorValue.message),
                  null, id),
                serviceCallEvent.origin);
            };
            invokeProcedure(
              service.procedure, service.context, request.params, [cb, eb, serviceCallEvent]);
            return null;
          } else {
            // if the service is not async, just call it and return the value
            var returnValue = invokeProcedure(
              service.procedure,
              service.context,
              request.params, [serviceCallEvent]);
            return (typeof id === "undefined") ? null :
              createJSONRpcResponseObject(null, returnValue, id);
          }
        } catch (error) {
          if (typeof id === "undefined") {
            // it was a notification nobody cares if it fails
            return null;
          }

          if (error.match("^(No such param)")) {
            return createJSONRpcResponseObject(
              createJSONRpcErrorObject(
                -32602, "Invalid params.", error.message),
              null,
              id);
          }

          // the -1 value is "application defined"
          return createJSONRpcResponseObject(
            createJSONRpcErrorObject(
              -1, "Application error.", error.message),
            null,
            id);
        }
      } else {
        // access denied
        return (typeof id === "undefined") ? null : createJSONRpcResponseObject(
          createJSONRpcErrorObject(
            -2, "Application error.", "Access denied on server."),
          null,
          id);
      }
    } else {
      // No such method
      return (typeof id === "undefined") ? null : createJSONRpcResponseObject(
        createJSONRpcErrorObject(
          -32601,
          "Method not found.",
          "The requestd remote procedure does not exist or is not available."),
        null,
        id);
    }
  }

  // internal rpc service that receives responses for rpc calls
  function processJSONRpcResponse(response) {
    var id = response.id;
    var callObj = callQueue[id];
    if (typeof callObj === "undefined" || callObj === null) {
      return;
    } else {
      delete callQueue[id];
    }

    // check if the call was sucessful or not
    if (typeof response.error === "undefined") {
      callObj.onSuccess({
        "destination"        : callObj.destination,
        "publicProcedureName": callObj.publicProcedureName,
        "params"             : callObj.params,
        "status"             : "success",
        "returnValue"        : response.result});
    } else {
      callObj.onError({
        "destination"        : callObj.destination,
        "publicProcedureName": callObj.publicProcedureName,
        "params"             : callObj.params,
        "status"             : "error",
        "message"            : response.error.message + " " + response.error.data});
    }
  }

  // call remote procedure
  function call(config) {
    // check that number of retries is not -1, that is a special internal value
    if (config.retries && config.retries < 0) {
      throw new Exception("number of retries must be 0 or higher");
    }

    var destContexts = [];

    if (typeof config.destination === "undefined" || config.destination === null || config.destination === "workerParent") {
      destContexts = [
        {context: null, type: "workerParent"}
      ];
    } else if (config.destination === "publish") {
      destContexts = findAllReachableContexts();
    } else if (config.destination instanceof Array) {
      for (var i = 0; i < config.destination.length; i++) {
        if (config.destination[i] === "workerParent") {
          destContexts.push({context: null, type: "workerParent"});
        } else if (typeof config.destination[i].frames !== "undefined") {
          destContexts.push({context: config.destination[i], type: "window"});
        } else {
          destContexts.push({context: config.destination[i], type: "worker"});
        }
      }
    } else {
      if (typeof config.destination.frames !== "undefined") {
        destContexts.push({context: config.destination, type: "window"});
      } else {
        destContexts.push({context: config.destination, type: "worker"});
      }
    }

    for (var i = 0; i < destContexts.length; i++) {
      var callObj = {
        destination        : destContexts[i].context,
        destinationDomain  : typeof config.destinationDomain === "undefined" ?
          ["*"] : (typeof config.destinationDomain === "string" ?
          [config.destinationDomain] : config.destinationDomain),
        publicProcedureName: config.publicProcedureName,
        onSuccess          : typeof config.onSuccess !== "undefined" ?
          config.onSuccess : function() {
        },
        onError            : typeof config.onError !== "undefined" ?
          config.onError : function() {
        },
        retries            : typeof config.retries !== "undefined" ? config.retries : 5,
        timeout            : typeof config.timeout !== "undefined" ? config.timeout : 500,
        status             : "requestNotSent"
      };

      isNotification = typeof config.onError === "undefined" && typeof config.onSuccess === "undefined";
      params = (typeof config.params !== "undefined") ? config.params : [];
      callId = generateUUID();
      callQueue[callId] = callObj;

      if (isNotification) {
        callObj.message = createJSONRpcRequestObject(
          config.publicProcedureName, params);
      } else {
        callObj.message = createJSONRpcRequestObject(
          config.publicProcedureName, params, callId);
      }

      waitAndSendRequest(callId);
    }
  }

  // Use the postMessage API to send a pmrpc message to a destination
  function sendPmrpcMessage(destination, message, acl) {
    if (typeof destination === "undefined" || destination === null) {
      self.postMessage(encode(message));
    } else if (typeof destination.frames !== "undefined") {
      return destination.postMessage(encode(message), acl);
    } else {
      destination.postMessage(encode(message));
    }
  }

  // Execute a remote call by first pinging the destination and afterwards
  // sending the request
  function waitAndSendRequest(callId) {
    var callObj = callQueue[callId];
    if (typeof callObj === "undefined") {
      return;
    } else if (callObj.retries <= -1) {
      processJSONRpcResponse(
        createJSONRpcResponseObject(
          createJSONRpcErrorObject(
            -4, "Application error.", "Destination unavailable."),
          null,
          callId));
    } else if (callObj.status === "requestSent") {
      return;
    } else if (callObj.retries === 0 || callObj.status === "available") {
      callObj.status = "requestSent";
      callObj.retries = -1;
      callQueue[callId] = callObj;
      for (var i = 0; i < callObj.destinationDomain.length; i++) {
        sendPmrpcMessage(
          callObj.destination, callObj.message, callObj.destinationDomain[i], callObj);
        self.setTimeout(function() {
          waitAndSendRequest(callId);
        }, callObj.timeout);
      }
    } else {
      // if we can ping some more - send a new ping request
      callObj.status = "pinging";
      var retries = callObj.retries;
      callObj.retries = retries - 1;

      call({
        "destination"        : callObj.destination,
        "publicProcedureName": "receivePingRequest",
        "onSuccess"          : function(callResult) {
          if (callResult.returnValue === true &&
            typeof callQueue[callId] !== 'undefined') {
            callQueue[callId].status = "available";
            waitAndSendRequest(callId);
          }
        },
        "params"             : [callObj.publicProcedureName],
        "retries"            : 0,
        "destinationDomain"  : callObj.destinationDomain});
      callQueue[callId] = callObj;
      self.setTimeout(function() {
        if (callQueue[callId] && callQueue[callId].status === "pinging") {
          waitAndSendRequest(callId);
        }
      }, callObj.timeout / retries);
    }
  }

  // attach the pmrpc event listener
  function addCrossBrowserEventListerner(obj, eventName, handler, bubble) {
    if ("addEventListener" in obj) {
      // FF
      obj.addEventListener(eventName, handler, bubble);
    } else {
      // IE
      obj.attachEvent("on" + eventName, handler);
    }
  }

  function createHandler(method, source, destinationType) {
    return function(event) {
      var params = {event: event, source: source, destinationType: destinationType};
      method(params);
    };
  }

  if ('window' in this) {
    // window object - window-to-window comm
    var handler = createHandler(processPmrpcMessage, null, "window");
    addCrossBrowserEventListerner(this, "message", handler, false);
  } else if ('onmessage' in this) {
    // dedicated worker - parent X to worker comm
    var handler = createHandler(processPmrpcMessage, this, "worker");
    addCrossBrowserEventListerner(this, "message", handler, false);
  } else if ('onconnect' in this) {
    // shared worker - parent X to shared-worker comm
    var connectHandler = function(e) {
      //this.sendPort = e.ports[0];
      var handler = createHandler(processPmrpcMessage, e.ports[0], "sharedWorker");
      addCrossBrowserEventListerner(e.ports[0], "message", handler, false);
      e.ports[0].start();
    };
    addCrossBrowserEventListerner(this, "connect", connectHandler, false);
  } else {
    throw "Pmrpc must be loaded within a browser window or web worker.";
  }

  // Override Worker and SharedWorker constructors so that pmrpc may relay
  // messages. For each message received from the worker, call pmrpc processing
  // method. This is child worker to parent communication.

  var createDedicatedWorker = this.Worker;
  this.nonPmrpcWorker = createDedicatedWorker;
  var createSharedWorker = this.SharedWorker;
  this.nonPmrpcSharedWorker = createSharedWorker;

  var allWorkers = [];

  this.Worker = function(scriptUri) {
    var newWorker = new createDedicatedWorker(scriptUri);
    allWorkers.push({context: newWorker, type: 'worker'});
    var handler = createHandler(processPmrpcMessage, newWorker, "worker");
    addCrossBrowserEventListerner(newWorker, "message", handler, false);
    return newWorker;
  };

  this.SharedWorker = function(scriptUri, workerName) {
    var newWorker = new createSharedWorker(scriptUri, workerName);
    allWorkers.push({context: newWorker, type: 'sharedWorker'});
    var handler = createHandler(processPmrpcMessage, newWorker.port, "sharedWorker");
    addCrossBrowserEventListerner(newWorker.port, "message", handler, false);
    newWorker.postMessage = function(msg, portArray) {
      return newWorker.port.postMessage(msg, portArray);
    };
    newWorker.port.start();
    return newWorker;
  };

  // function that receives pings for methods and returns responses
  function receivePingRequest(publicProcedureName) {
    return typeof fetchRegisteredService(publicProcedureName) !== "undefined";
  }

  function subscribe(params) {
    return register(params);
  }

  function unsubscribe(params) {
    return unregister(params);
  }

  function findAllWindows() {
    var allWindowContexts = [];

    if (typeof window !== 'undefined') {
      allWindowContexts.push({ context: window.top, type: 'window' });

      // walk through all iframes, starting with window.top
      for (var i = 0; typeof allWindowContexts[i] !== 'undefined'; i++) {
        var currentWindow = allWindowContexts[i];
        for (var j = 0; j < currentWindow.context.frames.length; j++) {
          allWindowContexts.push({
            context: currentWindow.context.frames[j],
            type   : 'window'
          });
        }
      }
    } else {
      allWindowContexts.push({context: this, type: 'workerParent'});
    }

    return allWindowContexts;
  }

  function findAllWorkers() {
    return allWorkers;
  }

  function findAllReachableContexts() {
    var allWindows = findAllWindows();
    var allWorkers = findAllWorkers();
    var allContexts = allWindows.concat(allWorkers);

    return allContexts;
  }

  // register method for receiving and returning pings
  register({
    "publicProcedureName": "receivePingRequest",
    "procedure"          : receivePingRequest});

  function getRegisteredProcedures() {
    var regSvcs = [];
    var origin = typeof this.frames !== "undefined" ? (window.location.protocol + "//" + window.location.host + (window.location.port !== "" ? ":" + window.location.port : "")) : "";
    for (var publicProcedureName in registeredServices) {
      if (publicProcedureName in reservedProcedureNames) {
        continue;
      } else {
        regSvcs.push({
          "publicProcedureName": registeredServices[publicProcedureName].publicProcedureName,
          "acl"                : registeredServices[publicProcedureName].acl,
          "origin"             : origin
        });
      }
    }
    return regSvcs;
  }

  // register method for returning registered procedures
  register({
    "publicProcedureName": "getRegisteredProcedures",
    "procedure"          : getRegisteredProcedures});

  function discover(params) {
    var windowsForDiscovery = null;

    if (typeof params.destination === "undefined") {
      windowsForDiscovery = findAllReachableContexts();
      for (var i = 0; i < windowsForDiscovery.length; i++) {
        windowsForDiscovery[i] = windowsForDiscovery[i].context;
      }
    } else {
      windowsForDiscovery = params.destination;
    }
    var originRegex = typeof params.originRegex === "undefined" ?
      "(.*)" : params.originRegex;
    var nameRegex = typeof params.nameRegex === "undefined" ?
      "(.*)" : params.nameRegex;

    var counter = windowsForDiscovery.length;

    var discoveredMethods = [];

    function addToDiscoveredMethods(methods, destination) {
      for (var i = 0; i < methods.length; i++) {
        if (methods[i].origin.match(new RegExp(originRegex)) &&
          methods[i].publicProcedureName.match(new RegExp(nameRegex))) {
          discoveredMethods.push({
            publicProcedureName: methods[i].publicProcedureName,
            destination        : destination,
            procedureACL       : methods[i].acl,
            destinationOrigin  : methods[i].origin
          });
        }
      }
    }

    pmrpc.call({
      destination        : windowsForDiscovery,
      destinationDomain  : "*",
      publicProcedureName: "getRegisteredProcedures",
      onSuccess          : function(callResult) {
        counter--;
        addToDiscoveredMethods(callResult.returnValue, callResult.destination);
        if (counter === 0) {
          params.callback(discoveredMethods);
        }
      },
      onError            : function(callResult) {
        counter--;
        if (counter === 0) {
          params.callback(discoveredMethods);
        }
      }
    });
  }

  reservedProcedureNames = {"getRegisteredProcedures": null, "receivePingRequest": null};

  // return public methods
  return {
    register  : register,
    unregister: unregister,
    call      : call,
    discover  : discover
  };
}();

//AMD suppport
if (typeof define == 'function' && define.amd) {
  define(pmrpc);
}
},{}],11:[function(require,module,exports){
var process=require("__browserify_process");﻿// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        /* jshint loopfunc: true */

        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    if (domain) {
                        domain.exit();
                    }
                    setTimeout(flush, 0);
                    if (domain) {
                        domain.enter();
                    }

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this does have the nice side-effect of reducing the size
// of the code by reducing x.call() to merely x(), eliminating many
// hard-to-minify characters.
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

function isObject(value) {
    return value === Object(value);
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (isPromise(value)) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = deprecate(function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    }, "valueOf", "inspect");

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become fulfilled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be fulfilled
 */
Q.race = race;
function race(answerPs) {
    return promise(function(resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function(answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = deprecate(function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        });
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return isObject(object) &&
        typeof object.promiseDispatch === "function" &&
        typeof object.inspect === "function";
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var unhandledReasonsDisplayed = false;
var trackUnhandledRejections = true;
function displayUnhandledReasons() {
    if (
        !unhandledReasonsDisplayed &&
        typeof window !== "undefined" &&
        !window.Touch &&
        window.console
    ) {
        console.warn("[Q] Unhandled rejection reasons (should be empty):",
                     unhandledReasons);
    }

    unhandledReasonsDisplayed = true;
}

function logUnhandledReasons() {
    for (var i = 0; i < unhandledReasons.length; i++) {
        var reason = unhandledReasons[i];
        console.warn("Unhandled rejection reason:", reason);
    }
}

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;
    unhandledReasonsDisplayed = false;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;

        // Show unhandled rejection reasons if Node exits without handling an
        // outstanding rejection.  (Note that Browserify presently produces a
        // `process` global without the `EventEmitter` `on` method.)
        if (typeof process !== "undefined" && process.on) {
            process.on("exit", logUnhandledReasons);
        }
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
    displayUnhandledReasons();
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    if (typeof process !== "undefined" && process.on) {
        process.removeListener("exit", logUnhandledReasons);
    }
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;
            try {
                result = generator[verb](arg);
            } catch (exception) {
                return reject(exception);
            }
            if (result.done) {
                return result.value;
            } else {
                return when(result.value, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var countDown = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++countDown;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--countDown === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (countDown === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, message) {
    return Q(object).timeout(ms, message);
};

Promise.prototype.timeout = function (ms, message) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

module.exports = Q;

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

},{"__browserify_process":2}],12:[function(require,module,exports){
﻿var q = require('../../../shared/lib/kriskowal/q.js');
module.exports = ElementDecorator;

/**
 * `Element` decorator class
 * @param {Element} element Browser DOM Element to decorate.
 * @return {ElementDecorator} `this` ElementDecorator instance
 * @constructor
 */
function ElementDecorator(element) {
  var self = this
    , animationQueue = []
    ;
  this.element = element;

  //Delegate select methods directly to `this.element`
  ['remove']
    .forEach(function(functionName) {
      self[functionName] = function() {
        params = Array.prototype.slice.apply(arguments);
        self.element[functionName].apply(self.element, params)
      }
    });

  /**
   * Delegates to setAttrs
   * @param {object} attrs i.e. {id: 'element-id', src: 'http://..'}
   * @return {ElementDecorator} `this` ElementDecorator instance
   */
  this.attr = function(attrs) {
    setAttrs(attrs, this.element);
    return this;
  };
  
  this.attrs = this.attr;

  /**
   * Delegates to setCss or getCss depending on argument type
   * @param {object|array} css i.e. {border: '1px solid red', padding: '10px'}
   * @return {ElementDecorator|object} `this` ElementDecorator instance
   */
  this.css = function(css) {
    if (css instanceof Array) {
      return getComputedCss(css, this.element)
    }
    setCss(css, this.element);
    return this;
  };

  /**
   * Insert/move passed `element` after `this.element` as a sibling
   * @param {Element} element Browser DOM Element
   * @return {ElementDecorator} `this` ElementDecorator instance
   */
//  this.after = function(element) {
//    var element = element instanceof(ElementDecorator)
//        ? element.element
//        : element
//      ;
//    
//  }

  /**
   * Insert `this.element` before passed `target` Element
   *    (or ElementDecorator's element)
   * @param {Element|ElementDecorator} target Element to put `this.element` before
   * @return {ElementDecorator} `this` ElementDecorator instance
   */
  this.insertBefore = function(target) {
    target = target instanceof ElementDecorator
      ? target.element
      : target
    ;
    target.parentNode.insertBefore(this.element, target);
    return this;
  };

  /**
   * Append the passed Element or ElementDecorator to `this.element`
   * @param {Element|ElementDecorator} element HTML DOM Element or
   *    ElementDecorator instance
   * @return {ElementDecorator} `this` ElementDecorator instance
   */
  this.append = function(element) {
    element = element instanceof ElementDecorator
      ? element.element
      : element
    ;
    this.element.appendChild(element);
    return this;
  };

  /**
   * Append the `this.element` to passed Element or ElementDecorator
   * @param {Element|ElementDecorator} element HTML DOM Element or
   *    ElementDecorator instance
   * @return {ElementDecorator} `this` ElementDecorator instance
   */
  this.appendTo = function(element) {
    element = element instanceof ElementDecorator
      ? element.element
      : element
    ;
    element.appendChild(this.element);
    return this;
  };


  this.animate = function(properties, duration) {
    duration = duration || '200ms';
    var lastInQueue = animationQueue[animationQueue.length - 1];

    return lastInQueue
      ? lastInQueue.then(animate)
      : animate()
      ;

    //TODO: make this work with decimal durations!! e.g. `1.15s`
    function animate() {
      var originalTransition = self.element.style.getPropertyValue('transition') || ''
        , transitions = originalTransition.split(', ')
        , deferred = q.defer()
        , promise = deferred.promise
        , durationMatch = duration.match(/(\d+)(m)?s/)
        ;

      animationQueue.push(promise);

      //`transition` property tested and working on:
      //  Chrome 30.0.1599.101
      //  Firefox 24.0
      //  Safari 7.0 (9537.71)
      //  (no need for -moz-transition, etc.)
      Object.keys(properties).forEach(function(property) {
        if (transitions[0] !== '') {
          var included = transitions.some(function(transition) {
            var transitionProperty = transition.split(' ')[0];
            return transitionProperty === property
          });
          if (!included) transitions.push(property + ' ' + duration);
        } else {
          transitions.shift();
          transitions.push(property + ' ' + duration)
        }

      });
//      self.element.style.transition = transitions.join(', ');
      self.css({transition: transitions.join(', ')});
      self.css(properties);

      setTimeout(function() {
//        self.element.style.transition = originalTransition;
        self.css({transition: originalTransition});
        deferred.resolve(true);
        var oldPromise = animationQueue.splice(animationQueue.lastIndexOf(promise), 1)[0];
        if (oldPromise !== promise && !oldPromise.isPending()) {
          throw new Error('promises didn\'t match or oldPromise is still pending!')
        }
      }, durationMatch[2] ? parseInt(durationMatch[1], 10) : (parseInt(durationMatch[1], 10) * 1000));

      return promise;
    }
  };

  /**
   * Set a css transition on opacity (unless it exists already)
   *    with a duration (with measurement i.e. 'ms' or 's') equal
   *    to the argument (or 200ms by default). Then set visibility to
   *    visible and opacity to 1. Wait the duration and finally,
   *    remove the transition (unless it was pre-existing).
   *
   *    NOTE: this does not prevent the element from taking up /
   *    blocking out space.
   * @param {string} duration Duration to put on CSS transition
   */
  this.fadeIn = function(duration) {
//    this.element.style.visibility = 'visible';
    this.css({visibility: 'visible'});
    return this.animate({opacity: 1}, duration)
  };

  /**
   * Set a css transition on opacity (unless it exists already)
   *    with a duration (with measurement i.e. 'ms' or 's') equal
   *    to the argument (or 200ms by default). Then set opacity to 0.
   *    Wait the duration and finally, remove the transition (unless
   *    it was pre-existing) and set visibility to hidden.
   *
   *    NOTE: this does not prevent the element from taking up /
   *    blocking out space.
   * @param {string} duration Duration to put on CSS transition
   */
  this.fadeOut = function(duration) {
    return this.animate({opacity: 0}, duration)
      .then(function() {
//        self.element.style.visibility = 'hidden'
        self.css({visibility: 'hidden'})
      })
  };
}

/**
 * Set element attributes
 * @param {object} attrs i.e. {id: 'element-id', src: 'http://..'}
 */
function setAttrs(attrs, element) {
  Object.keys(attrs).forEach(function(attrName) {
    element[attrName] = attrs[attrName];
  });
}

/**
 * Set element css properties (via style attr)
 * @param {object} css i.e. {border: '1px solid red', padding: '10px'}
 * @param {Element} element HTML DOM Element
 */
function setCss(css, element) {
  Object.keys(css).forEach(function(attrName) {
    element.style.setProperty(attrName, css[attrName]);
  });
}

/**
 * Get computed css property values for the passed property names array
 * @param {array} propertyNames Array of css property names
 * @param {Element} element HTML Dom Element on which the properties
 *   are to be retrieved
 * @return {object} Object of css property names and values
 *   (usable with .css function for setting to the retrieved values)
 */
function getComputedCss(propertyNames, element) {
  var properties = {};
  var computedProperties = window.getComputedStyle(element);

  propertyNames.forEach(function(propertyName) {
//    properties[propertyName] = computedProperties[propertyName] || '';
    properties[propertyName] = computedProperties.getPropertyValue(propertyName);// || '';
  });
  return properties;
}

},{"../../../shared/lib/kriskowal/q.js":11}],13:[function(require,module,exports){
﻿var ElementDecorator = require('./ElementDecorator')
  , filter = require('./filter')
  ;
module.exports = decorate;

/**
 * Factory method for ElementDecorator
 * @param {string|Element} tagNameOrElement Element instance to decorate
 *    or name of HTML tag to create and decorate.
 * @return {ElementDecorator} New ElementDecorator instance
 */
function decorate(tagNameOrElement) {
  var element = tagNameOrElement instanceof(Element)
      ? tagNameOrElement
      : document.createElement(tagNameOrElement)
    ;
  return new ElementDecorator(element);
}

/**
 * Adds the properties of the passed array elements or object to
 * the passed object
 * @param {object|array} extendee object to extend
 * @param {array|object|undefined} extender objects to extend extendee with
 * @return {object} extended object
 */
decorate.extend = function(extendee, extender) {
  if (!extender) {
    extender = extendee;
    extendee = {};
  }

  if (extender instanceof Array) {
    extender.forEach(function(extender) {
      decorate.copy(extendee, extender)
    });
    return extendee
  } else {
    return decorate.copy(extendee, extender)
  }
};

/**
 * If 2 args: Adds properties fo the second object to the first
 *   object and returns the first object.
 * If 1 arg: Adds properties fo the argument object to a new
 *  object and returns that object.
 * @param {object} extendee object to be extended
 * @param {object|undefined} extender object to extend extendee with
 * @return {object} extended object
 */
decorate.copy = function(extendee, extender) {
  if (!extender) {
    extender = extendee;
    extendee = {};
  }

  Object.keys(extender).forEach(function(property) {
    extendee[property] = extender[property]
  });
  return extendee
};

decorate.filter = filter;

},{"./ElementDecorator":12,"./filter":16}],14:[function(require,module,exports){
﻿/**
 * CART BUILDER
 */

var $ = require('./build')
  , pmrpc = require('../../../shared/lib/izuzak/pmrpc')
  , throttle = require('../../../shared/app/services/throttle')
  ;

exports.build = function() {
  function closeCart() {
    resizeCart('CLOSED')
  }

  function openCart() {
    resizeCart('VISIBLE')
  }

  if (Shopbeam.TOP_WINDOW) {
    var mobileThreshold = 768
      , $cart = $('iframe')
        .attr({
          id : 'shopbeam-cart',
          src: Shopbeam.HOST + '/app/cart'
        })
      , layout = function() {
        return window.innerWidth < mobileThreshold ?
          'PHONE' : 'DESKTOP';
      }
      , cssFor = function(state) {
        return Shopbeam['CART_' + state + '_' + layout() + '_CSS']
      }

    //-- initialize cartState to 'HIDDEN'
      , cartState = 'HIDDEN'
      , resizeCart = function(state) {
        pmrpc.call({
          destination        : 'publish',
          publicProcedureName: 'updateCartLayout',
          params             : [layout()]
        });
        
        if (state) cartState = state;
        $cart.css($.extend([cssFor('DEFAULT'), cssFor(cartState)]));
      }
      ;

    window.top.addEventListener('resize', function() {
      throttle(resizeCart)
    });

    Shopbeam.DOCUMENT_BODY.then(function(body) {
      $cart.appendTo(body);

      //-- initial sizing
      resizeCart();
    });

    pmrpc.register({
      publicProcedureName: 'resizeCart',
      procedure          : function() {
        try {
          resizeCart();
        } catch (err) {
          console.error(err);
        }
      }
    })

    pmrpc.register({
      publicProcedureName: 'openCart',
      procedure          : function() {
        try {
          openCart();
        } catch (err) {
          console.error(err);
        }
      }
    });

    pmrpc.register({
      publicProcedureName: 'closeCart',
      procedure          : function(state) {
        try {
          closeCart(state);
        } catch (err) {
          console.error(err);
        }
      }
    });

    pmrpc.register({
      publicProcedureName: 'flashCart',
      procedure          : function() {
        try {
          openCart();
          setTimeout(function() {
            closeCart()
          }, 2000)
        } catch (err) {
          console.error(err);
        }
      }
    });

    pmrpc.register({
      publicProcedureName: 'hideCart',
      procedure          : function() {
        try {
          resizeCart('HIDDEN')
        } catch (err) {
          console.error(err);
        }
      }
    });
  }
};

},{"../../../shared/app/services/throttle":4,"../../../shared/lib/izuzak/pmrpc":10,"./build":13}],15:[function(require,module,exports){
﻿/**
 * CHECKOUT BUILDER
 */

var $ = require('./build')
  , pmrpc = require('../../../shared/lib/izuzak/pmrpc')
  , zoom = require('./zoom')
  ;

exports.build = function() {
  if (Shopbeam.TOP_WINDOW) {
    var $checkout = $('iframe')
        .css($.extend([
          Shopbeam.CHECKOUT_DEFAULT_CSS,
          Shopbeam.CHECKOUT_HIDDEN_CSS
        ]))
        .attr({
          src: Shopbeam.HOST + '/app/checkout/#/review?mode=copper',
          id : 'shopbeam-checkout'
        })
      , $checkoutContainer = $('div')
        .css($.extend([
          Shopbeam.CHECKOUT_BACKDROP_DEFAULT_CSS,
          Shopbeam.CHECKOUT_BACKDROP_HIDDEN_CSS
        ]))
        .attr({id: 'shopbeam-checkout-backdrop'})
      ;

    Shopbeam.DOCUMENT_BODY.then(function(body) {
      $checkout.appendTo(body);
      $checkoutContainer.appendTo(body);
    });
    
    pmrpc.register({
      publicProcedureName: 'openCheckout',
      procedure          : function() {
        try {
          zoom.disable();
          $checkoutContainer.animate(Shopbeam.CHECKOUT_BACKDROP_VISIBLE_CSS, '1150ms');
          $checkout.animate(Shopbeam.CHECKOUT_VISIBLE_CSS, '1s');
        } catch (err) {
          console.error(err);
        }
      }
    });

    pmrpc.register({
      publicProcedureName: 'closeCheckout',
      procedure          : function() {
        try {
          zoom.reset();
          $checkout.animate(Shopbeam.CHECKOUT_HIDDEN_CSS, '1s');
          $checkoutContainer.animate(Shopbeam.CHECKOUT_BACKDROP_HIDDEN_CSS, '1150ms');
        } catch (err) {
          console.error(err);
        }
      }
    });
  }
};
},{"../../../shared/lib/izuzak/pmrpc":10,"./build":13,"./zoom":23}],16:[function(require,module,exports){
﻿module.exports = function filter(name) {
  return {
    unique: uniqueFilter,
    filter: dynamicFilter
  }[name];
};

/**
 * Filter an array by a function or by a map object
 * @param {array} array Array to be filtered
 * @param {function|object} filterBy If a function, it's passed
 *    to Array.prorotype.filter; if an object, elements which have
 *    matching key/value pairs are included in the return array.
 * @return {array} Filtered array
 */
function dynamicFilter(array, filterBy) {
  if (typeof(filterBy) === 'function') {
    return array.filter(filterBy);
  } else if (typeof(filterBy) === 'object') {
    return array.filter(function(element) {
      return Object.keys(filterBy).every(function(key) {
        return element[key] === filterBy[key];
      })
    })
  }
}

function uniqueFilter(array, targetProperty) {
  var result = [];
  array.forEach(function(element) {
    var test = result.some(function(testElement) {
      return testElement[targetProperty] === element[targetProperty];
    });

    if (!test) {
      result.push(element);
    }
  });
  return result;
}
},{}],17:[function(require,module,exports){
﻿/**
 * IMAGE WIDGET CLASS
 */

module.exports = ImageWidget;

var $ = require('./build')
  , q = require('../../../shared/lib/kriskowal/q')
  , Widget = require('./widget')
  ;

function ImageWidget(initialImage) {
  //the id attribute that will be set on the $widget iframe element
  var widgetTagId = initialImage.id.replace(Shopbeam.WIDGET_TAG_ID_EXCLUDE_REGEX, '')
  //the uuid-only of this widget; used for uniqueness between multiple widgets
    , widgetUuid = widgetTagId.match(Shopbeam.WIDGET_UUID_REGEX)[1]
  //products resourece url with query-string params for this particular widget
    , dataUrl
  //hoverAction: describes hover behavior of widget
    , hoverAction
    ;

  if (initialImage.dataset) {
    dataUrl = Shopbeam.HOST + initialImage.dataset.shopbeamUrl;
    hoverAction = initialImage.dataset.shopbeamHoverAction;
  } else {
    dataUrl = Shopbeam.HOST + initialImage.attributes['data-shopbeam-url'].value;
    var hoverAttribute = initialImage.attributes['data-shopbeam-hover-action'];
    if (hoverAttribute) hoverAction = hoverAttribute.value;
  }
  
  this.dataUrl = dataUrl;

  var imageWidth = initialImage.width
    , imageHeight = initialImage.height
    , $initialImage = $(initialImage)

  //copy all computed borders, paddings, and margins from $initialImage to be applied to
  //  the container that will take it's place and "eat" it
    , copiedBorders = $initialImage.css(['border-left', 'border-right', 'border-top', 'border-bottom'])
    , copiedMargins = $initialImage.css(['margin-left', 'margin-right', 'margin-top', 'margin-bottom'])
    , copiedPaddings = $initialImage.css(['padding-left', 'padding-right', 'padding-top', 'padding-bottom'])

  //merge width and height with the copied borders, paddings, and margins
    , copiedCss = $.extend($initialImage.css(['width', 'height', 'float', 'z-index']), [
      copiedBorders, copiedMargins,
      copiedPaddings
    ])

  //create $widgetContainer div, set it's css 
    , $widgetContainer = $('div')
      //inline-block to not force line-break; relative position because of 
      //  absolutely positioned child element(s)
      .css({
        display : 'inline-block',
        position: 'relative'
      })

  //create $widget iframe; set it's css to the default plus $initialImage's width
  //  and height. also set its id attribute
    , $widget = $('iframe')
      .css($.extend([
        Shopbeam.WIDGET_DEFAULT_CSS,
        Shopbeam.WIDGET_HIDDEN_CSS,
        {
          width : imageWidth + 'px',
          height: imageHeight + 'px'
        }
      ])).attr(Shopbeam.WIDGET_ATTRS)
      .attr({id: widgetTagId})

  //create deferred and promise for products resource request.
  //  anything that depends on products data to be loaded will .then on JSONPromise
    , deferredJSON = q.defer()
    , JSONPromise = deferredJSON.promise
    , dataCallback = function() {
      var options = {
          widgetId          : widgetUuid,
          hoverAction       : hoverAction,
          width             : imageWidth,
          productsUrl       : dataUrl,
          initialImageSource: initialImage.src
        },
        data = JSON.parse(this.responseText)
        ;
      deferredJSON.resolve({data: data, options: options});
    }
    ;

  //pre-load products resource JSON
  var request = new XMLHttpRequest();
  request.onload = dataCallback;
  request.open('get', dataUrl, true);
  request.send();


  this.build = function() {
    //Insert $widgetContainer just before the image it will contain and then replace
    $widgetContainer.insertBefore($initialImage);

    //move borders, paddings & margins from $initialImage to $widgetContainer
    //  and move $initialImage & $widget to be children of $widgtContainer.
    //  Also absolutely position $initialImage so when $widget fades in over it, 
    //  they're directly over-top one another (no DOM weirdness or elements bouncing).
    $initialImage.css({border: 'none', padding: 0, margin: 0, position: 'absolute', top: 0, left: 0});
    $widgetContainer.css(copiedCss)
      .append($initialImage)
      .append($widget);

    //after $widget has been added to DOM, we can interact with it's `contentWindow` and `contentDocument`
    //write the widget index markup to $widget's document
    var widgetWindow = $widget.element.contentWindow
      , widgetDocument = widgetWindow.document
      ;

    /**
     * NOTE: .open MUST be called BEFORE assigning any properties on the iframe window.
     *    IE seems to either create a new window after .open is called or delete properties
     *    set on it.
     */
    widgetDocument.open();
    widgetWindow.ShopbeamWidget = this;
    widgetDocument.write(appIndexes.widget(Shopbeam));
    widgetDocument.close();
  };

  /**
   * Fade widget in, over-top of its respective initialImage;
   *    then, when fading is complete, remove $initialImage from the DOM.
   */
  this.render = function() {
    $widget.fadeIn('1s').then($initialImage.remove);
  };

  this.uuid = widgetUuid;
  this.JSONPromise = JSONPromise;

  //Inherit from Widget Class
  Widget.apply(this, arguments);
}

},{"../../../shared/lib/kriskowal/q":11,"./build":13,"./widget":22}],18:[function(require,module,exports){
var process=require("__browserify_process"),global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};(function(e){if("function"==typeof bootstrap)bootstrap("jade",e);else if("object"==typeof ecksports)moduwel.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeJade=e}else"undefined"!=typeof window?window.jade=e():global.jade=e()})(function(){var define,ses,bootstrap,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof rekwire=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/*!
 * Jade - runtime
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Lame Array.isArray() polyfill for now.
 */

if (!Array.isArray) {
  Array.isArray = function(arr){
    return '[object Array]' == Object.prototype.toString.call(arr);
  };
}

/**
 * Lame Object.keys() polyfill for now.
 */

if (!Object.keys) {
  Object.keys = function(obj){
    var arr = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(key);
      }
    }
    return arr;
  }
}

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    a['class'] = ac.concat(bc).filter(nulls);
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {*} val
 * @return {Boolean}
 * @api private
 */

function nulls(val) {
  return val != null && val !== '';
}

/**
 * join array as classes.
 *
 * @param {*} val
 * @return {String}
 * @api private
 */

function joinClasses(val) {
  return Array.isArray(val) ? val.map(joinClasses).filter(nulls).join(' ') : val;
}

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 * @api private
 */

exports.attrs = function attrs(obj, escaped){
  var buf = []
    , terse = obj.terse;

  delete obj.terse;
  var keys = Object.keys(obj)
    , len = keys.length;

  if (len) {
    buf.push('');
    for (var i = 0; i < len; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('boolean' == typeof val || null == val) {
        if (val) {
          terse
            ? buf.push(key)
            : buf.push(key + '="' + key + '"');
        }
      } else if (0 == key.indexOf('data') && 'string' != typeof val) {
        buf.push(key + "='" + JSON.stringify(val) + "'");
      } else if ('class' == key) {
        if (escaped && escaped[key]){
          if (val = exports.escape(joinClasses(val))) {
            buf.push(key + '="' + val + '"');
          }
        } else {
          if (val = joinClasses(val)) {
            buf.push(key + '="' + val + '"');
          }
        }
      } else if (escaped && escaped[key]) {
        buf.push(key + '="' + exports.escape(val) + '"');
      } else {
        buf.push(key + '="' + val + '"');
      }
    }
  }

  return buf.join(' ');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno, str){
  if (!(err instanceof Error)) throw err;
  if ((typeof window != 'undefined' || !filename) && !str) {
    err.message += ' on line ' + lineno;
    throw err;
  }
  try {
    str =  str || require('fs').readFileSync(filename, 'utf8')
  } catch (ex) {
    rethrow(err, null, lineno)
  }
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

},{"fs":2}],2:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}]},{},[1])(1)
});
;(function(){ 
var assets = { 
    assets: {"/js/widget/templates.js":"/js/widget/templates.js","/js/lightbox/templates.js":"/js/lightbox/templates.js","/js/shared/templates.js":"/js/shared/templates.js","/.DS_Store":"/.DS_Store","/crossdomain.xml":"/crossdomain.xml","/css/bootstrap-responsive.css":"/css/bootstrap-responsive.css","/css/bootstrap.css":"/css/bootstrap.css","/css/icomoon.styl":"/css/icomoon.styl","/css/jquery.nouislider.css":"/css/jquery.nouislider.css","/img/ajax-loader2.gif":"/img/ajax-loader2.gif","/img/alex.png":"/img/alex.png","/img/american-express-logo.gif":"/img/american-express-logo.gif","/img/baby_dark.svg":"/img/baby_dark.svg","/img/baby_grey.svg":"/img/baby_grey.svg","/img/bag-grey.png":"/img/bag-grey.png","/img/bag-logo-grey.png":"/img/bag-logo-grey.png","/img/bag-logo-white.png":"/img/bag-logo-white.png","/img/bag-white.png":"/img/bag-white.png","/img/beauty_dark.svg":"/img/beauty_dark.svg","/img/beauty_grey.svg":"/img/beauty_grey.svg","/img/blank.png":"/img/blank.png","/img/boris.png":"/img/boris.png","/img/bryan.png":"/img/bryan.png","/img/cvv-infographic.gif":"/img/cvv-infographic.gif","/img/dan.png":"/img/dan.png","/img/facebook_share.png":"/img/facebook_share.png","/img/fashion_dark.svg":"/img/fashion_dark.svg","/img/fashion_grey.svg":"/img/fashion_grey.svg","/img/favicon.ico":"/img/favicon.ico","/img/filter-bar-closer-button-open.jpg":"/img/filter-bar-closer-button-open.jpg","/img/filter-bar-closer-button.jpg":"/img/filter-bar-closer-button.jpg","/img/footer-social.png":"/img/footer-social.png","/img/georgie.png":"/img/georgie.png","/img/glyphicons-halflings-white.png":"/img/glyphicons-halflings-white.png","/img/glyphicons-halflings.png":"/img/glyphicons-halflings.png","/img/home_dark.svg":"/img/home_dark.svg","/img/home_grey.svg":"/img/home_grey.svg","/img/ico-add.png":"/img/ico-add.png","/img/ico-address.png":"/img/ico-address.png","/img/ico-arrow.png":"/img/ico-arrow.png","/img/ico-book.png":"/img/ico-book.png","/img/ico-call.png":"/img/ico-call.png","/img/ico-cross-white.png":"/img/ico-cross-white.png","/img/ico-email.png":"/img/ico-email.png","/img/ico-gift.png":"/img/ico-gift.png","/img/ico-love.png":"/img/ico-love.png","/img/ico-open-close.png":"/img/ico-open-close.png","/img/ico-tag.png":"/img/ico-tag.png","/img/ico-tick.png":"/img/ico-tick.png","/img/ico-triangle.png":"/img/ico-triangle.png","/img/ipad-frame.png":"/img/ipad-frame.png","/img/jacklyn.png":"/img/jacklyn.png","/img/jak.png":"/img/jak.png","/img/jesse.png":"/img/jesse.png","/img/jimmy.png":"/img/jimmy.png","/img/landing_hero.jpg":"/img/landing_hero.jpg","/img/list-works.png":"/img/list-works.png","/img/loading_more_products.gif":"/img/loading_more_products.gif","/img/logo-black.png":"/img/logo-black.png","/img/logo-white.png":"/img/logo-white.png","/img/mastercard-logo.gif":"/img/mastercard-logo.gif","/img/norton-black.png":"/img/norton-black.png","/img/people-don-draper.jpg":"/img/people-don-draper.jpg","/img/people-lnk-in.png":"/img/people-lnk-in.png","/img/pinterest_share.png":"/img/pinterest_share.png","/img/richard.png":"/img/richard.png","/img/sam.png":"/img/sam.png","/img/search.svg":"/img/search.svg","/img/shopbeam-circles-hires.png":"/img/shopbeam-circles-hires.png","/img/shopbeam-circles.png":"/img/shopbeam-circles.png","/img/shopbeam-logo old.svg":"/img/shopbeam-logo old.svg","/img/shopbeam-logo-black-large.png":"/img/shopbeam-logo-black-large.png","/img/shopbeam-logo-notext.svg":"/img/shopbeam-logo-notext.svg","/img/shopbeam-logo-white.svg":"/img/shopbeam-logo-white.svg","/img/shopbeam-logo.svg":"/img/shopbeam-logo.svg","/img/shopbeam-text-grey.png":"/img/shopbeam-text-grey.png","/img/shopbeam-text-white.png":"/img/shopbeam-text-white.png","/img/slider-hint.png":"/img/slider-hint.png","/img/step-1.png":"/img/step-1.png","/img/step-2.png":"/img/step-2.png","/img/step-3.png":"/img/step-3.png","/img/step-4.png":"/img/step-4.png","/img/steps-arrow-b.png":"/img/steps-arrow-b.png","/img/steps-arrow-bl.png":"/img/steps-arrow-bl.png","/img/steps-arrow-r.png":"/img/steps-arrow-r.png","/img/visa-logo.gif":"/img/visa-logo.gif","/img/visual.jpg":"/img/visual.jpg","/img/zoomin.svg":"/img/zoomin.svg","/swf/.DS_Store":"/swf/.DS_Store-19f0c9c1a53e0994aacdf638c4a5c69a","/css/icomoon/selection.json":"/css/icomoon/selection.json","/css/icomoon/style.css":"/css/icomoon/style.css","/css/fonts/icomoon.dev.svg":"/css/fonts/icomoon.dev.svg","/css/fonts/icomoon.eot":"/css/fonts/icomoon.eot","/css/fonts/icomoon.svg":"/css/fonts/icomoon.svg","/css/fonts/icomoon.ttf":"/css/fonts/icomoon.ttf","/css/fonts/icomoon.woff":"/css/fonts/icomoon.woff","/css/cloudzoom/ajax-loader.gif":"/css/cloudzoom/ajax-loader.gif","/css/cloudzoom/blank.png":"/css/cloudzoom/blank.png","/css/cloudzoom/cloudzoom.css":"/css/cloudzoom/cloudzoom.css","/css/mailer/main.styl":"/css/mailer/main.styl","/css/select2/select2-spinner.gif":"/css/select2/select2-spinner.gif","/css/select2/select2.css":"/css/select2/select2.css","/css/select2/select2.png":"/css/select2/select2.png","/css/select2/select2x2.png":"/css/select2/select2x2.png","/css/silviomoreto/bootstrap-select.css":"/css/silviomoreto/bootstrap-select.css","/swf/swfobject/expressInstall.swf":"/swf/swfobject/expressInstall.swf","/swf/widgets/single-variant.swf":"/swf/widgets/single-variant.swf","/swf/widgets/textLayout_1.0.0.595.swz":"/swf/widgets/textLayout_1.0.0.595.swz","/css/icomoon/fonts/shopbeam-set.ttf":"/css/icomoon/fonts/shopbeam-set.ttf","/css/icomoon/fonts/shopbeam-set.eot":"/css/icomoon/fonts/shopbeam-set.eot","/css/icomoon/fonts/shopbeam-set.woff":"/css/icomoon/fonts/shopbeam-set.woff","/css/icomoon/fonts/shopbeam-set.svg":"/css/icomoon/fonts/shopbeam-set.svg","/css/landing/fancybox/blank.gif":"/css/landing/fancybox/blank.gif","/css/landing/fancybox/fancybox_loading.gif":"/css/landing/fancybox/fancybox_loading.gif","/css/landing/fancybox/fancybox_loading@2x.gif":"/css/landing/fancybox/fancybox_loading@2x.gif","/css/landing/fancybox/fancybox_sprite@2x.png":"/css/landing/fancybox/fancybox_sprite@2x.png","/css/landing/fancybox/fancybox_sprite.png":"/css/landing/fancybox/fancybox_sprite.png","/css/landing/fonts/Read Me.txt":"/css/landing/fonts/Read Me.txt","/css/landing/fancybox/fancybox_overlay.png":"/css/landing/fancybox/fancybox_overlay.png","/css/landing/fonts/icomoon.dev.svg":"/css/landing/fonts/icomoon.dev.svg","/css/landing/fonts/icomoon.eot":"/css/landing/fonts/icomoon.eot","/css/landing/fonts/icomoon.svg":"/css/landing/fonts/icomoon.svg","/css/landing/fonts/icomoon.ttf":"/css/landing/fonts/icomoon.ttf","/css/landing/fonts/icomoon.woff":"/css/landing/fonts/icomoon.woff","/css/landing/fonts/index.html":"/css/landing/fonts/index.html","/js/lib/agrublev/angularLocalStorage.js":"/js/lib/agrublev/angularLocalStorage-43e16e1dd174efbf95592feebc4dfc3d.js","/js/lib/bootstrap/bootstrap.js":"/js/lib/bootstrap/bootstrap-16fe11ea4daa7659babf8c2a5aaa4aee.js","/js/lib/angular/angular-cookies.js":"/js/lib/angular/angular-cookies-65b5ba6c1c58fd057a2f95e0e36aadf2.js","/js/lib/angular/angular-1.2.3-custom.js":"/js/lib/angular/angular-1.2.3-custom-4e6286c418e55b131ea69ddf6bc56c98.js","/js/lib/angular/angular-route.js":"/js/lib/angular/angular-route-7a12c23f1fe259d72c5d41d6e113765a.js","/js/lib/angular/angular-resource.js":"/js/lib/angular/angular-resource-5c7c641761022a2f617624f8076aad99.js","/js/lib/angular/angular.js":"/js/lib/angular/angular-7f9c1063ef071e134e6f4ceb7598e971.js","/js/lib/angular/angular-route.min.js":"/js/lib/angular/angular-route.min-2e2d958188e823f66aaceb9ac10cd3fd.js","/js/lib/angular/angular.min.js":"/js/lib/angular/angular.min-b788c0dd9c353d490ef89437fe7a3aea.js","/js/lib/easyXDM/MIT-license.txt":"/js/lib/easyXDM/MIT-license.txt","/js/lib/easyXDM/easyXDM.Widgets.js":"/js/lib/easyXDM/easyXDM.Widgets-d67fcafd3b5a8c36efcb052cd5874187.js","/js/lib/angular/angular-1.2.3-custom.min.js":"/js/lib/angular/angular-1.2.3-custom.min-27c40974d94c513d341df94af97b5ba1.js","/js/lib/easyXDM/easyXDM.Widgets.debug.js":"/js/lib/easyXDM/easyXDM.Widgets.debug-d67fcafd3b5a8c36efcb052cd5874187.js","/js/lib/easyXDM/easyXDM.Widgets.min.js":"/js/lib/easyXDM/easyXDM.Widgets.min-d56170a6beaa9c1ab37352e33fd0262c.js","/js/lib/easyXDM/easyXDM.debug.js":"/js/lib/easyXDM/easyXDM.debug-4d287409941d1d5af7e62e988a3892d0.js","/js/lib/easyXDM/easyxdm.swf":"/js/lib/easyXDM/easyxdm.swf","/js/lib/easyXDM/easyXDM.min.js":"/js/lib/easyXDM/easyXDM.min-b1480cfd9251062b4f6d5a8adf9f9093.js","/js/lib/easyXDM/easyXDM.js":"/js/lib/easyXDM/easyXDM-e3e0e74fcbdf852253ec18aae4b5f1e7.js","/js/lib/easyXDM/json2.js":"/js/lib/easyXDM/json2-69648dda65c62a0a3e836c10f5826bd6.js","/js/lib/easyXDM/name.html":"/js/lib/easyXDM/name.html","/js/lib/jesseClipboard/copy.swf":"/js/lib/jesseClipboard/copy.swf","/js/lib/select2/select2.js":"/js/lib/select2/select2-c5cbdbcc80b6296b6c34fcd89e7125d2.js","/js/lib/jquery/jquery-1.10.2.js":"/js/lib/jquery/jquery-1.10.2-ed83805d3327f4eb82831c19a0976387.js","/js/lib/jquery/jquery-1.10.2.min.js":"/js/lib/jquery/jquery-1.10.2.min-535451eb37cacaef276d546f8c9409c9.js","/js/lib/jquery/jquery.auto-numeric.js":"/js/lib/jquery/jquery.auto-numeric-25021551a0e7020942eaac73cd262588.js","/js/lib/jquery/jquery.nouislider.js":"/js/lib/jquery/jquery.nouislider-3fe172e986435722fa21e8569ab80d74.js","/js/lib/jquery/jquery.number.js":"/js/lib/jquery/jquery.number-3a971373ca9d25bacbd735ffaebfe9e2.js","/js/lib/shiv/DOMParser.js":"/js/lib/shiv/DOMParser-e2dd275cfb557a8b936de324ded9a1b2.js","/js/lib/shiv/customEvents.js":"/js/lib/shiv/customEvents-8c2cf491ae1a1fb72d92ffe93de94d4c.js","/js/lib/shiv/filter.js":"/js/lib/shiv/filter-fe1ecdaaca8b739dcb924c78202c7c9c.js","/js/lib/shiv/map.js":"/js/lib/shiv/map-1632ad0a04ba3c4d6bb9773a999e04b7.js","/js/lib/shiv/some.js":"/js/lib/shiv/some-d4bfc46e60e0cc056142951bb4ea9ba0.js","/js/lib/shiv/string.js":"/js/lib/shiv/string-eb95eafa7fd86003911df68a9f471ab7.js","/js/lib/silviomoreto/bootstrap-select.js":"/js/lib/silviomoreto/bootstrap-select-753a0c40c7bac4cef85e3914e2d98930.js","/js/lib/zeroclipboard/ZeroClipboard.js":"/js/lib/zeroclipboard/ZeroClipboard-6eeddd3b5d05bae236b04a9010baba95.js","/js/lib/zeroclipboard/ZeroClipboard.swf":"/js/lib/zeroclipboard/ZeroClipboard.swf","/js/lib/easyXDM/tests/easyTest.css":"/js/lib/easyXDM/tests/easyTest.css","/js/lib/easyXDM/tests/index.html":"/js/lib/easyXDM/tests/index.html","/js/lib/easyXDM/tests/easyTest.js":"/js/lib/easyXDM/tests/easyTest-636975a76f625c11bf4cec50c75dfd6e.js","/js/lib/easyXDM/tests/test_namespace.html":"/js/lib/easyXDM/tests/test_namespace.html","/js/lib/easyXDM/tests/test_transport.html":"/js/lib/easyXDM/tests/test_transport.html","/js/lib/easyXDM/tests/test_rpc.html":"/js/lib/easyXDM/tests/test_rpc.html","/js/lib/easyXDM/tests/tests.js":"/js/lib/easyXDM/tests/tests-1dd05788cd61a0d4e75453a3109464dc.js","/js/lib/easyXDM/tests/easyXDM.debug.js":"/js/lib/easyXDM/tests/easyXDM.debug-5c8737adea3da1e082b806514410a338.js","/js/lib/easyXDM/example/blank.html":"/js/lib/easyXDM/example/blank.html","/js/lib/easyXDM/example/bookmark.html":"/js/lib/easyXDM/example/bookmark.html","/js/lib/easyXDM/example/bookmark.js":"/js/lib/easyXDM/example/bookmark-9b7aa752b5e5ba07a321803feecdefd6.js","/js/lib/easyXDM/example/data.html":"/js/lib/easyXDM/example/data.html","/js/lib/easyXDM/example/bridge.html":"/js/lib/easyXDM/example/bridge.html","/js/lib/easyXDM/example/glossary.aspx":"/js/lib/easyXDM/example/glossary.aspx","/js/lib/easyXDM/example/index.html":"/js/lib/easyXDM/example/index.html","/js/lib/easyXDM/example/methods.html":"/js/lib/easyXDM/example/methods.html","/js/lib/easyXDM/example/remote.html":"/js/lib/easyXDM/example/remote.html","/js/lib/easyXDM/example/remoteapp.html":"/js/lib/easyXDM/example/remoteapp.html","/js/lib/easyXDM/example/remotedata.html":"/js/lib/easyXDM/example/remotedata.html","/js/lib/easyXDM/example/remotemethods.html":"/js/lib/easyXDM/example/remotemethods.html","/js/lib/easyXDM/example/remoterpcbackend.html":"/js/lib/easyXDM/example/remoterpcbackend.html","/js/lib/easyXDM/example/remotetransport.html":"/js/lib/easyXDM/example/remotetransport.html","/js/lib/easyXDM/example/resize_iframe.html":"/js/lib/easyXDM/example/resize_iframe.html","/js/lib/easyXDM/example/resize_intermediate.html":"/js/lib/easyXDM/example/resize_intermediate.html","/js/lib/easyXDM/example/resized_iframe_1.html":"/js/lib/easyXDM/example/resized_iframe_1.html","/js/lib/easyXDM/example/resized_iframe_2.html":"/js/lib/easyXDM/example/resized_iframe_2.html","/js/lib/easyXDM/example/transport.html":"/js/lib/easyXDM/example/transport.html","/js/lib/easyXDM/example/upload.html":"/js/lib/easyXDM/example/upload.html","/js/lib/easyXDM/example/upload_handler.aspx":"/js/lib/easyXDM/example/upload_handler.aspx","/js/lib/easyXDM/example/upload_rpc.html":"/js/lib/easyXDM/example/upload_rpc.html","/js/lib/easyXDM/example/widget.html":"/js/lib/easyXDM/example/widget.html","/js/lib/easyXDM/example/widgets.html":"/js/lib/easyXDM/example/widgets.html","/js/lib/easyXDM/example/xhr.html":"/js/lib/easyXDM/example/xhr.html","/js/lib/easyXDM/cors/index.html":"/js/lib/easyXDM/cors/index.html","/js/register.bundle.js":"/js/register.bundle.js","/js/landing.bundle.js":"/js/landing.bundle.js","/js/dashboard.bundle.js":"/js/dashboard.bundle.js","/js/widget.bundle.js":"/js/widget.bundle.js","/js/lightbox.bundle.js":"/js/lightbox.bundle.js","/js/cart.bundle.js":"/js/cart.bundle.js","/js/checkout.bundle.js":"/js/checkout.bundle.js","/css/dashboard.css":"/css/dashboard.css","/css/widget.css":"/css/widget.css","/css/lightbox.css":"/css/lightbox.css","/css/cart.css":"/css/cart.css","/css/checkout.css":"/css/checkout.css","/css/style-guide.css":"/css/style-guide.css","/css/landing.css":"/css/landing.css","/css/register.css":"/css/register.css"},
    url: function (url) {
          return this.assets[url];
        }
};window.appIndexes = {
'cart': function(locals) {
    locals = locals || {};
    locals['assets'] = assets;
    return (function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),HOST = locals_.HOST,assets = locals_.assets;buf.push("<!DOCTYPE html><html lang=\"en\"><head><title>Shopbeam Cart</title><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
if (typeof(HOST) === 'undefined') { HOST = '' }
buf.push("<link" + (jade.attrs({ terse: true, 'rel':("stylesheet"), 'href':("" + (HOST) + "" + (assets.url('/css/cart.css')) + "") }, {"rel":true,"href":true})) + "><!--[if lt IE 10]>");
if (typeof(HOST) === 'undefined') { HOST = '' }
buf.push("<script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/customEvents.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/filter.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/map.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/some.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/string.js")) + '') }, {"src":true})) + "></script><![endif]-->");
if (typeof(HOST) === 'undefined') { HOST = '' }
if ( (process.env.NODE_ENV == 'production'))
{
buf.push("<script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/jquery/jquery-1.10.2.min.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-1.2.3-custom.min.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-route.min.js')) + "") }, {"src":true})) + "></script>");
}
else
{
buf.push("<script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/jquery/jquery-1.10.2.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-1.2.3-custom.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-route.js')) + "") }, {"src":true})) + "></script>");
}
buf.push("</head><body style=\"background: transparent; margin: 0; padding: 0;\" class=\"bootstrap-button-override\"><div ng-controller=\"MainCtrl\" class=\"full-height\"><div class=\"phone\"><button class=\"btn checkout\"><div class=\"bag-container\"><div class=\"icon-bag-outline\"><div class=\"item-count\">{{cart.itemCount}}</div></div></div><h4>View Cart</h4></button></div><div ng-click=\"goToCheckout()\" class=\"desktop\"><div class=\"bag-container z3\"><div class=\"icon-bag-outline\"><div class=\"item-count\">{{cart.itemCount}}</div></div></div><div class=\"z2\"><div class=\"title-bar items-in-cart\"><h3 ng-class=\"{active: cartOpen}\" ng-pluralize count=\"cart.itemCount\" when=\"{'one': 'Item in your cart', 'other': 'Items in your cart'}\"></h3></div></div><div cart-items sidebar recent class=\"cart-items z0 scroll-shadow-outer full-height\"></div><div class=\"z1 vertical-align-middle norton-container\"><div class=\"norton\"><script type=\"text/javascript\" src=\"https://seal.verisign.com/getseal?host_name=www.shopbeam.com&amp;amp;size=XS&amp;amp;use_flash=NO&amp;amp;use_transparent=YES&amp;amp;lang=en\"></script></div><div class=\"tagline-container\"><h4 class=\"uppercase\">shop where you're inspired. </h4><h4>Powered by&nbsp;<span class=\"bold\">Shopbeam</span></h4></div></div><div class=\"title-bar checkout z2\"><button class=\"btn view-bag z0 active\"><h3 class=\"safari-font-weight-override\">Checkout</h3></button></div></div></div><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/cart.bundle.js')) + "") }, {"src":true})) + "></script></body></html>");;return buf.join("");
})(locals)
},'lightbox': function(locals) {
    locals = locals || {};
    locals['assets'] = assets;
    return (function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),HOST = locals_.HOST,assets = locals_.assets;buf.push("<!DOCTYPE html><html lang=\"en\"><head><title>Shopbeam Lightbox</title><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><meta property=\"og:title\" content=\"{{selectedProduct.brandName}} - {{selectedProduct.name}}\"><meta property=\"og:image\" content=\"{{initialImage.url}}\"><meta property=\"og:description\" content=\"{{selectedProduct.description}}\">");
if (typeof(HOST) === 'undefined') { HOST = '' }
buf.push("<link" + (jade.attrs({ terse: true, 'rel':("stylesheet"), 'href':("" + (HOST) + "" + (assets.url('/css/lightbox.css')) + "") }, {"rel":true,"href":true})) + "><!--[if lt IE 10]>");
if (typeof(HOST) === 'undefined') { HOST = '' }
buf.push("<script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/customEvents.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/filter.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/map.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/some.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/string.js")) + '') }, {"src":true})) + "></script><![endif]-->");
if (typeof(HOST) === 'undefined') { HOST = '' }
if ( (process.env.NODE_ENV == 'production'))
{
buf.push("<script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/jquery/jquery-1.10.2.min.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-1.2.3-custom.min.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-route.min.js')) + "") }, {"src":true})) + "></script>");
}
else
{
buf.push("<script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/jquery/jquery-1.10.2.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-1.2.3-custom.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-route.js')) + "") }, {"src":true})) + "></script>");
}
buf.push("</head><body style=\"height: 100%; width: 100%; overflow: hidden; background: transparent; margin: 0; padding: 0;\" class=\"bootstrap-button-override\"><div ng-include=\"&quot;/lightbox/views/main.html&quot;\"></div><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lightbox.bundle.js')) + "") }, {"src":true})) + "></script></body></html>");;return buf.join("");
})(locals)
},'widget': function(locals) {
    locals = locals || {};
    locals['assets'] = assets;
    return (function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),HOST = locals_.HOST,assets = locals_.assets;buf.push("<!DOCTYPE html><html lang=\"en\"><head><title>Shopbeam Widget</title><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><meta property=\"og:title\" content=\"{{selectedProduct.brandName}} - {{selectedProduct.name}}\"><meta property=\"og:image\" content=\"{{initialImage.url}}\"><meta property=\"og:description\" content=\"{{selectedProduct.description}}\">");
if (typeof(HOST) === 'undefined') { HOST = '' }
buf.push("<link" + (jade.attrs({ terse: true, 'rel':("stylesheet"), 'href':("" + (HOST) + "" + (assets.url('/css/widget.css')) + "") }, {"rel":true,"href":true})) + "><!--[if lt IE 10]>");
if (typeof(HOST) === 'undefined') { HOST = '' }
buf.push("<script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/customEvents.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/filter.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/map.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/some.js")) + '') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (HOST) + '' + (assets.url("/js/lib/shiv/string.js")) + '') }, {"src":true})) + "></script><![endif]-->");
if (typeof(HOST) === 'undefined') { HOST = '' }
if ( (process.env.NODE_ENV == 'production'))
{
buf.push("<script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/jquery/jquery-1.10.2.min.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-1.2.3-custom.min.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-route.min.js')) + "") }, {"src":true})) + "></script>");
}
else
{
buf.push("<script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/jquery/jquery-1.10.2.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-1.2.3-custom.js')) + "") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/lib/angular/angular-route.js')) + "") }, {"src":true})) + "></script>");
}
buf.push("</head><body style=\"height: 100%; overflow: hidden; background: transparent; margin: 0; padding: 0;\" class=\"bootstrap-button-override\"><div ng-include=\"&quot;/widget/views/main.html&quot;\"></div><script" + (jade.attrs({ terse: true, 'src':("" + (HOST) + "" + (assets.url('/js/widget.bundle.js')) + "") }, {"src":true})) + "></script></body></html>");;return buf.join("");
})(locals)
}};})();
;

﻿'use strict';

(function(window, undefined) {
  if (!window.Shopbeam) {
    var
    //NOTE: we're using values higher that are allowed by the spec but only because other ppl are too...
      /** @const */ Z_10 = +2147483640,
      /** @const */ Z_9 = +2147483630,
      /** @const */ Z_8 = +2147483620,
      /** @const */ Z_7 = +2147483610,
      /** @const */ Z_6 = +2147483600,
      /** @const */ Z_5 = +2147483590,
      /** @const */ JQUERY_VERSION = '1.10.2'
      ;

    var q = require('../../../shared/lib/kriskowal/q')
      , pmrpc = require('../../../shared/lib/izuzak/pmrpc')
      , $ = require('./build')
      , deferredBody = q.defer()
      , deferredLightboxReady = q.defer()
      , bodyPromise = deferredBody.promise
      , base = {
        transition: 'width 500ms ease, height 500ms ease',
        position  : 'fixed',
        bottom    : 0,
        right     : 0,
        border    : 0,
        margin    : 0,
        padding   : 0,
        'z-index' : Z_7
      }
      ;

    window.Shopbeam = {
      /** @const */ swfOpenLightbox      : function(uuid) {
        pmrpc.call({
          destination        : 'publish',
          publicProcedureName: 'widgetOpenLightbox' + uuid
        });
      },
      /** @const */ JQUERY_VERSION       : JQUERY_VERSION,
      /** @const */ JQUERY_HREF          : '//ajax.googleapis.com/ajax/libs/jquery/' + JQUERY_VERSION + '/jquery.min.js',
      /** @const */ IMAGE_WIDGET_SELECTOR: 'img[id*="shopbeam-widget-image-placeholder"]',
      /** @const */ TEXT_WIDGET_SELECTOR : 'a[id*="shopbeam-widget-text-link"]',
      /** @const */ SWF_IFRAME_SELECTOR  : 'iframe.shopbeam-flash-frame',
      /** @const */ SWF_WIDGET_SELECTOR  : 'object[id*="shopbeam-widget-swf"]',
      /** @const */ HOST                 : 'https://www.shopbeam.com', //document.querySelector('script.shopbeam-script').src.match(/(^.*)\/js\/widget.loader.js$/)[1],
      /** @const */ DOCUMENT_ROOT        : document.querySelector('head') || document.querySelector('body'),
      /** @const */ DOCUMENT_HEAD        : document.querySelector('head'),
      /** @const */ DOCUMENT_BODY        : bodyPromise, //document.querySelector('body'),
      /** @const */ LIGHTBOX_DEFAULT_CSS : {position: 'fixed', top: 0, left: 0, bottom: 0, right: 0, border: 0, margin: 0, padding: 0, width: '100%', height: '100%', 'z-index': Z_8},
      /** @const */ LIGHTBOX_HIDDEN_CSS  : {visibility: 'hidden', opacity: 0, display: 'none'},
      /** @const */ WIDGET_DEFAULT_CSS   : {position: 'absolute', top: 0, left: 0, border: 0, margin: 0, padding: 0},
      /** @const */ WIDGET_HIDDEN_CSS    : {visibility: 'hidden', opacity: 0},

      /** @const */ CART_DEFAULT_PHONE_CSS: base,
      /** @const */ CART_VISIBLE_PHONE_CSS: {height: '40px', width: '100px'},
      /** @const */ CART_HIDDEN_PHONE_CSS : {height: '0px', width: '100px'},
      /** @const */ CART_CLOSED_PHONE_CSS : {height: '40px', width: '100px'},

      /** @const */ CART_DEFAULT_DESKTOP_CSS: base,
      /** @const */ CART_VISIBLE_DESKTOP_CSS: {height: '600px', width: '340px'},
      /** @const */ CART_HIDDEN_DESKTOP_CSS : {height: '50px', width: '0px'},
      /** @const */ CART_CLOSED_DESKTOP_CSS : {height: '50px', width: '180px'},

      /** @const */ CHECKOUT_DEFAULT_CSS         : {position: 'fixed', bottom: 0, left: 0, right: 0, border: 0, margin: 0, padding: 0, 'z-index': Z_10, height: '100%', width: '100%'},
      /** @const */ CHECKOUT_VISIBLE_CSS         : {top: 0, opacity: 1, visibility: 'visible'},//, height: '100px'},
      /** @const */ CHECKOUT_HIDDEN_CSS          : {top: '-100%', opacity: 0, visibility: 'hidden'}, //, height: '100px'},
      /** @const */ CHECKOUT_BACKDROP_DEFAULT_CSS: {'background-color': 'rgb(49, 49, 49)', position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, border: 0, margin: 0, padding: 0, 'z-index': Z_9, height: '100%', width: '100%'},
      /** @const */ CHECKOUT_BACKDROP_VISIBLE_CSS: {opacity: 0.60, visibility: 'visible'},//, height: '100px'},
      /** @const */ CHECKOUT_BACKDROP_HIDDEN_CSS : {opacity: 0, visibility: 'hidden'}, //, height: '100px'},
      /** @const */ WIDGET_ATTRS                 : {allowtransparency: 'true'},
      /** @const */ WIDGET_TAG_ID_EXCLUDE_REGEX  : /(?:-placeholder|-link|-unbootstrapped)/,
      /** @const */ WIDGET_UUID_REGEX            : /shopbeam-widget-(?:image-|text-|swf-)(.+)$/,
      /** @const */ WIDGET_HASH_REGEX            : /shopbeam-open-widget-(.+)$/,
      /** @const */ CLOUDINARY_BASE_URL          : 'https://cloudinary-a.akamaihd.net/shopbeam/image/fetch/',
      /** @const */ TOP_WINDOW                   : window === window.top,

      /** @const */ lightboxReadyPromise: deferredLightboxReady.promise,
    };

    require('../../../shared/app/services/topWindowService');

    var ImageWidget = require('./imageWidget')
      , TextWidget = require('./textWidget')
      , SwfWidget = require('./swfWidget')
      , lightbox = require('./lightbox')
      , cart = require('./cart')
      , checkout = require('./checkout')
      , imagesLoaded = require('../../../shared/lib/desandro/imagesloaded')
      , domready = require('../../../shared/lib/cms/domready')
      , widgetQueue = {}

    //global (window) functions
      , encodeURIComponent = window.encodeURIComponent
      , _forEach = Array.prototype.forEach
      ;

    /**
     * CREATE LIGHTBOX
     */
    lightbox.build();


    /**
     * CREATE WIDGETS AND KICK-OFF BOOTSRTAPPING
     */
    var checkForBody = function() {
        var body = document.querySelector('body');
        if (body instanceof Element) {
          clearInterval(bodyReadyIntervalId);
          deferredBody.resolve(body);
        }
      }

      , bootstrapWidgets = function() {
        //all images with an id beginning with 'shopbeam-widget-image-'
        var imageWidgets = document.querySelectorAll(Shopbeam.IMAGE_WIDGET_SELECTOR)
          , textWidgets = document.querySelectorAll(Shopbeam.TEXT_WIDGET_SELECTOR)
          , swfWidgets = document.querySelectorAll(Shopbeam.SWF_WIDGET_SELECTOR)
          ;

        queueWidgets(imageWidgets, function(queueObj, widget) {
          imagesLoaded(widget).on('done', function(instance) {
            queueObj.queued = true;

            var widgetInstance = new ImageWidget(instance.images[0].img);
            widgetInstance.build();
          })
        });

        queueWidgets(textWidgets, function(queueObj, widget) {
          queueObj.queued = true;
          new TextWidget(widget)
        });

        queueWidgets(swfWidgets, function(queueObj, widget) {
          queueObj.queued = true;
          new SwfWidget(widget)
        });

        function queueWidgets(widgets, fn) {
          _forEach.call(widgets, function(widget) {
            if (!widgetQueue[widget.id]) {
              var queueObj = widgetQueue[widget.id] = {
                widget: widget, queued: false
              };
              fn(queueObj, widget);
            }
          });
        }
      };

    var domReadyIntervalId = setInterval(bootstrapWidgets, 250)
      , bodyReadyIntervalId = setInterval(checkForBody, 250);

    domready(function() {
      bootstrapWidgets();
      clearInterval(domReadyIntervalId);
    });

    /**
     * CREATE CART
     */
    cart.build();

    /**
     * CREATE CHECKOUT
     */
    checkout.build();


    pmrpc.register({
      publicProcedureName: 'lightboxReady',
      procedure          : function() {
        try {
          setTimeout(function() {
            deferredLightboxReady.resolve();
          })
        } catch (err) {
          console.error(err);
        }
      }
    })

  }
})(window);
},{"../../../shared/app/services/topWindowService":5,"../../../shared/lib/cms/domready":6,"../../../shared/lib/desandro/imagesloaded":9,"../../../shared/lib/izuzak/pmrpc":10,"../../../shared/lib/kriskowal/q":11,"./build":13,"./cart":14,"./checkout":15,"./imageWidget":17,"./lightbox":19,"./swfWidget":20,"./textWidget":21,"__browserify_process":2,"fs":1}],19:[function(require,module,exports){
﻿/**
 * LIGHTBOX BUILDER
 */

var $ = require('./build')
  , pmrpc = require('../../../shared/lib/izuzak/pmrpc')
  , zoom = require('./zoom')
  ;

exports.build = function() {
  if (Shopbeam.TOP_WINDOW) {
    var $lightbox = $('iframe')
        .css(
          Shopbeam.LIGHTBOX_DEFAULT_CSS
        )//.attr({})
      , $lightboxContainer = $('div')
        .css($.extend([
          Shopbeam.LIGHTBOX_DEFAULT_CSS,
          Shopbeam.LIGHTBOX_HIDDEN_CSS
        ]))
        .attr({id: 'shopbeam-lightbox'})
        .append($lightbox)
      , lightboxDocument
      ;

    Shopbeam.DOCUMENT_BODY.then(function(body) {
      $lightboxContainer.appendTo(body);
      lightboxDocument = $lightbox.element.contentWindow.document;

      lightboxDocument.open();
      lightboxDocument.write(appIndexes.lightbox(Shopbeam));
      lightboxDocument.close();
    });


    pmrpc.register({
      publicProcedureName: 'showLightbox',
      procedure          : function() {
        try {
          zoom.disable();
          $lightboxContainer
            .css({display: 'block'});

          setTimeout(function() {
            $lightboxContainer.fadeIn('500ms')
          }, 100)
        } catch (err) {
          console.error(err);
        }
      }
    });

    pmrpc.register({
      publicProcedureName: 'hideLightbox',
      procedure          : function() {
        try {
          zoom.reset();
          $lightboxContainer.fadeOut('500ms')
            .then(function() {
              $lightboxContainer.css({display: 'none'})
            });
        } catch (err) {
          console.error(err);
        }
      }
    });
  }
};

},{"../../../shared/lib/izuzak/pmrpc":10,"./build":13,"./zoom":23}],20:[function(require,module,exports){
/**
 * SWF WIDGET CLASS
 */

module.exports = SwfWidget;

var $ = require('./build')
  , q = require('../../../shared/lib/kriskowal/q')
  , pmrpc = require('../../../shared/lib/izuzak/pmrpc')
  , topWindowService = require('../../../shared/app/services/topWindowService')
  , analyticsService = require('../../../shared/app/services/analyticsService')
  , Widget = require('./widget')
//  , swfobject = require('../../../shared/lib/swfobject/swfobject')
  ;

function SwfWidget(object) {
  var self = this
  //the id attribute that will be set on the $widget iframe element
    , widgetTagId = object.id.replace(Shopbeam.WIDGET_TAG_ID_EXCLUDE_REGEX, '')
  //the uuid-only of this widget; used for uniqueness between multiple widgets
    , widgetUuid = widgetTagId.match(Shopbeam.WIDGET_UUID_REGEX)[1]
  //products resourece url with query-string params for this particular widget
    , dataUrl
    , dataImageSrc
    ;

  if (object.dataset) {
    dataUrl = Shopbeam.HOST + object.dataset.shopbeamUrl;
    dataImageSrc = object.dataset.imageSrc;
  } else {
    dataUrl = Shopbeam.HOST + object.attributes['data-shopbeam-url'].value
    dataImageSrc = object.attributes['imageSrc'].value;
  }

  this.dataUrl = dataUrl;

  //create deferred and promise for products resource request.
  //  anything that depends on products data to be loaded will .then on JSONPromise
  var deferredJSON = q.defer()
    , JSONPromise = deferredJSON.promise
    , dataCallback = function() {
      var options = {
          widgetId          : widgetUuid,
          productsUrl       : dataUrl,
          initialImageSource: dataImageSrc
        },
        data = JSON.parse(this.responseText);
      deferredJSON.resolve({data: data, options: options});
    }
    ;

  $(object).attr({id: widgetTagId});

  //pre-load products resource JSON
  var request = new XMLHttpRequest();
  request.onload = dataCallback;
  request.open('get', dataUrl, true);
  request.send();

  this.uuid = widgetUuid;
  this.JSONPromise = JSONPromise;

  var openLightbox = function() {
    JSONPromise.then(self.buildConfig(function(config) {
      if (!config.outOfStock) {
        pmrpc.call({
          destination        : 'publish',
          publicProcedureName: 'openLightbox',
          params             : [config, self]
        })
      }
    }))
  };

  pmrpc.register({
    publicProcedureName: 'widgetOpenLightbox' + String(this.uuid),
    procedure          : function() {
      try {
        openLightbox();
      } catch (err) {
        console.error(err);
      }
    }
  });

  //Inherit from Widget Class
  Widget.apply(this, arguments);

  //`#buildConfig` is defined by super so this must follow `Widget.apply(...)`
//  swfobject.registerObject(widgetTagId, "11.8", "/swf/swfobject/expressInstall.swf", function() {
  JSONPromise.then(self.buildConfig(function(config) {
    //TODO: figure out if we really need this or not vvvv
    var swf;

    swf = object;
//      if (/IE/.test(window.navigator.userAgent)) {
//        //TODO: actually look at this in IE: may not be this element, may instead be a child embed or something!
//        swf = object;
//      } else {
//        swf = object.querySelector('object[data*=".swf"]');
//      }
    try {
      swf.setWidgetData(JSON.stringify(config));
    } catch (err) {
      console.warn('non-zero exit from swf.setWidgetData!!');
    }
  }));
//  });
}

},{"../../../shared/app/services/analyticsService":3,"../../../shared/app/services/topWindowService":5,"../../../shared/lib/izuzak/pmrpc":10,"../../../shared/lib/kriskowal/q":11,"./build":13,"./widget":22}],21:[function(require,module,exports){
﻿/**
 * TEXT WIDGET CLASS
 */

module.exports = TextWidget;

var $ = require('./build')
  , q = require('../../../shared/lib/kriskowal/q')
  , pmrpc = require('../../../shared/lib/izuzak/pmrpc')
  , topWindowService = require('../../../shared/app/services/topWindowService')
  , analyticsService = require('../../../shared/app/services/analyticsService')
  , Widget = require('./widget')
  ;

function TextWidget(link) {
  var self = this
  //the id attribute that will be set on the $widget iframe element
    , widgetTagId = link.id.replace(Shopbeam.WIDGET_TAG_ID_EXCLUDE_REGEX, '')
  //the uuid-only of this widget; used for uniqueness between multiple widgets
    , widgetUuid = widgetTagId.match(Shopbeam.WIDGET_UUID_REGEX)[1]
  //products resourece url with query-string params for this particular widget
    , dataUrl
    ;

  if (link.dataset) {
    dataUrl = Shopbeam.HOST + link.dataset.shopbeamUrl
  } else {
    dataUrl = Shopbeam.HOST + link.attributes['data-shopbeam-url'].value
  }
  
  this.dataUrl = dataUrl;

  //create deferred and promise for products resource request.
  //  anything that depends on products data to be loaded will .then on JSONPromise
  var deferredJSON = q.defer()
    , JSONPromise = deferredJSON.promise
    , dataCallback = function() {
      var options = {
          widgetId   : widgetUuid,
          productsUrl: dataUrl
        },
        data = JSON.parse(this.responseText);
      deferredJSON.resolve({data: data, options: options});
    }
    ;

  $(link).attr({id: widgetTagId});

  //pre-load products resource JSON
  var request = new XMLHttpRequest();
  request.onload = dataCallback;
  request.open('get', dataUrl, true);
  request.send();

  this.uuid = widgetUuid;
  this.JSONPromise = JSONPromise;

  pmrpc.register({
    publicProcedureName: 'widgetOpenLightbox' + String(this.uuid),
    procedure          : function() {
      try {
        JSONPromise.then(self.buildConfig(function(config) {
          pmrpc.call({
            destination        : 'publish',
            publicProcedureName: 'openLightbox',
            params             : [config, self]
          })
        }))
      } catch (err) {
        console.error(err);
      }
    }
  });

  //Inherit from Widget Class
  Widget.apply(this, arguments);

  //`#buildConfig` is defined by super so this must follow `Widget.apply(...)`
  JSONPromise.then(this.buildConfig(function(config) {
    link.addEventListener('mouseover', function(event) {
      var data = {
        action      : 'text-widget-mouseover',
        widgetUuid  : self.uuid,
        apiKey      : self.apiKey,
        dataUrl     : self.dataUrl
      };
      
      analyticsService.post(data);
    });
    
    link.addEventListener('click', function(event) {
      event.preventDefault();
      if (!config.outOfStock) {
        topWindowService.hash('shopbeam-open-widget-' + widgetUuid);
        pmrpc.call({
          destination        : 'publish',
          publicProcedureName: 'openLightbox',
          params             : [config, self]
        })
      }
    })
  }));
}

},{"../../../shared/app/services/analyticsService":3,"../../../shared/app/services/topWindowService":5,"../../../shared/lib/izuzak/pmrpc":10,"../../../shared/lib/kriskowal/q":11,"./build":13,"./widget":22}],22:[function(require,module,exports){
﻿/**
 * WIDGET CLASS
 */

module.exports = Widget;

var $ = require('./build')
  , pmrpc = require('../../../shared/lib/izuzak/pmrpc')
  , topWindowService = require('../../../shared/app/services/topWindowService')
  , analyticsService = require('../../../shared/app/services/analyticsService')
  ;

function Widget() {

  var self = this;
  var routeParams = mapParams(self.dataUrl);

  //NOTE: old embeds use `apikey` instead of `apiKey` - this is for backwards compatibility!
  routeParams.apiKey = routeParams.apiKey || routeParams.apikey;

  this.apiKey = routeParams.apiKey;

  var data = {
    action    : 'widget-load',
    widgetUuid: self.uuid,
    apiKey    : self.apiKey,
    dataUrl   : self.dataUrl
  };

  analyticsService.post(data);

  this.openLightbox = function(uuid) {
    pmrpc.call({
      destination        : 'publish',
      publicProcedureName: 'widgetOpenLightbox' + String(uuid)
    })
  };

  topWindowService.hash().then(function(hash) {
    if (hash && hash.match(Shopbeam.WIDGET_HASH_REGEX)[1] === self.uuid) {
      Shopbeam.lightboxReadyPromise.then(function() {
        self.openLightbox(self.uuid);
      })
    }
  });

  this.buildConfig = function(widgetConfigCallback) {
    /**
     *
     * @param {object} resolution Object passed to `deferredJSON.resolve`
     *    i.e. {data: <xhr response data>, options: <options as defined in `dataCallback`>}
     */
    return function(resolution) {
      try {
        var data = resolution.data
          , options = resolution.options
          ;

        if (routeParams.google_conversion_id) {
          options.remarketing = {
            conversionId: routeParams.google_conversion_id,
            campaign    : routeParams.campaign
          }
        }

        //Get an angular-$routeParams-like object - map of query-strings and their values
        var imageSource = options.initialImageSource
          , initialProduct = data[0]
          , initialVariant
          , initialImageObj
          , embedImage
          , colors
          ;

        //Make sure there's at least one product
        if (initialProduct) {
          //If the embedded variant is in stock, set it to initialVariant,
          //  otherwise, use the first in-stock variant.
          initialVariant = initialProduct.variants.filter(function(variant) {
            return variant.id === window.parseInt(routeParams.id, 10)
          })[0] || initialProduct.variants[0];

          //initialImageObj example:
          //  {id: <image-id>, url: '<image-url>'}
          initialImageObj = initialVariant.images[(routeParams.image - 1) || 0];

          //Colors example:
          /**
           * [
           *   {
           *     name    : '<unique-color-name-1>',
           *     imageUrl: '<first-variant-image-of-color-url>',
           *     variants: [
           *       {<variant>}[, ...]
           *     ]
           *   }[, ...]
           * ]
           */
          colors = $.filter('unique')(initialProduct.variants, 'color').map(function(variant) {
            var uniquelyColoredVariants = $.filter('filter')(initialProduct.variants, {color: variant.color});
            return {name: variant.color, imageUrl: variant.images[0].url, variants: uniquelyColoredVariants};
          })
        } else {
          //The array of products is empty. This either means that the product is out of
          //  stock or it does not exist; we assume it's out of stock.
          //The following sets up some safe values to be passed into the widget so it shows
          //  as out of stock and doesn't have any errors
          initialProduct = {
            brandName: 'Currently Out of Stock',
            name     : '(all colors & sizes)'
          };
          initialImageObj = {};
          if (imageSource) initialImageObj.url = imageSource;
        }
        embedImage = {url: imageSource};

        //Call widget app's callback, passing config object into angular app
        widgetConfigCallback({
          outOfStock    : !data[0],
          initialProduct: initialProduct,
          initialVariant: initialVariant,
          initialImage  : initialImageObj,
          embedImage    : embedImage,
          colors        : colors,
          apiKey        : routeParams.apikey || routeParams.apiKey,
          options       : options
        })
      } catch (err) {
        console.log('error while building widget config: ', err);
      }
    }
  }
}

/**
 * Turn a resource url's query string params into a map object
 * @param {string} queryString The url/url-part which contains the query string
 * @return {object} Given: `/v1/products?id=1234&image=4&apikey=blah`,
 *    returns: `{id: 1234, image: 4, apikey: 'blah'}`
 */
function mapParams(queryString) {
  queryString = queryString.split('?')[1];
  var pairs = queryString.split('&')
    , params = {};

  pairs.forEach(function(pair) {
    pair = pair.split('=');
    params[pair[0]] = pair[1];
  });

  return params;
}

},{"../../../shared/app/services/analyticsService":3,"../../../shared/app/services/topWindowService":5,"../../../shared/lib/izuzak/pmrpc":10,"./build":13}],23:[function(require,module,exports){
﻿/*
 * PREVENT ZOOMING ON MOBILE
 */


(function() {
  //-- IE10 POLYFILL
  if (!Element.prototype.remove) {
    Element.prototype.remove = function() {
      this.parentElement.removeChild(this);
    };
  }
  //-- END POLYFILL


  var build = require('./build')
    , backdropStyle = "@media(max-width: 640px) {" +
      ".mobileCheckoutBackdrop {" +
      "position: absolute; top: -100%; left: -100%; height: 300%; width: 300%; background-color: white;" +
      "}" +
      "}"
    , backdropStyleTag = build('style').attr({type: 'text/css'}).element
    , noZoomMetaTag = build('meta').attr({name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no'}).element
    , mobileCheckoutBackdrop = build('div').element
    , originalMetaTag
    ;

  backdropStyleTag.innerText = backdropStyle;
  Shopbeam.DOCUMENT_HEAD.appendChild(backdropStyleTag);
  mobileCheckoutBackdrop.classList.add('mobileCheckoutBackdrop');

  module.exports = {

    reset: function() {
      noZoomMetaTag.remove();
      mobileCheckoutBackdrop.remove();
      if (originalMetaTag) {
        Shopbeam.DOCUMENT_HEAD.appendChild(originalMetaTag);
      }
    },

    disable: function() {
      originalMetaTag = document.querySelector('meta[name="viewport"]');
      if (originalMetaTag) {
        originalMetaTag.remove();
      }
      Shopbeam.DOCUMENT_HEAD.appendChild(noZoomMetaTag);
      Shopbeam.DOCUMENT_BODY.then(function(body) {
        body.appendChild(mobileCheckoutBackdrop)
      })
    }
  };
}());

},{"./build":13}]},{},[18])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYndoaXRlL1Byb2plY3RzL3Nwb2NrL25vZGVfbW9kdWxlcy9hc3NldC1yYWNrL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vZnMuanMiLCIvVXNlcnMvYndoaXRlL1Byb2plY3RzL3Nwb2NrL25vZGVfbW9kdWxlcy9hc3NldC1yYWNrL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9id2hpdGUvUHJvamVjdHMvc3BvY2svc2hhcmVkL2FwcC9zZXJ2aWNlcy9hbmFseXRpY3NTZXJ2aWNlLmpzIiwiL1VzZXJzL2J3aGl0ZS9Qcm9qZWN0cy9zcG9jay9zaGFyZWQvYXBwL3NlcnZpY2VzL3Rocm90dGxlLmpzIiwiL1VzZXJzL2J3aGl0ZS9Qcm9qZWN0cy9zcG9jay9zaGFyZWQvYXBwL3NlcnZpY2VzL3RvcFdpbmRvd1NlcnZpY2UuanMiLCIvVXNlcnMvYndoaXRlL1Byb2plY3RzL3Nwb2NrL3NoYXJlZC9saWIvY21zL2RvbXJlYWR5LmpzIiwiL1VzZXJzL2J3aGl0ZS9Qcm9qZWN0cy9zcG9jay9zaGFyZWQvbGliL2Rlc2FuZHJvL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9id2hpdGUvUHJvamVjdHMvc3BvY2svc2hhcmVkL2xpYi9kZXNhbmRyby9ldmVudGllLmpzIiwiL1VzZXJzL2J3aGl0ZS9Qcm9qZWN0cy9zcG9jay9zaGFyZWQvbGliL2Rlc2FuZHJvL2ltYWdlc2xvYWRlZC5qcyIsIi9Vc2Vycy9id2hpdGUvUHJvamVjdHMvc3BvY2svc2hhcmVkL2xpYi9penV6YWsvcG1ycGMuanMiLCIvVXNlcnMvYndoaXRlL1Byb2plY3RzL3Nwb2NrL3NoYXJlZC9saWIva3Jpc2tvd2FsL3EuanMiLCIvVXNlcnMvYndoaXRlL1Byb2plY3RzL3Nwb2NrL3dpZGdldC9hcHAvbG9hZGVyL0VsZW1lbnREZWNvcmF0b3IuanMiLCIvVXNlcnMvYndoaXRlL1Byb2plY3RzL3Nwb2NrL3dpZGdldC9hcHAvbG9hZGVyL2J1aWxkLmpzIiwiL1VzZXJzL2J3aGl0ZS9Qcm9qZWN0cy9zcG9jay93aWRnZXQvYXBwL2xvYWRlci9jYXJ0LmpzIiwiL1VzZXJzL2J3aGl0ZS9Qcm9qZWN0cy9zcG9jay93aWRnZXQvYXBwL2xvYWRlci9jaGVja291dC5qcyIsIi9Vc2Vycy9id2hpdGUvUHJvamVjdHMvc3BvY2svd2lkZ2V0L2FwcC9sb2FkZXIvZmlsdGVyLmpzIiwiL1VzZXJzL2J3aGl0ZS9Qcm9qZWN0cy9zcG9jay93aWRnZXQvYXBwL2xvYWRlci9pbWFnZVdpZGdldC5qcyIsIi9Vc2Vycy9id2hpdGUvUHJvamVjdHMvc3BvY2svd2lkZ2V0L2FwcC9sb2FkZXIvaW5kZXguanMiLCIvVXNlcnMvYndoaXRlL1Byb2plY3RzL3Nwb2NrL3dpZGdldC9hcHAvbG9hZGVyL2xpZ2h0Ym94LmpzIiwiL1VzZXJzL2J3aGl0ZS9Qcm9qZWN0cy9zcG9jay93aWRnZXQvYXBwL2xvYWRlci9zd2ZXaWRnZXQuanMiLCIvVXNlcnMvYndoaXRlL1Byb2plY3RzL3Nwb2NrL3dpZGdldC9hcHAvbG9hZGVyL3RleHRXaWRnZXQuanMiLCIvVXNlcnMvYndoaXRlL1Byb2plY3RzL3Nwb2NrL3dpZGdldC9hcHAvbG9hZGVyL3dpZGdldC5qcyIsIi9Vc2Vycy9id2hpdGUvUHJvamVjdHMvc3BvY2svd2lkZ2V0L2FwcC9sb2FkZXIvem9vbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqc0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeHhEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gbm90IGltcGxlbWVudGVkXG4vLyBUaGUgcmVhc29uIGZvciBoYXZpbmcgYW4gZW1wdHkgZmlsZSBhbmQgbm90IHRocm93aW5nIGlzIHRvIGFsbG93XG4vLyB1bnRyYWRpdGlvbmFsIGltcGxlbWVudGF0aW9uIG9mIHRoaXMgbW9kdWxlLlxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwi77u/KGZ1bmN0aW9uKCkge1xuICB2YXIgdG9wV2luZG93U2VydmljZSA9IHJlcXVpcmUoJy4vdG9wV2luZG93U2VydmljZScpXG4gICAgLCBkZWZlcnJlZENvbmZpZyA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICB0b3BXaW5kb3dTZXJ2aWNlLndpbmRvdygpLnRoZW4oZnVuY3Rpb24odG9wV2luZG93KSB7XG4gICAgICAgICAgY2FsbGJhY2soe1xuICAgICAgICAgICAgdXJsICAgICAgICAgOiB0b3BXaW5kb3cuU2hvcGJlYW0uSE9TVCArICcvdjEvYW5hbHl0aWNzJyxcbiAgICAgICAgICAgIHB1Ymxpc2hlclVybDogdG9wV2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgICB0b3BEb2N1bWVudCA6IHRvcFdpbmRvdy5kb2N1bWVudFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICApXG4gICAgICA7XG4gICAgfTtcblxuICB0cnkge1xuICAgIGFuZ3VsYXIubW9kdWxlKCdzaG9wYmVhbVNoYXJlZCcpLnNlcnZpY2UoJ2FuYWx5dGljc1NlcnZpY2UnLCBbXG4gICAgICAnJGh0dHAnLFxuICAgICAgZnVuY3Rpb24oJGh0dHApIHtcbiAgICAgICAgdGhpcy5wb3N0ID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGRlZmVycmVkQ29uZmlnKGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICAgICAgJGh0dHAucG9zdChjb25maWcudXJsLCBhbmd1bGFyLmV4dGVuZCh7XG4gICAgICAgICAgICAgIHB1Ymxpc2hlclVybDogY29uZmlnLnB1Ymxpc2hlclVybCxcbiAgICAgICAgICAgICAgcmVmZXJyZXIgICAgOiBjb25maWcudG9wRG9jdW1lbnQucmVmZXJyZXJcbiAgICAgICAgICAgIH0sIGRhdGEpKTtcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgXSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybignZXJyb3IgY2F1Z2h0IHdoaWxlIHRyeWluZyB0byByZWdpc3RlciBhbmd1bGFyIGNvbXBvbmVudDogJywgZXJyKTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgcG9zdDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkZWZlcnJlZENvbmZpZyhmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgIFxuICAgICAgICAgIGRhdGEucmVmZXJyZXIgPSBjb25maWcudG9wRG9jdW1lbnQucmVmZXJyZXI7XG4gICAgICAgICAgZGF0YS5wdWJsaXNoZXJVcmwgPSBjb25maWcucHVibGlzaGVyVXJsO1xuICAgICAgICAgIFxuICAgICAgICAgIHJlcXVlc3Qub3BlbigncG9zdCcsIGNvbmZpZy51cmwsIHRydWUpO1xuICAgICAgICAgIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOCcpO1xuICAgICAgICAgIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24sIHRleHQvcGxhaW4sICovKicpO1xuICAgICAgICAgIHJlcXVlc3Quc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfTtcbiAgfVxufSgpKTtcbiIsIu+7vyhmdW5jdGlvbigpIHtcbiAgdmFyIHRocm90dGxlID0gZnVuY3Rpb24oZm4sIHRocmVzaGhvbGQsIHNjb3BlKSB7XG4gICAgdGhyZXNoaG9sZCB8fCAodGhyZXNoaG9sZCA9IDI1MCk7XG4gICAgdmFyIGxhc3QsXG4gICAgICBkZWZlclRpbWVyO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjb250ZXh0ID0gc2NvcGUgfHwgdGhpcztcblxuICAgICAgdmFyIG5vdyA9ICtuZXcgRGF0ZSxcbiAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChsYXN0ICYmIG5vdyA8IGxhc3QgKyB0aHJlc2hob2xkKSB7XG4gICAgICAgIC8vIGhvbGQgb24gdG8gaXRcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlZmVyVGltZXIpO1xuICAgICAgICBkZWZlclRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBsYXN0ID0gbm93O1xuICAgICAgICAgIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICB9LCB0aHJlc2hob2xkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxhc3QgPSBub3c7XG4gICAgICAgIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgdHJ5IHtcbiAgICBhbmd1bGFyLm1vZHVsZSgnc2hvcGJlYW1TaGFyZWQnKS52YWx1ZSgndGhyb3R0bGUnLCB0aHJvdHRsZSlcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS53YXJuKCdlcnJvciBjYXVnaHQgd2hpbGUgdHJ5aW5nIHRvIHJlZ2lzdGVyIGFuZ3VsYXIgY29tcG9uZW50OiAnLCBlcnIpXG4gIH1cblxuICBtb2R1bGUuZXhwb3J0cyA9IHRocm90dGxlXG59KCkpO1xuIiwi77u/KGZ1bmN0aW9uKHNlcnZpY2UpIHtcblxuICB2YXIgcG1ycGMgPSByZXF1aXJlKCcuLi8uLi9saWIvaXp1emFrL3BtcnBjJylcbiAgICAsIHEgPSByZXF1aXJlKCcuLi8uLi9saWIva3Jpc2tvd2FsL3EnKVxuLy8gICAgLCAkID0gcmVxdWlyZSgnLi4vLi4vLi4vd2lkZ2V0L2FwcC9sb2FkZXIvYnVpbGQnKVxuICAgICwgdGVzdCA9IHdpbmRvdy50b3AubG9jYXRpb25cbiAgICAsIGlzVG9wV2luZG93XG4gICAgLCBjcm9zc0RvbWFpblxuICAgIDtcblxuICBjcm9zc0RvbWFpbiA9ICh0eXBlb2YgdGVzdCAhPSBcIm9iamVjdFwiICYmIHRlc3QuaHJlZik7XG4gIHRyeSB7XG4gICAgdGVzdC5ocmVmO1xuICAgIGNyb3NzRG9tYWluID0gZmFsc2U7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNyb3NzRG9tYWluID0gdHJ1ZTtcbiAgfVxuXG4gIGlmICghY3Jvc3NEb21haW4pIHtcbiAgICBzZXJ2aWNlLmhhc2ggPSBmdW5jdGlvbihoYXNoKSB7XG4gICAgICByZXR1cm4gZGVmZXJyZWRGYWN0b3J5KGZ1bmN0aW9uKGRlZmVycmVkKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoaGFzaCAhPT0gbnVsbCAmJiBoYXNoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChoYXNoICE9PSAnJykgaGFzaCA9ICcjJyArIGhhc2g7XG4gICAgICAgICAgICB3aW5kb3cudG9wLmhpc3RvcnkucmVwbGFjZVN0YXRlKG51bGwsICcnLFxuICAgICAgICAgICAgICAgIHdpbmRvdy50b3AubG9jYXRpb24uaHJlZlxuICAgICAgICAgICAgICAgICAgLnJlcGxhY2Uod2luZG93LnRvcC5sb2NhdGlvbi5oYXNoLCAnJykgKyBoYXNoXG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh3aW5kb3cudG9wLmxvY2F0aW9uLmhhc2gpO1xuICAgICAgICB9XG4gICAgICB9LCB0cnVlKVxuICAgIH07XG5cbiAgICBzZXJ2aWNlLmhyZWYgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkZWZlcnJlZEZhY3RvcnkoZnVuY3Rpb24oZGVmZXJyZWQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUod2luZG93LnRvcC5sb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgfVxuICAgICAgfSwgdHJ1ZSlcbiAgICB9O1xuXG4gICAgc2VydmljZS5sb2NhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGRlZmVycmVkRmFjdG9yeShmdW5jdGlvbihkZWZlcnJlZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGtleXMgPSBbJ2hhc2gnLCAnaHJlZicsICdob3N0JywgJ2hvc3RuYW1lJywgJ29yaWdpbicsICdwYXRobmFtZScsICdwb3J0JywgJ3Byb3RvY29sJ11cbiAgICAgICAgICAgICwgbG9jYXRpb25EYXRhID0ge307XG5cbiAgICAgICAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBsb2NhdGlvbkRhdGFba2V5XSA9IHdpbmRvdy50b3AubG9jYXRpb25ba2V5XVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShsb2NhdGlvbkRhdGEpO1xuICAgICAgICB9XG4gICAgICB9LCB0cnVlKVxuICAgIH07XG5cbiAgICBzZXJ2aWNlLmRvY3VtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZGVmZXJyZWRGYWN0b3J5KGZ1bmN0aW9uKGRlZmVycmVkKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHdpbmRvdy50b3AuZG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgICB9LCB0cnVlKVxuICAgIH07XG5cbiAgICBzZXJ2aWNlLndpbmRvdyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGRlZmVycmVkRmFjdG9yeShmdW5jdGlvbihkZWZlcnJlZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh3aW5kb3cudG9wKTtcbiAgICAgICAgfVxuICAgICAgfSwgdHJ1ZSlcbiAgICB9O1xuXG5cbiAgfSBlbHNlIHtcbiAgICAvL1RPRE86IENST1NTIERPTUFJTiBOT1QgV09SS0lORyBZRVQgTE9PSyBBVCBUT0RPIEJFTE9XISEhXG4gICAgc2VydmljZS5oYXNoID0gZnVuY3Rpb24oaGFzaCkge1xuICAgICAgcmV0dXJuIGRlZmVycmVkRmFjdG9yeShmdW5jdGlvbihkZWZlcnJlZCkge1xuICAgICAgICBwbXJwYy5jYWxsKHtcbiAgICAgICAgICBkZXN0aW5hdGlvbiAgICAgICAgOiAncHVibGlzaCcsXG4gICAgICAgICAgcHVibGljUHJvY2VkdXJlTmFtZTogJ2hhc2gnLFxuICAgICAgICAgIHBhcmFtcyAgICAgICAgICAgICA6IFtoYXNoXSxcbiAgICAgICAgICBvblN1Y2Nlc3MgICAgICAgICAgOiBmdW5jdGlvbihyZXR1cm5PYmopIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmV0dXJuT2JqLnJldHVyblZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH07XG5cbiAgICBzZXJ2aWNlLmxvY2F0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZGVmZXJyZWRGYWN0b3J5KGZ1bmN0aW9uKGRlZmVycmVkKSB7XG4gICAgICAgIHBtcnBjLmNhbGwoe1xuICAgICAgICAgIGRlc3RpbmF0aW9uICAgICAgICA6ICdwdWJsaXNoJyxcbiAgICAgICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnbG9jYXRpb24nLFxuICAgICAgICAgIG9uU3VjY2VzcyAgICAgICAgICA6IGZ1bmN0aW9uKHJldHVybk9iaikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXR1cm5PYmoucmV0dXJuVmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfTtcblxuICAgIHNlcnZpY2UuaHJlZiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGRlZmVycmVkRmFjdG9yeShmdW5jdGlvbihkZWZlcnJlZCkge1xuICAgICAgICBwbXJwYy5jYWxsKHtcbiAgICAgICAgICBkZXN0aW5hdGlvbiAgICAgICAgOiAncHVibGlzaCcsXG4gICAgICAgICAgcHVibGljUHJvY2VkdXJlTmFtZTogJ2hyZWYnLFxuICAgICAgICAgIG9uU3VjY2VzcyAgICAgICAgICA6IGZ1bmN0aW9uKHJldHVybk9iaikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXR1cm5PYmoucmV0dXJuVmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfTtcblxuICAgIHNlcnZpY2Uud2luZG93ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZGVmZXJyZWRGYWN0b3J5KGZ1bmN0aW9uKGRlZmVycmVkKSB7XG4gICAgICAgIHBtcnBjLmNhbGwoe1xuICAgICAgICAgIGRlc3RpbmF0aW9uICAgICAgICA6ICdwdWJsaXNoJyxcbiAgICAgICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnd2luZG93JyxcbiAgICAgICAgICBvblN1Y2Nlc3MgICAgICAgICAgOiBmdW5jdGlvbihyZXR1cm5PYmopIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmV0dXJuT2JqLnJldHVyblZhbHVlKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuXG4vLyAgICBzZXJ2aWNlLmRvY3VtZW50ID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgIHJldHVybiBkZWZlcnJlZEZhY3RvcnkoZnVuY3Rpb24oZGVmZXJyZWQpIHtcbi8vICAgICAgICBwbXJwYy5jYWxsKHtcbi8vICAgICAgICAgIGRlc3RpbmF0aW9uICAgICAgICA6ICdwdWJsaXNoJyxcbi8vICAgICAgICAgIHB1YmxpY1Byb2NlZHVyZU5hbWU6ICdkb2N1bWVudCcsXG4vLyAgICAgICAgICBvblN1Y2Nlc3MgICAgICAgICAgOiBmdW5jdGlvbihyZXR1cm5PYmopIHtcbi8vICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXR1cm5PYmoucmV0dXJuVmFsdWUpO1xuLy8gICAgICAgICAgfVxuLy8gICAgICAgIH0pXG4vLyAgICAgIH0pXG4vLyAgICB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhbmd1bGFyLm1vZHVsZSgnc2hvcGJlYW1TaGFyZWQnKS5zZXJ2aWNlKCd0b3BXaW5kb3dTZXJ2aWNlJywgW1xuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuZ3VsYXIuY29weShzZXJ2aWNlLCB0aGlzKTtcbiAgICAgIH1cbiAgICBdKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy9wcm9iYWJseSBlaXRoZXIgbm8gYW5ndWxhciBvciBubyBcInNob3BiZWFtU2hhcmVkXCIgbW9kdWxlIC0gaXQncyBrIVxuICAgIGNvbnNvbGUud2FybignZXJyb3IgY2F1Z2h0IHdoaWxlIHRyeWluZyB0byByZWdpc3RlciBhbmd1bGFyIGNvbXBvbmVudDogJywgZXJyKVxuICB9XG5cblxuICAvL09ubHkgcmVnaXN0ZXIgcnBjIGZ1bmN0aW9ucyBpZiB5b3UncmUgdGhlIHRvcCB3aW5kb3dcbiAgaWYgKHdpbmRvdyA9PT0gd2luZG93LnRvcCkge1xuICAgIHBtcnBjLnJlZ2lzdGVyKHtcbiAgICAgIHB1YmxpY1Byb2NlZHVyZU5hbWU6ICdoYXNoJyxcbiAgICAgIHByb2NlZHVyZSAgICAgICAgICA6IGZ1bmN0aW9uKGhhc2gpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gc2VydmljZS5oYXNoKGhhc2gpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFRPRE86IG1ha2UgdGhlIHJlc3Qgb2YgdGhlc2UgYXN5bmMgdXNpbmcgYGxvY2F0aW9uYCBhcyBhIG1vZGVsXG4gICAgcG1ycGMucmVnaXN0ZXIoe1xuICAgICAgcHVibGljUHJvY2VkdXJlTmFtZTogJ2xvY2F0aW9uJyxcbiAgICAgIGlzQXN5bmNocm9ub3VzICAgICA6IHRydWUsXG4gICAgICBwcm9jZWR1cmUgICAgICAgICAgOiBmdW5jdGlvbihvblN1Y2Nlc3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzZXJ2aWNlLmxvY2F0aW9uKCkudGhlbihmdW5jdGlvbihsb2NhdGlvbikge1xuICAgICAgICAgICAgb25TdWNjZXNzKGxvY2F0aW9uKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBwbXJwYy5yZWdpc3Rlcih7XG4gICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnd2luZG93JyxcbiAgICAgIHByb2NlZHVyZSAgICAgICAgICA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuLy8gICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKFt3aW5kb3csIHt0b3A6IG51bGwsIHdpbmRvdzogbnVsbH1dKTtcbiAgICAgICAgICAvL1RPRE86IHdyaXRlIG15IG93biBQb3N0TWVzc2FnZSBSUEMgbGlicmFyeSBhbmQgZ2V0IHJpZCBvZiB0aGlzIHVzZWxlc3MgcG1ycGMgc2hpdCFcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZG9jdW1lbnQ6IHtcbiAgICAgICAgICAgICAgcmVmZXJyZXI6IHdpbmRvdy5kb2N1bWVudC5yZWZlcnJlclxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiB3aW5kb3cubG9jYXRpb24sXG4gICAgICAgICAgICBTaG9wYmVhbToge1xuICAgICAgICAgICAgICBIT1NUOiB3aW5kb3cuU2hvcGJlYW0uSE9TVFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4vLyAgICAgICAgICByZXR1cm4gc2VydmljZS53aW5kb3coKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmVycmVkRmFjdG9yeShmbiwgc2hvdWxkU2V0VGltZW91dCkge1xuICAgIHZhciBkZWZlcnJlZCA9IHEuZGVmZXIoKTtcbiAgICBpZiAoc2hvdWxkU2V0VGltZW91dCkge1xuICAgICAgc2V0VGltZW91dChmbihkZWZlcnJlZCksIDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbihkZWZlcnJlZCk7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICB9XG59KGV4cG9ydHMpKTtcblxuIiwi77u/LyohXG4gKiBBZGFwdGF0aW9uIG9mIHRoZSAkKGRvY3VtZW50KS5yZWFkeSgpIGZ1bmN0aW9uIGZyb20galF1ZXJ5XG4gKiBsaWJyYXJ5IGZvciB1c2UgaW4gc2ltcGxlIEphdmFTY3JpcHQgc2NlbmFyaW9zLlxuICpcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBcbiAqIGpRdWVyeSBKYXZhU2NyaXB0IExpYnJhcnkgdjEuNC4zXG4gKiBodHRwOi8vanF1ZXJ5LmNvbS8gXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEwIEpvaG4gUmVzaWcsIGh0dHA6Ly9qcXVlcnkuY29tL1xuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuICogYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gKiBTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gKiB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4gKiBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuICogdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gKiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORFxuICogTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRVxuICogTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTlxuICogT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4gKiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqL1xuXG52YXIgdzNjID0gISFkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyLFxuICBsb2FkZWQgPSBmYWxzZSxcbiAgdG9wbGV2ZWwgPSBmYWxzZSxcbiAgZm5zID0gW107XG5cbmlmICh3M2MpIHtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgY29udGVudExvYWRlZCwgdHJ1ZSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCByZWFkeSwgZmFsc2UpO1xufVxuZWxzZSB7XG4gIGRvY3VtZW50LmF0dGFjaEV2ZW50KFwib25yZWFkeXN0YXRlY2hhbmdlXCIsIGNvbnRlbnRMb2FkZWQpO1xuICB3aW5kb3cuYXR0YWNoRXZlbnQoXCJvbmxvYWRcIiwgcmVhZHkpO1xuXG4gIHRyeSB7XG4gICAgdG9wbGV2ZWwgPSB3aW5kb3cuZnJhbWVFbGVtZW50ID09PSBudWxsO1xuICB9IGNhdGNoIChlKSB7XG4gIH1cbiAgaWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kb1Njcm9sbCAmJiB0b3BsZXZlbCkge1xuICAgIHNjcm9sbENoZWNrKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29udGVudExvYWRlZCgpIHtcbiAgKHczYykgP1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGNvbnRlbnRMb2FkZWQsIHRydWUpIDpcbiAgICBkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIgJiZcbiAgICAgIGRvY3VtZW50LmRldGFjaEV2ZW50KFwib25yZWFkeXN0YXRlY2hhbmdlXCIsIGNvbnRlbnRMb2FkZWQpO1xuICByZWFkeSgpO1xufVxuXG4vLyBJZiBJRSBpcyB1c2VkLCB1c2UgdGhlIHRyaWNrIGJ5IERpZWdvIFBlcmluaVxuLy8gaHR0cDovL2phdmFzY3JpcHQubndib3guY29tL0lFQ29udGVudExvYWRlZC9cbmZ1bmN0aW9uIHNjcm9sbENoZWNrKCkge1xuICBpZiAobG9hZGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZG9TY3JvbGwoXCJsZWZ0XCIpO1xuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgd2luZG93LnNldFRpbWVvdXQoYXJndW1lbnRzLmNhbGxlZSwgMTUpO1xuICAgIHJldHVybjtcbiAgfVxuICByZWFkeSgpO1xufVxuXG5mdW5jdGlvbiByZWFkeSgpIHtcbiAgaWYgKGxvYWRlZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBsb2FkZWQgPSB0cnVlO1xuXG4gIHZhciBsZW4gPSBmbnMubGVuZ3RoLFxuICAgIGkgPSAwO1xuXG4gIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBmbnNbaV0uY2FsbChkb2N1bWVudCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihmbikge1xuICAvLyBpZiB0aGUgRE9NIGlzIGFscmVhZHkgcmVhZHksXG4gIC8vIGV4ZWN1dGUgdGhlIGZ1bmN0aW9uXG4gIHJldHVybiAobG9hZGVkKSA/XG4gICAgZm4uY2FsbChkb2N1bWVudCkgOlxuICAgIGZucy5wdXNoKGZuKTtcbn07XG4iLCLvu78vKiFcbiAqIEV2ZW50RW1pdHRlciB2NC4yLjMgLSBnaXQuaW8vZWVcbiAqIE9saXZlciBDYWxkd2VsbFxuICogTUlUIGxpY2Vuc2VcbiAqIEBwcmVzZXJ2ZVxuICovXG5cbihmdW5jdGlvbiAoKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvKipcblx0ICogQ2xhc3MgZm9yIG1hbmFnaW5nIGV2ZW50cy5cblx0ICogQ2FuIGJlIGV4dGVuZGVkIHRvIHByb3ZpZGUgZXZlbnQgZnVuY3Rpb25hbGl0eSBpbiBvdGhlciBjbGFzc2VzLlxuXHQgKlxuXHQgKiBAY2xhc3MgRXZlbnRFbWl0dGVyIE1hbmFnZXMgZXZlbnQgcmVnaXN0ZXJpbmcgYW5kIGVtaXR0aW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge31cblxuXHQvLyBTaG9ydGN1dHMgdG8gaW1wcm92ZSBzcGVlZCBhbmQgc2l6ZVxuXG5cdC8vIEVhc3kgYWNjZXNzIHRvIHRoZSBwcm90b3R5cGVcblx0dmFyIHByb3RvID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZTtcblxuXHQvKipcblx0ICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGV2ZW50IGluIGl0J3Mgc3RvcmFnZSBhcnJheS5cblx0ICpcblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBsaXN0ZW5lcnMgQXJyYXkgb2YgbGlzdGVuZXJzIHRvIHNlYXJjaCB0aHJvdWdoLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gbG9vayBmb3IuXG5cdCAqIEByZXR1cm4ge051bWJlcn0gSW5kZXggb2YgdGhlIHNwZWNpZmllZCBsaXN0ZW5lciwgLTEgaWYgbm90IGZvdW5kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVycywgbGlzdGVuZXIpIHtcblx0XHR2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0aWYgKGxpc3RlbmVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFsaWFzIGEgbWV0aG9kIHdoaWxlIGtlZXBpbmcgdGhlIGNvbnRleHQgY29ycmVjdCwgdG8gYWxsb3cgZm9yIG92ZXJ3cml0aW5nIG9mIHRhcmdldCBtZXRob2QuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSB0YXJnZXQgbWV0aG9kLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGFsaWFzZWQgbWV0aG9kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWxpYXMobmFtZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiBhbGlhc0Nsb3N1cmUoKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1tuYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdpbGwgaW5pdGlhbGlzZSB0aGUgZXZlbnQgb2JqZWN0IGFuZCBsaXN0ZW5lciBhcnJheXMgaWYgcmVxdWlyZWQuXG5cdCAqIFdpbGwgcmV0dXJuIGFuIG9iamVjdCBpZiB5b3UgdXNlIGEgcmVnZXggc2VhcmNoLiBUaGUgb2JqZWN0IGNvbnRhaW5zIGtleXMgZm9yIGVhY2ggbWF0Y2hlZCBldmVudC4gU28gL2JhW3J6XS8gbWlnaHQgcmV0dXJuIGFuIG9iamVjdCBjb250YWluaW5nIGJhciBhbmQgYmF6LiBCdXQgb25seSBpZiB5b3UgaGF2ZSBlaXRoZXIgZGVmaW5lZCB0aGVtIHdpdGggZGVmaW5lRXZlbnQgb3IgYWRkZWQgc29tZSBsaXN0ZW5lcnMgdG8gdGhlbS5cblx0ICogRWFjaCBwcm9wZXJ0eSBpbiB0aGUgb2JqZWN0IHJlc3BvbnNlIGlzIGFuIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXXxPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIHRoZSBldmVudC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldExpc3RlbmVycyhldnQpIHtcblx0XHR2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZXR1cm4gYSBjb25jYXRlbmF0ZWQgYXJyYXkgb2YgYWxsIG1hdGNoaW5nIGV2ZW50cyBpZlxuXHRcdC8vIHRoZSBzZWxlY3RvciBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRyZXNwb25zZVtrZXldID0gZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXNwb25zZSA9IGV2ZW50c1tldnRdIHx8IChldmVudHNbZXZ0XSA9IFtdKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH07XG5cblx0LyoqXG5cdCAqIFRha2VzIGEgbGlzdCBvZiBsaXN0ZW5lciBvYmplY3RzIGFuZCBmbGF0dGVucyBpdCBpbnRvIGEgbGlzdCBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0W119IGxpc3RlbmVycyBSYXcgbGlzdGVuZXIgb2JqZWN0cy5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXX0gSnVzdCB0aGUgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKi9cblx0cHJvdG8uZmxhdHRlbkxpc3RlbmVycyA9IGZ1bmN0aW9uIGZsYXR0ZW5MaXN0ZW5lcnMobGlzdGVuZXJzKSB7XG5cdFx0dmFyIGZsYXRMaXN0ZW5lcnMgPSBbXTtcblx0XHR2YXIgaTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGZsYXRMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmbGF0TGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSByZXF1ZXN0ZWQgbGlzdGVuZXJzIHZpYSBnZXRMaXN0ZW5lcnMgYnV0IHdpbGwgYWx3YXlzIHJldHVybiB0aGUgcmVzdWx0cyBpbnNpZGUgYW4gb2JqZWN0LiBUaGlzIGlzIG1haW5seSBmb3IgaW50ZXJuYWwgdXNlIGJ1dCBvdGhlcnMgbWF5IGZpbmQgaXQgdXNlZnVsLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIGFuIGV2ZW50IGluIGFuIG9iamVjdC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVyc0FzT2JqZWN0ID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0aWYgKGxpc3RlbmVycyBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRyZXNwb25zZSA9IHt9O1xuXHRcdFx0cmVzcG9uc2VbZXZ0XSA9IGxpc3RlbmVycztcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2UgfHwgbGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBZGRzIGEgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogVGhlIGxpc3RlbmVyIHdpbGwgbm90IGJlIGFkZGVkIGlmIGl0IGlzIGEgZHVwbGljYXRlLlxuXHQgKiBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGl0IGlzIGNhbGxlZC5cblx0ICogSWYgeW91IHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUgdGhlbiB0aGUgbGlzdGVuZXIgd2lsbCBiZSBhZGRlZCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVySXNXcmFwcGVkID0gdHlwZW9mIGxpc3RlbmVyID09PSAnb2JqZWN0Jztcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkgJiYgaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcikgPT09IC0xKSB7XG5cdFx0XHRcdGxpc3RlbmVyc1trZXldLnB1c2gobGlzdGVuZXJJc1dyYXBwZWQgPyBsaXN0ZW5lciA6IHtcblx0XHRcdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRcdFx0b25jZTogZmFsc2Vcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZExpc3RlbmVyXG5cdCAqL1xuXHRwcm90by5vbiA9IGFsaWFzKCdhZGRMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBTZW1pLWFsaWFzIG9mIGFkZExpc3RlbmVyLiBJdCB3aWxsIGFkZCBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZVxuXHQgKiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgYWZ0ZXIgaXQncyBmaXJzdCBleGVjdXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZE9uY2VMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZ0LCB7XG5cdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRvbmNlOiB0cnVlXG5cdFx0fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZE9uY2VMaXN0ZW5lci5cblx0ICovXG5cdHByb3RvLm9uY2UgPSBhbGlhcygnYWRkT25jZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIERlZmluZXMgYW4gZXZlbnQgbmFtZS4gVGhpcyBpcyByZXF1aXJlZCBpZiB5b3Ugd2FudCB0byB1c2UgYSByZWdleCB0byBhZGQgYSBsaXN0ZW5lciB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gSWYgeW91IGRvbid0IGRvIHRoaXMgdGhlbiBob3cgZG8geW91IGV4cGVjdCBpdCB0byBrbm93IHdoYXQgZXZlbnQgdG8gYWRkIHRvPyBTaG91bGQgaXQganVzdCBhZGQgdG8gZXZlcnkgcG9zc2libGUgbWF0Y2ggZm9yIGEgcmVnZXg/IE5vLiBUaGF0IGlzIHNjYXJ5IGFuZCBiYWQuXG5cdCAqIFlvdSBuZWVkIHRvIHRlbGwgaXQgd2hhdCBldmVudCBuYW1lcyBzaG91bGQgYmUgbWF0Y2hlZCBieSBhIHJlZ2V4LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGNyZWF0ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudCA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50KGV2dCkge1xuXHRcdHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFVzZXMgZGVmaW5lRXZlbnQgdG8gZGVmaW5lIG11bHRpcGxlIGV2ZW50cy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmdbXX0gZXZ0cyBBbiBhcnJheSBvZiBldmVudCBuYW1lcyB0byBkZWZpbmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZGVmaW5lRXZlbnRzID0gZnVuY3Rpb24gZGVmaW5lRXZlbnRzKGV2dHMpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGV2dHMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHRoaXMuZGVmaW5lRXZlbnQoZXZ0c1tpXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGEgbGlzdGVuZXIgZnVuY3Rpb24gZnJvbSB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBXaGVuIHBhc3NlZCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSwgaXQgd2lsbCByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgaW5kZXg7XG5cdFx0dmFyIGtleTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGluZGV4ID0gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcik7XG5cblx0XHRcdFx0aWYgKGluZGV4ICE9PSAtMSkge1xuXHRcdFx0XHRcdGxpc3RlbmVyc1trZXldLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgcmVtb3ZlTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9mZiA9IGFsaWFzKCdyZW1vdmVMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBBZGRzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy4gWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBhZGQgdGhlIGFycmF5IG9mIGxpc3RlbmVycyB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqIFllYWgsIHRoaXMgZnVuY3Rpb24gZG9lcyBxdWl0ZSBhIGJpdC4gVGhhdCdzIHByb2JhYmx5IGEgYmFkIHRoaW5nLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXJzID0gZnVuY3Rpb24gYWRkTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKGZhbHNlLCBldnQsIGxpc3RlbmVycyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSByZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVycyBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byByZW1vdmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKHRydWUsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogRWRpdHMgbGlzdGVuZXJzIGluIGJ1bGsuIFRoZSBhZGRMaXN0ZW5lcnMgYW5kIHJlbW92ZUxpc3RlbmVycyBtZXRob2RzIGJvdGggdXNlIHRoaXMgdG8gZG8gdGhlaXIgam9iLiBZb3Ugc2hvdWxkIHJlYWxseSB1c2UgdGhvc2UgaW5zdGVhZCwgdGhpcyBpcyBhIGxpdHRsZSBsb3dlciBsZXZlbC5cblx0ICogVGhlIGZpcnN0IGFyZ3VtZW50IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQgKHRydWUpIG9yIGFkZGVkIChmYWxzZSkuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC9yZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYW5pcHVsYXRlIHRoZSBsaXN0ZW5lcnMgb2YgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IHJlbW92ZSBUcnVlIGlmIHlvdSB3YW50IHRvIHJlbW92ZSBsaXN0ZW5lcnMsIGZhbHNlIGlmIHlvdSB3YW50IHRvIGFkZC5cblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkL3JlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5tYW5pcHVsYXRlTGlzdGVuZXJzID0gZnVuY3Rpb24gbWFuaXB1bGF0ZUxpc3RlbmVycyhyZW1vdmUsIGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIHZhbHVlO1xuXHRcdHZhciBzaW5nbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVyIDogdGhpcy5hZGRMaXN0ZW5lcjtcblx0XHR2YXIgbXVsdGlwbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVycyA6IHRoaXMuYWRkTGlzdGVuZXJzO1xuXG5cdFx0Ly8gSWYgZXZ0IGlzIGFuIG9iamVjdCB0aGVuIHBhc3MgZWFjaCBvZiBpdCdzIHByb3BlcnRpZXMgdG8gdGhpcyBtZXRob2Rcblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcgJiYgIShldnQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG5cdFx0XHRmb3IgKGkgaW4gZXZ0KSB7XG5cdFx0XHRcdGlmIChldnQuaGFzT3duUHJvcGVydHkoaSkgJiYgKHZhbHVlID0gZXZ0W2ldKSkge1xuXHRcdFx0XHRcdC8vIFBhc3MgdGhlIHNpbmdsZSBsaXN0ZW5lciBzdHJhaWdodCB0aHJvdWdoIHRvIHRoZSBzaW5ndWxhciBtZXRob2Rcblx0XHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRzaW5nbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gT3RoZXJ3aXNlIHBhc3MgYmFjayB0byB0aGUgbXVsdGlwbGUgZnVuY3Rpb25cblx0XHRcdFx0XHRcdG11bHRpcGxlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFNvIGV2dCBtdXN0IGJlIGEgc3RyaW5nXG5cdFx0XHQvLyBBbmQgbGlzdGVuZXJzIG11c3QgYmUgYW4gYXJyYXkgb2YgbGlzdGVuZXJzXG5cdFx0XHQvLyBMb29wIG92ZXIgaXQgYW5kIHBhc3MgZWFjaCBvbmUgdG8gdGhlIG11bHRpcGxlIG1ldGhvZFxuXHRcdFx0aSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGV2dCwgbGlzdGVuZXJzW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGZyb20gYSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIElmIHlvdSBkbyBub3Qgc3BlY2lmeSBhbiBldmVudCB0aGVuIGFsbCBsaXN0ZW5lcnMgd2lsbCBiZSByZW1vdmVkLlxuXHQgKiBUaGF0IG1lYW5zIGV2ZXJ5IGV2ZW50IHdpbGwgYmUgZW1wdGllZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWdleCB0byByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IFtldnRdIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci4gV2lsbCByZW1vdmUgZnJvbSBldmVyeSBldmVudCBpZiBub3QgcGFzc2VkLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZXZ0KSB7XG5cdFx0dmFyIHR5cGUgPSB0eXBlb2YgZXZ0O1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gUmVtb3ZlIGRpZmZlcmVudCB0aGluZ3MgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiBldnRcblx0XHRpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50XG5cdFx0XHRkZWxldGUgZXZlbnRzW2V2dF07XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGV2ZW50cyBtYXRjaGluZyB0aGUgcmVnZXguXG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRkZWxldGUgZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBpbiBhbGwgZXZlbnRzXG5cdFx0XHRkZWxldGUgdGhpcy5fZXZlbnRzO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBFbWl0cyBhbiBldmVudCBvZiB5b3VyIGNob2ljZS5cblx0ICogV2hlbiBlbWl0dGVkLCBldmVyeSBsaXN0ZW5lciBhdHRhY2hlZCB0byB0aGF0IGV2ZW50IHdpbGwgYmUgZXhlY3V0ZWQuXG5cdCAqIElmIHlvdSBwYXNzIHRoZSBvcHRpb25hbCBhcmd1bWVudCBhcnJheSB0aGVuIHRob3NlIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCB0byBldmVyeSBsaXN0ZW5lciB1cG9uIGV4ZWN1dGlvbi5cblx0ICogQmVjYXVzZSBpdCB1c2VzIGBhcHBseWAsIHlvdXIgYXJyYXkgb2YgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzIGlmIHlvdSB3cm90ZSB0aGVtIG91dCBzZXBhcmF0ZWx5LlxuXHQgKiBTbyB0aGV5IHdpbGwgbm90IGFycml2ZSB3aXRoaW4gdGhlIGFycmF5IG9uIHRoZSBvdGhlciBzaWRlLCB0aGV5IHdpbGwgYmUgc2VwYXJhdGUuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG5cdCAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXSBPcHRpb25hbCBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZW1pdEV2ZW50ID0gZnVuY3Rpb24gZW1pdEV2ZW50KGV2dCwgYXJncykge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVyO1xuXHRcdHZhciBpO1xuXHRcdHZhciBrZXk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aSA9IGxpc3RlbmVyc1trZXldLmxlbmd0aDtcblxuXHRcdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHNoYWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZXZlbnRcblx0XHRcdFx0XHQvLyBUaGUgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZWl0aGVyIHdpdGggYSBiYXNpYyBjYWxsIG9yIGFuIGFwcGx5IGlmIHRoZXJlIGlzIGFuIGFyZ3MgYXJyYXlcblx0XHRcdFx0XHRsaXN0ZW5lciA9IGxpc3RlbmVyc1trZXldW2ldO1xuXG5cdFx0XHRcdFx0aWYgKGxpc3RlbmVyLm9uY2UgPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVzcG9uc2UgPSBsaXN0ZW5lci5saXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzIHx8IFtdKTtcblxuXHRcdFx0XHRcdGlmIChyZXNwb25zZSA9PT0gdGhpcy5fZ2V0T25jZVJldHVyblZhbHVlKCkpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGVtaXRFdmVudFxuXHQgKi9cblx0cHJvdG8udHJpZ2dlciA9IGFsaWFzKCdlbWl0RXZlbnQnKTtcblxuXHQvKipcblx0ICogU3VidGx5IGRpZmZlcmVudCBmcm9tIGVtaXRFdmVudCBpbiB0aGF0IGl0IHdpbGwgcGFzcyBpdHMgYXJndW1lbnRzIG9uIHRvIHRoZSBsaXN0ZW5lcnMsIGFzIG9wcG9zZWQgdG8gdGFraW5nIGEgc2luZ2xlIGFycmF5IG9mIGFyZ3VtZW50cyB0byBwYXNzIG9uLlxuXHQgKiBBcyB3aXRoIGVtaXRFdmVudCwgeW91IGNhbiBwYXNzIGEgcmVnZXggaW4gcGxhY2Ugb2YgdGhlIGV2ZW50IG5hbWUgdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHsuLi4qfSBPcHRpb25hbCBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcblx0XHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdFx0cmV0dXJuIHRoaXMuZW1pdEV2ZW50KGV2dCwgYXJncyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmIGFcblx0ICogbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoZSBvbmUgc2V0IGhlcmUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWRcblx0ICogYWZ0ZXIgZXhlY3V0aW9uLiBUaGlzIHZhbHVlIGRlZmF1bHRzIHRvIHRydWUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIG5ldyB2YWx1ZSB0byBjaGVjayBmb3Igd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnNldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIHNldE9uY2VSZXR1cm5WYWx1ZSh2YWx1ZSkge1xuXHRcdHRoaXMuX29uY2VSZXR1cm5WYWx1ZSA9IHZhbHVlO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZlxuXHQgKiB0aGUgbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoaXMgb25lIHRoZW4gaXQgc2hvdWxkIGJlIHJlbW92ZWRcblx0ICogYXV0b21hdGljYWxseS4gSXQgd2lsbCByZXR1cm4gdHJ1ZSBieSBkZWZhdWx0LlxuXHQgKlxuXHQgKiBAcmV0dXJuIHsqfEJvb2xlYW59IFRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGZvciBvciB0aGUgZGVmYXVsdCwgdHJ1ZS5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gX2dldE9uY2VSZXR1cm5WYWx1ZSgpIHtcblx0XHRpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSgnX29uY2VSZXR1cm5WYWx1ZScpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fb25jZVJldHVyblZhbHVlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgZXZlbnRzIG9iamVjdCBhbmQgY3JlYXRlcyBvbmUgaWYgcmVxdWlyZWQuXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV2ZW50cyBzdG9yYWdlIG9iamVjdC5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0RXZlbnRzID0gZnVuY3Rpb24gX2dldEV2ZW50cygpIHtcblx0XHRyZXR1cm4gdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG5cdH07XG5cblx0Ly8gRXhwb3NlIHRoZSBjbGFzcyBlaXRoZXIgdmlhIEFNRCwgQ29tbW9uSlMgb3IgdGhlIGdsb2JhbCBvYmplY3Rcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gRXZlbnRFbWl0dGVyO1xuXHRcdH0pO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKXtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblx0fVxuXHRlbHNlIHtcblx0XHR0aGlzLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblx0fVxufS5jYWxsKHRoaXMpKTtcbiIsIu+7vy8qIVxuICogZXZlbnRpZSB2MS4wLjNcbiAqIGV2ZW50IGJpbmRpbmcgaGVscGVyXG4gKiAgIGV2ZW50aWUuYmluZCggZWxlbSwgJ2NsaWNrJywgbXlGbiApXG4gKiAgIGV2ZW50aWUudW5iaW5kKCBlbGVtLCAnY2xpY2snLCBteUZuIClcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlICovXG4vKmdsb2JhbCBkZWZpbmU6IGZhbHNlICovXG5cbihmdW5jdGlvbih3aW5kb3cpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGRvY0VsZW0gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgdmFyIGJpbmQgPSBmdW5jdGlvbigpIHtcbiAgfTtcblxuICBpZiAoZG9jRWxlbS5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgYmluZCA9IGZ1bmN0aW9uKG9iaiwgdHlwZSwgZm4pIHtcbiAgICAgIG9iai5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBmYWxzZSk7XG4gICAgfTtcbiAgfSBlbHNlIGlmIChkb2NFbGVtLmF0dGFjaEV2ZW50KSB7XG4gICAgYmluZCA9IGZ1bmN0aW9uKG9iaiwgdHlwZSwgZm4pIHtcbiAgICAgIG9ialsgdHlwZSArIGZuIF0gPSBmbi5oYW5kbGVFdmVudCA/XG4gICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBldmVudCA9IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAvLyBhZGQgZXZlbnQudGFyZ2V0XG4gICAgICAgICAgZXZlbnQudGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQ7XG4gICAgICAgICAgZm4uaGFuZGxlRXZlbnQuY2FsbChmbiwgZXZlbnQpO1xuICAgICAgICB9IDpcbiAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGV2ZW50ID0gd2luZG93LmV2ZW50O1xuICAgICAgICAgIC8vIGFkZCBldmVudC50YXJnZXRcbiAgICAgICAgICBldmVudC50YXJnZXQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuc3JjRWxlbWVudDtcbiAgICAgICAgICBmbi5jYWxsKG9iaiwgZXZlbnQpO1xuICAgICAgICB9O1xuICAgICAgb2JqLmF0dGFjaEV2ZW50KFwib25cIiArIHR5cGUsIG9ialsgdHlwZSArIGZuIF0pO1xuICAgIH07XG4gIH1cblxuICB2YXIgdW5iaW5kID0gZnVuY3Rpb24oKSB7XG4gIH07XG5cbiAgaWYgKGRvY0VsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgIHVuYmluZCA9IGZ1bmN0aW9uKG9iaiwgdHlwZSwgZm4pIHtcbiAgICAgIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBmYWxzZSk7XG4gICAgfTtcbiAgfSBlbHNlIGlmIChkb2NFbGVtLmRldGFjaEV2ZW50KSB7XG4gICAgdW5iaW5kID0gZnVuY3Rpb24ob2JqLCB0eXBlLCBmbikge1xuICAgICAgb2JqLmRldGFjaEV2ZW50KFwib25cIiArIHR5cGUsIG9ialsgdHlwZSArIGZuIF0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZGVsZXRlIG9ialsgdHlwZSArIGZuIF07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gY2FuJ3QgZGVsZXRlIHdpbmRvdyBvYmplY3QgcHJvcGVydGllc1xuICAgICAgICBvYmpbIHR5cGUgKyBmbiBdID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICB2YXIgZXZlbnRpZSA9IHtcbiAgICBiaW5kICA6IGJpbmQsXG4gICAgdW5iaW5kOiB1bmJpbmRcbiAgfTtcblxuLy8gdHJhbnNwb3J0XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoZXZlbnRpZSk7XG5cbiAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZXZlbnRpZTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5ldmVudGllID0gZXZlbnRpZTtcbiAgfVxuXG59KSh0aGlzKTtcbiIsIu+7vy8qIVxuICogaW1hZ2VzTG9hZGVkIHYzLjAuNFxuICogSmF2YVNjcmlwdCBpcyBhbGwgbGlrZSBcIllvdSBpbWFnZXMgYXJlIGRvbmUgeWV0IG9yIHdoYXQ/XCJcbiAqL1xuXG4oZnVuY3Rpb24od2luZG93KSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciAkIC8vPSB3aW5kb3cualF1ZXJ5O1xuICB2YXIgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlO1xuICB2YXIgaGFzQ29uc29sZSA9IHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBleHRlbmQgb2JqZWN0c1xuICBmdW5jdGlvbiBleHRlbmQoYSwgYikge1xuICAgIGZvciAodmFyIHByb3AgaW4gYikge1xuICAgICAgYVsgcHJvcCBdID0gYlsgcHJvcCBdO1xuICAgIH1cbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIHZhciBvYmpUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgZnVuY3Rpb24gaXNBcnJheShvYmopIHtcbiAgICByZXR1cm4gb2JqVG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xuICB9XG5cbi8vIHR1cm4gZWxlbWVudCBvciBub2RlTGlzdCBpbnRvIGFuIGFycmF5XG4gIGZ1bmN0aW9uIG1ha2VBcnJheShvYmopIHtcbiAgICB2YXIgYXJ5ID0gW107XG4gICAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgICAgLy8gdXNlIG9iamVjdCBpZiBhbHJlYWR5IGFuIGFycmF5XG4gICAgICBhcnkgPSBvYmo7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCA9PT0gJ251bWJlcicpIHtcbiAgICAgIC8vIGNvbnZlcnQgbm9kZUxpc3QgdG8gYXJyYXlcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBvYmoubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgYXJ5LnB1c2gob2JqW2ldKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYXJyYXkgb2Ygc2luZ2xlIGluZGV4XG4gICAgICBhcnkucHVzaChvYmopO1xuICAgIH1cbiAgICByZXR1cm4gYXJ5O1xuICB9XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIGZ1bmN0aW9uIGRlZmluZUltYWdlc0xvYWRlZChFdmVudEVtaXR0ZXIsIGV2ZW50aWUpIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7QXJyYXksIEVsZW1lbnQsIE5vZGVMaXN0LCBTdHJpbmd9IGVsZW1cbiAgICAgKiBAcGFyYW0ge09iamVjdCBvciBGdW5jdGlvbn0gb3B0aW9ucyAtIGlmIGZ1bmN0aW9uLCB1c2UgYXMgY2FsbGJhY2tcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvbkFsd2F5cyAtIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICovXG4gICAgZnVuY3Rpb24gSW1hZ2VzTG9hZGVkKGVsZW0sIG9wdGlvbnMsIG9uQWx3YXlzKSB7XG4gICAgICAvLyBjb2VyY2UgSW1hZ2VzTG9hZGVkKCkgd2l0aG91dCBuZXcsIHRvIGJlIG5ldyBJbWFnZXNMb2FkZWQoKVxuICAgICAgaWYgKCEoIHRoaXMgaW5zdGFuY2VvZiBJbWFnZXNMb2FkZWQgKSkge1xuICAgICAgICByZXR1cm4gbmV3IEltYWdlc0xvYWRlZChlbGVtLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIC8vIHVzZSBlbGVtIGFzIHNlbGVjdG9yIHN0cmluZ1xuICAgICAgaWYgKHR5cGVvZiBlbGVtID09PSAnc3RyaW5nJykge1xuICAgICAgICBlbGVtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChlbGVtKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5lbGVtZW50cyA9IG1ha2VBcnJheShlbGVtKTtcbiAgICAgIHRoaXMub3B0aW9ucyA9IGV4dGVuZCh7fSwgdGhpcy5vcHRpb25zKTtcblxuICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9uQWx3YXlzID0gb3B0aW9ucztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV4dGVuZCh0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBpZiAob25BbHdheXMpIHtcbiAgICAgICAgdGhpcy5vbignYWx3YXlzJywgb25BbHdheXMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmdldEltYWdlcygpO1xuXG4gICAgICBpZiAoJCkge1xuICAgICAgICAvLyBhZGQgalF1ZXJ5IERlZmVycmVkIG9iamVjdFxuICAgICAgICB0aGlzLmpxRGVmZXJyZWQgPSBuZXcgJC5EZWZlcnJlZCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBIQUNLIGNoZWNrIGFzeW5jIHRvIGFsbG93IHRpbWUgdG8gYmluZCBsaXN0ZW5lcnNcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5jaGVjaygpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIEltYWdlc0xvYWRlZC5wcm90b3R5cGUub3B0aW9ucyA9IHt9O1xuXG4gICAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5nZXRJbWFnZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuaW1hZ2VzID0gW107XG5cbiAgICAgIC8vIGZpbHRlciAmIGZpbmQgaXRlbXMgaWYgd2UgaGF2ZSBhbiBpdGVtIHNlbGVjdG9yXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5lbGVtZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2YXIgZWxlbSA9IHRoaXMuZWxlbWVudHNbaV07XG4gICAgICAgIC8vIGZpbHRlciBzaWJsaW5nc1xuICAgICAgICBpZiAoZWxlbS5ub2RlTmFtZSA9PT0gJ0lNRycpIHtcbiAgICAgICAgICB0aGlzLmFkZEltYWdlKGVsZW0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIGZpbmQgY2hpbGRyZW5cbiAgICAgICAgdmFyIGNoaWxkRWxlbXMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuICAgICAgICAvLyBjb25jYXQgY2hpbGRFbGVtcyB0byBmaWx0ZXJGb3VuZCBhcnJheVxuICAgICAgICBmb3IgKHZhciBqID0gMCwgakxlbiA9IGNoaWxkRWxlbXMubGVuZ3RoOyBqIDwgakxlbjsgaisrKSB7XG4gICAgICAgICAgdmFyIGltZyA9IGNoaWxkRWxlbXNbal07XG4gICAgICAgICAgdGhpcy5hZGRJbWFnZShpbWcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7SW1hZ2V9IGltZ1xuICAgICAqL1xuICAgIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuYWRkSW1hZ2UgPSBmdW5jdGlvbihpbWcpIHtcbiAgICAgIHZhciBsb2FkaW5nSW1hZ2UgPSBuZXcgTG9hZGluZ0ltYWdlKGltZyk7XG4gICAgICB0aGlzLmltYWdlcy5wdXNoKGxvYWRpbmdJbWFnZSk7XG4gICAgfTtcblxuICAgIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICB2YXIgY2hlY2tlZENvdW50ID0gMDtcbiAgICAgIHZhciBsZW5ndGggPSB0aGlzLmltYWdlcy5sZW5ndGg7XG4gICAgICB0aGlzLmhhc0FueUJyb2tlbiA9IGZhbHNlO1xuICAgICAgLy8gY29tcGxldGUgaWYgbm8gaW1hZ2VzXG4gICAgICBpZiAoIWxlbmd0aCkge1xuICAgICAgICB0aGlzLmNvbXBsZXRlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25Db25maXJtKGltYWdlLCBtZXNzYWdlKSB7XG4gICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmRlYnVnICYmIGhhc0NvbnNvbGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnY29uZmlybScsIGltYWdlLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF90aGlzLnByb2dyZXNzKGltYWdlKTtcbiAgICAgICAgY2hlY2tlZENvdW50Kys7XG4gICAgICAgIGlmIChjaGVja2VkQ291bnQgPT09IGxlbmd0aCkge1xuICAgICAgICAgIF90aGlzLmNvbXBsZXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7IC8vIGJpbmQgb25jZVxuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBsb2FkaW5nSW1hZ2UgPSB0aGlzLmltYWdlc1tpXTtcbiAgICAgICAgbG9hZGluZ0ltYWdlLm9uKCdjb25maXJtJywgb25Db25maXJtKTtcbiAgICAgICAgbG9hZGluZ0ltYWdlLmNoZWNrKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIEltYWdlc0xvYWRlZC5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbihpbWFnZSkge1xuICAgICAgdGhpcy5oYXNBbnlCcm9rZW4gPSB0aGlzLmhhc0FueUJyb2tlbiB8fCAhaW1hZ2UuaXNMb2FkZWQ7XG4gICAgICAvLyBIQUNLIC0gQ2hyb21lIHRyaWdnZXJzIGV2ZW50IGJlZm9yZSBvYmplY3QgcHJvcGVydGllcyBoYXZlIGNoYW5nZWQuICM4M1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIF90aGlzLmVtaXQoJ3Byb2dyZXNzJywgX3RoaXMsIGltYWdlKTtcbiAgICAgICAgaWYgKF90aGlzLmpxRGVmZXJyZWQpIHtcbiAgICAgICAgICBfdGhpcy5qcURlZmVycmVkLm5vdGlmeShfdGhpcywgaW1hZ2UpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGV2ZW50TmFtZSA9IHRoaXMuaGFzQW55QnJva2VuID8gJ2ZhaWwnIDogJ2RvbmUnO1xuICAgICAgdGhpcy5pc0NvbXBsZXRlID0gdHJ1ZTtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAvLyBIQUNLIC0gYW5vdGhlciBzZXRUaW1lb3V0IHNvIHRoYXQgY29uZmlybSBoYXBwZW5zIGFmdGVyIHByb2dyZXNzXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5lbWl0KGV2ZW50TmFtZSwgX3RoaXMpO1xuICAgICAgICBfdGhpcy5lbWl0KCdhbHdheXMnLCBfdGhpcyk7XG4gICAgICAgIGlmIChfdGhpcy5qcURlZmVycmVkKSB7XG4gICAgICAgICAgdmFyIGpxTWV0aG9kID0gX3RoaXMuaGFzQW55QnJva2VuID8gJ3JlamVjdCcgOiAncmVzb2x2ZSc7XG4gICAgICAgICAgX3RoaXMuanFEZWZlcnJlZFsganFNZXRob2QgXShfdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBqcXVlcnkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIGlmICgkKSB7XG4gICAgICAkLmZuLmltYWdlc0xvYWRlZCA9IGZ1bmN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBJbWFnZXNMb2FkZWQodGhpcywgb3B0aW9ucywgY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gaW5zdGFuY2UuanFEZWZlcnJlZC5wcm9taXNlKCQodGhpcykpO1xuICAgICAgfTtcbiAgICB9XG5cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgdmFyIGNhY2hlID0ge307XG5cbiAgICBmdW5jdGlvbiBMb2FkaW5nSW1hZ2UoaW1nKSB7XG4gICAgICB0aGlzLmltZyA9IGltZztcbiAgICB9XG5cbiAgICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gICAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gZmlyc3QgY2hlY2sgY2FjaGVkIGFueSBwcmV2aW91cyBpbWFnZXMgdGhhdCBoYXZlIHNhbWUgc3JjXG4gICAgICB2YXIgY2FjaGVkID0gY2FjaGVbIHRoaXMuaW1nLnNyYyBdO1xuICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICB0aGlzLnVzZUNhY2hlZChjYWNoZWQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBhZGQgdGhpcyB0byBjYWNoZVxuICAgICAgY2FjaGVbIHRoaXMuaW1nLnNyYyBdID0gdGhpcztcblxuICAgICAgLy8gSWYgY29tcGxldGUgaXMgdHJ1ZSBhbmQgYnJvd3NlciBzdXBwb3J0cyBuYXR1cmFsIHNpemVzLFxuICAgICAgLy8gdHJ5IHRvIGNoZWNrIGZvciBpbWFnZSBzdGF0dXMgbWFudWFsbHkuXG4gICAgICBpZiAodGhpcy5pbWcuY29tcGxldGUgJiYgdGhpcy5pbWcubmF0dXJhbFdpZHRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gcmVwb3J0IGJhc2VkIG9uIG5hdHVyYWxXaWR0aFxuICAgICAgICB0aGlzLmNvbmZpcm0odGhpcy5pbWcubmF0dXJhbFdpZHRoICE9PSAwLCAnbmF0dXJhbFdpZHRoJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm9uZSBvZiB0aGUgY2hlY2tzIGFib3ZlIG1hdGNoZWQsIHNpbXVsYXRlIGxvYWRpbmcgb24gZGV0YWNoZWQgZWxlbWVudC5cbiAgICAgIHZhciBwcm94eUltYWdlID0gdGhpcy5wcm94eUltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICBldmVudGllLmJpbmQocHJveHlJbWFnZSwgJ2xvYWQnLCB0aGlzKTtcbiAgICAgIGV2ZW50aWUuYmluZChwcm94eUltYWdlLCAnZXJyb3InLCB0aGlzKTtcbiAgICAgIHByb3h5SW1hZ2Uuc3JjID0gdGhpcy5pbWcuc3JjO1xuICAgIH07XG5cbiAgICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlLnVzZUNhY2hlZCA9IGZ1bmN0aW9uKGNhY2hlZCkge1xuICAgICAgaWYgKGNhY2hlZC5pc0NvbmZpcm1lZCkge1xuICAgICAgICB0aGlzLmNvbmZpcm0oY2FjaGVkLmlzTG9hZGVkLCAnY2FjaGVkIHdhcyBjb25maXJtZWQnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGNhY2hlZC5vbignY29uZmlybScsIGZ1bmN0aW9uKGltYWdlKSB7XG4gICAgICAgICAgX3RoaXMuY29uZmlybShpbWFnZS5pc0xvYWRlZCwgJ2NhY2hlIGVtaXR0ZWQgY29uZmlybWVkJyk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7IC8vIGJpbmQgb25jZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5jb25maXJtID0gZnVuY3Rpb24oaXNMb2FkZWQsIG1lc3NhZ2UpIHtcbiAgICAgIHRoaXMuaXNDb25maXJtZWQgPSB0cnVlO1xuICAgICAgdGhpcy5pc0xvYWRlZCA9IGlzTG9hZGVkO1xuICAgICAgdGhpcy5lbWl0KCdjb25maXJtJywgdGhpcywgbWVzc2FnZSk7XG4gICAgfTtcblxuICAgIC8vIHRyaWdnZXIgc3BlY2lmaWVkIGhhbmRsZXIgZm9yIGV2ZW50IHR5cGVcbiAgICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBtZXRob2QgPSAnb24nICsgZXZlbnQudHlwZTtcbiAgICAgIGlmICh0aGlzWyBtZXRob2QgXSkge1xuICAgICAgICB0aGlzWyBtZXRob2QgXShldmVudCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIExvYWRpbmdJbWFnZS5wcm90b3R5cGUub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmNvbmZpcm0odHJ1ZSwgJ29ubG9hZCcpO1xuICAgICAgdGhpcy51bmJpbmRQcm94eUV2ZW50cygpO1xuICAgIH07XG5cbiAgICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuY29uZmlybShmYWxzZSwgJ29uZXJyb3InKTtcbiAgICAgIHRoaXMudW5iaW5kUHJveHlFdmVudHMoKTtcbiAgICB9O1xuXG4gICAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZS51bmJpbmRQcm94eUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgZXZlbnRpZS51bmJpbmQodGhpcy5wcm94eUltYWdlLCAnbG9hZCcsIHRoaXMpO1xuICAgICAgZXZlbnRpZS51bmJpbmQodGhpcy5wcm94eUltYWdlLCAnZXJyb3InLCB0aGlzKTtcbiAgICB9O1xuXG4gICAgLy8gLS0tLS0gIC0tLS0tIC8vXG5cbiAgICByZXR1cm4gSW1hZ2VzTG9hZGVkO1xuICB9XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHRyYW5zcG9ydCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoW1xuICAgICAgJy4uLy4uLy4uL2Jvd2VyX2NvbXBvbmVudHMvZXZlbnRFbWl0dGVyL0V2ZW50RW1pdHRlcicsXG4gICAgICAnZXZlbnRpZS9ldmVudGllJ1xuICAgIF0sXG4gICAgICBkZWZpbmVJbWFnZXNMb2FkZWQpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgdmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJy4vRXZlbnRFbWl0dGVyJylcbiAgICAgICwgZXZlbnRpZSA9IHJlcXVpcmUoJy4vZXZlbnRpZScpXG4gICAgICA7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluZUltYWdlc0xvYWRlZChcbiAgICAgIEV2ZW50RW1pdHRlcixcbiAgICAgIGV2ZW50aWVcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LmltYWdlc0xvYWRlZCA9IGRlZmluZUltYWdlc0xvYWRlZChcbiAgICAgIHdpbmRvdy5FdmVudEVtaXR0ZXIsXG4gICAgICB3aW5kb3cuZXZlbnRpZVxuICAgICk7XG4gIH1cblxufSkod2luZG93KTtcbiIsIu+7vy8qXG4gKiBwbXJwYyAwLjcuMSAtIEludGVyLXdpZGdldCByZW1vdGUgcHJvY2VkdXJlIGNhbGwgbGlicmFyeSBiYXNlZCBvbiBIVE1MNVxuICogICAgICAgICAgICAgICBwb3N0TWVzc2FnZSBBUEkgYW5kIEpTT04tUlBDLiBodHRwczovL2dpdGh1Yi5jb20vaXp1emFrL3BtcnBjXG4gKlxuICogQ29weXJpZ2h0IDIwMTIgSXZhbiBadXphaywgTWFya28gSXZhbmtvdmljXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblxuLy9wbXJwYyA9IHNlbGYucG1ycGMgPSAgZnVuY3Rpb24oKSB7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBtcnBjKCkge1xuICAvLyBjaGVjayBpZiBKU09OIGxpYnJhcnkgaXMgYXZhaWxhYmxlXG4gIGlmICh0eXBlb2YgSlNPTiA9PT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2YgSlNPTi5zdHJpbmdpZnkgPT09IFwidW5kZWZpbmVkXCIgfHxcbiAgICB0eXBlb2YgSlNPTi5wYXJzZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHRocm93IFwicG1ycGMgcmVxdWlyZXMgdGhlIEpTT04gbGlicmFyeVwiO1xuICB9XG5cbiAgLy8gVE9ETzogbWFrZSBcImNvbnRleHRUeXBlXCIgcHJpdmF0ZSB2YXJpYWJsZVxuICAvLyBjaGVjayBpZiBwb3N0TWVzc2FnZSBBUElzIGFyZSBhdmFpbGFibGVcbiAgaWYgKHR5cGVvZiB0aGlzLnBvc3RNZXNzYWdlID09PSBcInVuZGVmaW5lZFwiICYmICAvLyB3aW5kb3cgb3Igd29ya2VyXG4gICAgdHlwZW9mIHRoaXMub25jb25uZWN0ID09PSBcInVuZGVmaW5lZFwiKSB7ICAvLyBzaGFyZWQgd29ya2VyXG4gICAgdGhyb3cgXCJwbXJwYyByZXF1aXJlcyB0aGUgSFRNTDUgY3Jvc3MtZG9jdW1lbnQgbWVzc2FnaW5nIGFuZCB3b3JrZXIgQVBJc1wiO1xuICB9XG5cbiAgLy8gR2VuZXJhdGVzIGEgdmVyc2lvbiA0IFVVSURcbiAgZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCkge1xuICAgIHZhciB1dWlkID0gW10sIG5pbmV0ZWVuID0gXCI4OUFCXCIsIGhleCA9IFwiMDEyMzQ1Njc4OUFCQ0RFRlwiO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzY7IGkrKykge1xuICAgICAgdXVpZFtpXSA9IGhleFtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxNildO1xuICAgIH1cbiAgICB1dWlkWzE0XSA9ICc0JztcbiAgICB1dWlkWzE5XSA9IG5pbmV0ZWVuW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDQpXTtcbiAgICB1dWlkWzhdID0gdXVpZFsxM10gPSB1dWlkWzE4XSA9IHV1aWRbMjNdID0gJy0nO1xuICAgIHJldHVybiB1dWlkLmpvaW4oJycpO1xuICB9XG5cbiAgLy8gQ2hlY2tzIHdoZXRoZXIgYSBkb21haW4gc2F0aXNmaWVzIHRoZSBhY2Nlc3MgY29udHJvbCBsaXN0LiBUaGUgYWNjZXNzXG4gIC8vIGNvbnRyb2wgbGlzdCBoYXMgYSB3aGl0ZWxpc3QgYW5kIGEgYmxhY2tsaXN0LiBJbiBvcmRlciB0byBzYXRpc2Z5IHRoZSBhY2wsXG4gIC8vIHRoZSBkb21haW4gbXVzdCBiZSBvbiB0aGUgd2hpdGVsaXN0LCBhbmQgbXVzdCBub3QgYmUgb24gdGhlIGJsYWNrbGlzdC5cbiAgZnVuY3Rpb24gY2hlY2tBQ0woYWNjZXNzQ29udHJvbExpc3QsIG9yaWdpbikge1xuICAgIHZhciBhY2xXaGl0ZWxpc3QgPSBhY2Nlc3NDb250cm9sTGlzdC53aGl0ZWxpc3Q7XG4gICAgdmFyIGFjbEJsYWNrbGlzdCA9IGFjY2Vzc0NvbnRyb2xMaXN0LmJsYWNrbGlzdDtcblxuICAgIHZhciBpc1doaXRlbGlzdGVkID0gZmFsc2U7XG4gICAgdmFyIGlzQmxhY2tsaXN0ZWQgPSBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWNsV2hpdGVsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAob3JpZ2luLm1hdGNoKG5ldyBSZWdFeHAoYWNsV2hpdGVsaXN0W2ldKSkpIHtcbiAgICAgICAgaXNXaGl0ZWxpc3RlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgYWNsQmxhY2tsaXN0Lmxlbmd0aDsgKytqKSB7XG4gICAgICBpZiAob3JpZ2luLm1hdGNoKG5ldyBSZWdFeHAoYWNsQmxhY2tsaXN0W2pdKSkpIHtcbiAgICAgICAgaXNCbGFja2xpc3RlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpc1doaXRlbGlzdGVkICYmICFpc0JsYWNrbGlzdGVkO1xuICB9XG5cbiAgLy8gQ2FsbHMgYSBmdW5jdGlvbiB3aXRoIGVpdGhlciBwb3NpdGlvbmFsIG9yIG5hbWVkIHBhcmFtZXRlcnNcbiAgLy8gSW4gZWl0aGVyIGNhc2UsIGFkZGl0aW9uYWxQYXJhbXMgd2lsbCBiZSBhcHBlbmRlZCB0byB0aGUgZW5kXG4gIGZ1bmN0aW9uIGludm9rZVByb2NlZHVyZShmbiwgc2VsZiwgcGFyYW1zLCBhZGRpdGlvbmFsUGFyYW1zKSB7XG4gICAgaWYgKCEocGFyYW1zIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAvLyBnZXQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGZ1bmN0aW9uXG4gICAgICB2YXIgZm5EZWYgPSBmbi50b1N0cmluZygpO1xuXG4gICAgICAvLyBwYXJzZSB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIGFuZCByZXRyaWV2ZSBvcmRlciBvZiBwYXJhbWV0ZXJzXG4gICAgICB2YXIgYXJnTmFtZXMgPSBmbkRlZi5zdWJzdHJpbmcoZm5EZWYuaW5kZXhPZihcIihcIikgKyAxLCBmbkRlZi5pbmRleE9mKFwiKVwiKSk7XG4gICAgICBhcmdOYW1lcyA9IChhcmdOYW1lcyA9PT0gXCJcIikgPyBbXSA6IGFyZ05hbWVzLnNwbGl0KFwiLCBcIik7XG5cbiAgICAgIHZhciBhcmdJbmRleGVzID0ge307XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFyZ0luZGV4ZXNbYXJnTmFtZXNbaV1dID0gaTtcbiAgICAgIH1cblxuICAgICAgLy8gY29uc3RydWN0IGFuIGFycmF5IG9mIGFyZ3VtZW50cyBmcm9tIGEgZGljdGlvbmFyeVxuICAgICAgdmFyIGNhbGxQYXJhbWV0ZXJzID0gW107XG4gICAgICBmb3IgKHZhciBwYXJhbU5hbWUgaW4gcGFyYW1zKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXJnSW5kZXhlc1twYXJhbU5hbWVdICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgY2FsbFBhcmFtZXRlcnNbYXJnSW5kZXhlc1twYXJhbU5hbWVdXSA9IHBhcmFtc1twYXJhbU5hbWVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IFwiTm8gc3VjaCBwYXJhbTogXCIgKyBwYXJhbU5hbWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcGFyYW1zID0gY2FsbFBhcmFtZXRlcnM7XG4gICAgfVxuXG4gICAgLy8gYXBwZW5kIGFkZGl0aW9uYWwgcGFyYW1ldGVyc1xuICAgIGlmICh0eXBlb2YgYWRkaXRpb25hbFBhcmFtcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zID0gcGFyYW1zLmNvbmNhdChhZGRpdGlvbmFsUGFyYW1zKTtcbiAgICB9XG5cbiAgICAvLyBpbnZva2UgZnVuY3Rpb24gd2l0aCBzcGVjaWZpZWQgY29udGV4dCBhbmQgYXJndW1lbnRzIGFycmF5XG4gICAgcmV0dXJuIGZuLmFwcGx5KHNlbGYsIHBhcmFtcyk7XG4gIH1cblxuICAvLyBKU09OIGVuY29kZSBhbiBvYmplY3QgaW50byBwbXJwYyBtZXNzYWdlXG4gIGZ1bmN0aW9uIGVuY29kZShvYmopIHtcbiAgICByZXR1cm4gXCJwbXJwYy5cIiArIEpTT04uc3RyaW5naWZ5KG9iaik7XG4gIH1cblxuICAvLyBKU09OIGRlY29kZSBhIHBtcnBjIG1lc3NhZ2VcbiAgZnVuY3Rpb24gZGVjb2RlKHN0cikge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHN0ci5zdWJzdHJpbmcoXCJwbXJwYy5cIi5sZW5ndGgpKTtcbiAgfVxuXG4gIC8vIENyZWF0ZXMgYSBiYXNlIEpTT04tUlBDIG9iamVjdCwgdXNhYmxlIGZvciBib3RoIHJlcXVlc3QgYW5kIHJlc3BvbnNlLlxuICAvLyBBcyBvZiBKU09OLVJQQyAyLjAgaXQgb25seSBjb250YWlucyBvbmUgZmllbGQgXCJqc29ucnBjXCIgd2l0aCB2YWx1ZSBcIjIuMFwiXG4gIGZ1bmN0aW9uIGNyZWF0ZUpTT05ScGNCYXNlT2JqZWN0KCkge1xuICAgIHZhciBjYWxsID0ge307XG4gICAgY2FsbC5qc29ucnBjID0gXCIyLjBcIjtcbiAgICByZXR1cm4gY2FsbDtcbiAgfVxuXG4gIC8vIENyZWF0ZXMgYSBKU09OLVJQQyByZXF1ZXN0IG9iamVjdCBmb3IgdGhlIGdpdmVuIG1ldGhvZCBhbmQgcGFyYW1ldGVyc1xuICBmdW5jdGlvbiBjcmVhdGVKU09OUnBjUmVxdWVzdE9iamVjdChwcm9jZWR1cmVOYW1lLCBwYXJhbWV0ZXJzLCBpZCkge1xuICAgIHZhciBjYWxsID0gY3JlYXRlSlNPTlJwY0Jhc2VPYmplY3QoKTtcbiAgICBjYWxsLm1ldGhvZCA9IHByb2NlZHVyZU5hbWU7XG4gICAgY2FsbC5wYXJhbXMgPSBwYXJhbWV0ZXJzO1xuICAgIGlmICh0eXBlb2YgaWQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNhbGwuaWQgPSBpZDtcbiAgICB9XG4gICAgcmV0dXJuIGNhbGw7XG4gIH1cblxuICAvLyBDcmVhdGVzIGEgSlNPTi1SUEMgZXJyb3Igb2JqZWN0IGNvbXBsZXRlIHdpdGggbWVzc2FnZSBhbmQgZXJyb3IgY29kZVxuICBmdW5jdGlvbiBjcmVhdGVKU09OUnBjRXJyb3JPYmplY3QoZXJyb3Jjb2RlLCBtZXNzYWdlLCBkYXRhKSB7XG4gICAgdmFyIGVycm9yID0ge307XG4gICAgZXJyb3IuY29kZSA9IGVycm9yY29kZTtcbiAgICBlcnJvci5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICBlcnJvci5kYXRhID0gZGF0YTtcbiAgICByZXR1cm4gZXJyb3I7XG4gIH1cblxuICAvLyBDcmVhdGVzIGEgSlNPTi1SUEMgcmVzcG9uc2Ugb2JqZWN0LlxuICBmdW5jdGlvbiBjcmVhdGVKU09OUnBjUmVzcG9uc2VPYmplY3QoZXJyb3IsIHJlc3VsdCwgaWQpIHtcbiAgICB2YXIgcmVzcG9uc2UgPSBjcmVhdGVKU09OUnBjQmFzZU9iamVjdCgpO1xuICAgIHJlc3BvbnNlLmlkID0gaWQ7XG5cbiAgICBpZiAodHlwZW9mIGVycm9yID09PSBcInVuZGVmaW5lZFwiIHx8IGVycm9yID09PSBudWxsKSB7XG4gICAgICByZXNwb25zZS5yZXN1bHQgPSAocmVzdWx0ID09PSBcInVuZGVmaW5lZFwiKSA/IG51bGwgOiByZXN1bHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3BvbnNlLmVycm9yID0gZXJyb3I7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG5cbiAgLy8gZGljdGlvbmFyeSBvZiBzZXJ2aWNlcyByZWdpc3RlcmVkIGZvciByZW1vdGUgY2FsbHNcbiAgdmFyIHJlZ2lzdGVyZWRTZXJ2aWNlcyA9IHt9O1xuICAvLyBkaWN0aW9uYXJ5IG9mIHJlcXVlc3RzIGJlaW5nIHByb2Nlc3NlZCBvbiB0aGUgY2xpZW50IHNpZGVcbiAgdmFyIGNhbGxRdWV1ZSA9IHt9O1xuXG4gIHZhciByZXNlcnZlZFByb2NlZHVyZU5hbWVzID0ge307XG4gIC8vIHJlZ2lzdGVyIGEgc2VydmljZSBhdmFpbGFibGUgZm9yIHJlbW90ZSBjYWxsc1xuICAvLyBpZiBubyBhY2wgaXMgZ2l2ZW4sIGFzc3VtZSB0aGF0IGl0IGlzIGF2YWlsYWJsZSB0byBldmVyeW9uZVxuICBmdW5jdGlvbiByZWdpc3Rlcihjb25maWcpIHtcbiAgICBpZiAoY29uZmlnLnB1YmxpY1Byb2NlZHVyZU5hbWUgaW4gcmVzZXJ2ZWRQcm9jZWR1cmVOYW1lcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWdpc3RlcmVkU2VydmljZXNbY29uZmlnLnB1YmxpY1Byb2NlZHVyZU5hbWVdID0ge1xuICAgICAgICBcInB1YmxpY1Byb2NlZHVyZU5hbWVcIjogY29uZmlnLnB1YmxpY1Byb2NlZHVyZU5hbWUsXG4gICAgICAgIFwicHJvY2VkdXJlXCIgICAgICAgICAgOiBjb25maWcucHJvY2VkdXJlLFxuICAgICAgICBcImNvbnRleHRcIiAgICAgICAgICAgIDogY29uZmlnLnByb2NlZHVyZS5jb250ZXh0LFxuICAgICAgICBcImlzQXN5bmNcIiAgICAgICAgICAgIDogdHlwZW9mIGNvbmZpZy5pc0FzeW5jaHJvbm91cyAhPT0gXCJ1bmRlZmluZWRcIiA/XG4gICAgICAgICAgY29uZmlnLmlzQXN5bmNocm9ub3VzIDogZmFsc2UsXG4gICAgICAgIFwiYWNsXCIgICAgICAgICAgICAgICAgOiB0eXBlb2YgY29uZmlnLmFjbCAhPT0gXCJ1bmRlZmluZWRcIiA/XG4gICAgICAgICAgY29uZmlnLmFjbCA6IHt3aGl0ZWxpc3Q6IFtcIiguKilcIl0sIGJsYWNrbGlzdDogW119fTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIHVucmVnaXN0ZXIgYSBwcmV2aW91c2x5IHJlZ2lzdGVyZWQgcHJvY2VkdXJlXG4gIGZ1bmN0aW9uIHVucmVnaXN0ZXIocHVibGljUHJvY2VkdXJlTmFtZSkge1xuICAgIGlmIChwdWJsaWNQcm9jZWR1cmVOYW1lIGluIHJlc2VydmVkUHJvY2VkdXJlTmFtZXMpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIHJlZ2lzdGVyZWRTZXJ2aWNlc1twdWJsaWNQcm9jZWR1cmVOYW1lXTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIHJldHJlaXZlIHNlcnZpY2UgZm9yIGEgc3BlY2lmaWMgcHJvY2VkdXJlIG5hbWVcbiAgZnVuY3Rpb24gZmV0Y2hSZWdpc3RlcmVkU2VydmljZShwdWJsaWNQcm9jZWR1cmVOYW1lKSB7XG4gICAgcmV0dXJuIHJlZ2lzdGVyZWRTZXJ2aWNlc1twdWJsaWNQcm9jZWR1cmVOYW1lXTtcbiAgfVxuXG4gIC8vIHJlY2VpdmUgYW5kIGV4ZWN1dGUgYSBwbXJwYyBjYWxsIHdoaWNoIG1heSBiZSBhIHJlcXVlc3Qgb3IgYSByZXNwb25zZVxuICBmdW5jdGlvbiBwcm9jZXNzUG1ycGNNZXNzYWdlKGV2ZW50UGFyYW1zKSB7XG4gICAgdmFyIHNlcnZpY2VDYWxsRXZlbnQgPSBldmVudFBhcmFtcy5ldmVudDtcbiAgICB2YXIgZXZlbnRTb3VyY2UgPSBldmVudFBhcmFtcy5zb3VyY2U7XG4gICAgdmFyIGlzV29ya2VyQ29tbSA9IHR5cGVvZiBldmVudFNvdXJjZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBldmVudFNvdXJjZSAhPT0gbnVsbDtcblxuICAgIC8vIGlmIHRoZSBtZXNzYWdlIGlzIG5vdCBmb3IgcG1ycGMsIGlnbm9yZSBpdC5cbiAgICBpZiAoc2VydmljZUNhbGxFdmVudC5kYXRhLmluZGV4T2YoXCJwbXJwYy5cIikgIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG1lc3NhZ2UgPSBkZWNvZGUoc2VydmljZUNhbGxFdmVudC5kYXRhKTtcblxuICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlLm1ldGhvZCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyB0aGlzIGlzIGEgcmVxdWVzdFxuXG4gICAgICAgIHZhciBuZXdTZXJ2aWNlQ2FsbEV2ZW50ID0ge1xuICAgICAgICAgIGRhdGEgICAgICAgICAgOiBzZXJ2aWNlQ2FsbEV2ZW50LmRhdGEsXG4gICAgICAgICAgc291cmNlICAgICAgICA6IGlzV29ya2VyQ29tbSA/IGV2ZW50U291cmNlIDogc2VydmljZUNhbGxFdmVudC5zb3VyY2UsXG4gICAgICAgICAgb3JpZ2luICAgICAgICA6IGlzV29ya2VyQ29tbSA/IFwiKlwiIDogc2VydmljZUNhbGxFdmVudC5vcmlnaW4sXG4gICAgICAgICAgc2hvdWxkQ2hlY2tBQ0w6ICFpc1dvcmtlckNvbW1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBwcm9jZXNzSlNPTlJwY1JlcXVlc3QobWVzc2FnZSwgbmV3U2VydmljZUNhbGxFdmVudCk7XG5cbiAgICAgICAgLy8gcmV0dXJuIHRoZSByZXNwb25zZVxuICAgICAgICBpZiAocmVzcG9uc2UgIT09IG51bGwpIHtcbiAgICAgICAgICBzZW5kUG1ycGNNZXNzYWdlKFxuICAgICAgICAgICAgbmV3U2VydmljZUNhbGxFdmVudC5zb3VyY2UsIHJlc3BvbnNlLCBuZXdTZXJ2aWNlQ2FsbEV2ZW50Lm9yaWdpbik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHRoaXMgaXMgYSByZXNwb25zZVxuICAgICAgICBwcm9jZXNzSlNPTlJwY1Jlc3BvbnNlKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFByb2Nlc3MgYSBzaW5nbGUgSlNPTi1SUEMgUmVxdWVzdFxuICBmdW5jdGlvbiBwcm9jZXNzSlNPTlJwY1JlcXVlc3QocmVxdWVzdCwgc2VydmljZUNhbGxFdmVudCwgc2hvdWxkQ2hlY2tBQ0wpIHtcbiAgICBpZiAocmVxdWVzdC5qc29ucnBjICE9PSBcIjIuMFwiKSB7XG4gICAgICAvLyBJbnZhbGlkIEpTT04tUlBDIHJlcXVlc3RcbiAgICAgIHJldHVybiBjcmVhdGVKU09OUnBjUmVzcG9uc2VPYmplY3QoXG4gICAgICAgIGNyZWF0ZUpTT05ScGNFcnJvck9iamVjdCgtMzI2MDAsIFwiSW52YWxpZCByZXF1ZXN0LlwiLFxuICAgICAgICAgIFwiVGhlIHJlY2l2ZWQgSlNPTiBpcyBub3QgYSB2YWxpZCBKU09OLVJQQyAyLjAgcmVxdWVzdC5cIiksXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwpO1xuICAgIH1cblxuICAgIHZhciBpZCA9IHJlcXVlc3QuaWQ7XG4gICAgdmFyIHNlcnZpY2UgPSBmZXRjaFJlZ2lzdGVyZWRTZXJ2aWNlKHJlcXVlc3QubWV0aG9kKTtcblxuICAgIGlmICh0eXBlb2Ygc2VydmljZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgLy8gY2hlY2sgdGhlIGFjbCByaWdodHNcbiAgICAgIGlmICghc2VydmljZUNhbGxFdmVudC5zaG91bGRDaGVja0FDTCB8fFxuICAgICAgICBjaGVja0FDTChzZXJ2aWNlLmFjbCwgc2VydmljZUNhbGxFdmVudC5vcmlnaW4pKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHNlcnZpY2UuaXNBc3luYykge1xuICAgICAgICAgICAgLy8gaWYgdGhlIHNlcnZpY2UgaXMgYXN5bmMsIGNyZWF0ZSBhIGNhbGxiYWNrIHdoaWNoIHRoZSBzZXJ2aWNlXG4gICAgICAgICAgICAvLyBtdXN0IGNhbGwgaW4gb3JkZXIgdG8gc2VuZCBhIHJlc3BvbnNlIGJhY2tcbiAgICAgICAgICAgIHZhciBjYiA9IGZ1bmN0aW9uKHJldHVyblZhbHVlKSB7XG4gICAgICAgICAgICAgIHNlbmRQbXJwY01lc3NhZ2UoXG4gICAgICAgICAgICAgICAgc2VydmljZUNhbGxFdmVudC5zb3VyY2UsXG4gICAgICAgICAgICAgICAgY3JlYXRlSlNPTlJwY1Jlc3BvbnNlT2JqZWN0KG51bGwsIHJldHVyblZhbHVlLCBpZCksXG4gICAgICAgICAgICAgICAgc2VydmljZUNhbGxFdmVudC5vcmlnaW4pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhIGVycm9yYmFjayB3aGljaCB0aGUgc2VydmljZVxuICAgICAgICAgICAgLy8gbXVzdCBjYWxsIGluIG9yZGVyIHRvIHNlbmQgYW4gZXJyb3IgYmFja1xuICAgICAgICAgICAgdmFyIGViID0gZnVuY3Rpb24oZXJyb3JWYWx1ZSkge1xuICAgICAgICAgICAgICBzZW5kUG1ycGNNZXNzYWdlKFxuICAgICAgICAgICAgICAgIHNlcnZpY2VDYWxsRXZlbnQuc291cmNlLFxuICAgICAgICAgICAgICAgIGNyZWF0ZUpTT05ScGNSZXNwb25zZU9iamVjdChcbiAgICAgICAgICAgICAgICAgIGNyZWF0ZUpTT05ScGNFcnJvck9iamVjdChcbiAgICAgICAgICAgICAgICAgICAgLTEsIFwiQXBwbGljYXRpb24gZXJyb3IuXCIsIGVycm9yVmFsdWUubWVzc2FnZSksXG4gICAgICAgICAgICAgICAgICBudWxsLCBpZCksXG4gICAgICAgICAgICAgICAgc2VydmljZUNhbGxFdmVudC5vcmlnaW4pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGludm9rZVByb2NlZHVyZShcbiAgICAgICAgICAgICAgc2VydmljZS5wcm9jZWR1cmUsIHNlcnZpY2UuY29udGV4dCwgcmVxdWVzdC5wYXJhbXMsIFtjYiwgZWIsIHNlcnZpY2VDYWxsRXZlbnRdKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGUgc2VydmljZSBpcyBub3QgYXN5bmMsIGp1c3QgY2FsbCBpdCBhbmQgcmV0dXJuIHRoZSB2YWx1ZVxuICAgICAgICAgICAgdmFyIHJldHVyblZhbHVlID0gaW52b2tlUHJvY2VkdXJlKFxuICAgICAgICAgICAgICBzZXJ2aWNlLnByb2NlZHVyZSxcbiAgICAgICAgICAgICAgc2VydmljZS5jb250ZXh0LFxuICAgICAgICAgICAgICByZXF1ZXN0LnBhcmFtcywgW3NlcnZpY2VDYWxsRXZlbnRdKTtcbiAgICAgICAgICAgIHJldHVybiAodHlwZW9mIGlkID09PSBcInVuZGVmaW5lZFwiKSA/IG51bGwgOlxuICAgICAgICAgICAgICBjcmVhdGVKU09OUnBjUmVzcG9uc2VPYmplY3QobnVsbCwgcmV0dXJuVmFsdWUsIGlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgLy8gaXQgd2FzIGEgbm90aWZpY2F0aW9uIG5vYm9keSBjYXJlcyBpZiBpdCBmYWlsc1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGVycm9yLm1hdGNoKFwiXihObyBzdWNoIHBhcmFtKVwiKSkge1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUpTT05ScGNSZXNwb25zZU9iamVjdChcbiAgICAgICAgICAgICAgY3JlYXRlSlNPTlJwY0Vycm9yT2JqZWN0KFxuICAgICAgICAgICAgICAgIC0zMjYwMiwgXCJJbnZhbGlkIHBhcmFtcy5cIiwgZXJyb3IubWVzc2FnZSksXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGlkKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyB0aGUgLTEgdmFsdWUgaXMgXCJhcHBsaWNhdGlvbiBkZWZpbmVkXCJcbiAgICAgICAgICByZXR1cm4gY3JlYXRlSlNPTlJwY1Jlc3BvbnNlT2JqZWN0KFxuICAgICAgICAgICAgY3JlYXRlSlNPTlJwY0Vycm9yT2JqZWN0KFxuICAgICAgICAgICAgICAtMSwgXCJBcHBsaWNhdGlvbiBlcnJvci5cIiwgZXJyb3IubWVzc2FnZSksXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgaWQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhY2Nlc3MgZGVuaWVkXG4gICAgICAgIHJldHVybiAodHlwZW9mIGlkID09PSBcInVuZGVmaW5lZFwiKSA/IG51bGwgOiBjcmVhdGVKU09OUnBjUmVzcG9uc2VPYmplY3QoXG4gICAgICAgICAgY3JlYXRlSlNPTlJwY0Vycm9yT2JqZWN0KFxuICAgICAgICAgICAgLTIsIFwiQXBwbGljYXRpb24gZXJyb3IuXCIsIFwiQWNjZXNzIGRlbmllZCBvbiBzZXJ2ZXIuXCIpLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgaWQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBObyBzdWNoIG1ldGhvZFxuICAgICAgcmV0dXJuICh0eXBlb2YgaWQgPT09IFwidW5kZWZpbmVkXCIpID8gbnVsbCA6IGNyZWF0ZUpTT05ScGNSZXNwb25zZU9iamVjdChcbiAgICAgICAgY3JlYXRlSlNPTlJwY0Vycm9yT2JqZWN0KFxuICAgICAgICAgIC0zMjYwMSxcbiAgICAgICAgICBcIk1ldGhvZCBub3QgZm91bmQuXCIsXG4gICAgICAgICAgXCJUaGUgcmVxdWVzdGQgcmVtb3RlIHByb2NlZHVyZSBkb2VzIG5vdCBleGlzdCBvciBpcyBub3QgYXZhaWxhYmxlLlwiKSxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgaWQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGludGVybmFsIHJwYyBzZXJ2aWNlIHRoYXQgcmVjZWl2ZXMgcmVzcG9uc2VzIGZvciBycGMgY2FsbHNcbiAgZnVuY3Rpb24gcHJvY2Vzc0pTT05ScGNSZXNwb25zZShyZXNwb25zZSkge1xuICAgIHZhciBpZCA9IHJlc3BvbnNlLmlkO1xuICAgIHZhciBjYWxsT2JqID0gY2FsbFF1ZXVlW2lkXTtcbiAgICBpZiAodHlwZW9mIGNhbGxPYmogPT09IFwidW5kZWZpbmVkXCIgfHwgY2FsbE9iaiA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgY2FsbFF1ZXVlW2lkXTtcbiAgICB9XG5cbiAgICAvLyBjaGVjayBpZiB0aGUgY2FsbCB3YXMgc3VjZXNzZnVsIG9yIG5vdFxuICAgIGlmICh0eXBlb2YgcmVzcG9uc2UuZXJyb3IgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNhbGxPYmoub25TdWNjZXNzKHtcbiAgICAgICAgXCJkZXN0aW5hdGlvblwiICAgICAgICA6IGNhbGxPYmouZGVzdGluYXRpb24sXG4gICAgICAgIFwicHVibGljUHJvY2VkdXJlTmFtZVwiOiBjYWxsT2JqLnB1YmxpY1Byb2NlZHVyZU5hbWUsXG4gICAgICAgIFwicGFyYW1zXCIgICAgICAgICAgICAgOiBjYWxsT2JqLnBhcmFtcyxcbiAgICAgICAgXCJzdGF0dXNcIiAgICAgICAgICAgICA6IFwic3VjY2Vzc1wiLFxuICAgICAgICBcInJldHVyblZhbHVlXCIgICAgICAgIDogcmVzcG9uc2UucmVzdWx0fSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxPYmoub25FcnJvcih7XG4gICAgICAgIFwiZGVzdGluYXRpb25cIiAgICAgICAgOiBjYWxsT2JqLmRlc3RpbmF0aW9uLFxuICAgICAgICBcInB1YmxpY1Byb2NlZHVyZU5hbWVcIjogY2FsbE9iai5wdWJsaWNQcm9jZWR1cmVOYW1lLFxuICAgICAgICBcInBhcmFtc1wiICAgICAgICAgICAgIDogY2FsbE9iai5wYXJhbXMsXG4gICAgICAgIFwic3RhdHVzXCIgICAgICAgICAgICAgOiBcImVycm9yXCIsXG4gICAgICAgIFwibWVzc2FnZVwiICAgICAgICAgICAgOiByZXNwb25zZS5lcnJvci5tZXNzYWdlICsgXCIgXCIgKyByZXNwb25zZS5lcnJvci5kYXRhfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gY2FsbCByZW1vdGUgcHJvY2VkdXJlXG4gIGZ1bmN0aW9uIGNhbGwoY29uZmlnKSB7XG4gICAgLy8gY2hlY2sgdGhhdCBudW1iZXIgb2YgcmV0cmllcyBpcyBub3QgLTEsIHRoYXQgaXMgYSBzcGVjaWFsIGludGVybmFsIHZhbHVlXG4gICAgaWYgKGNvbmZpZy5yZXRyaWVzICYmIGNvbmZpZy5yZXRyaWVzIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIm51bWJlciBvZiByZXRyaWVzIG11c3QgYmUgMCBvciBoaWdoZXJcIik7XG4gICAgfVxuXG4gICAgdmFyIGRlc3RDb250ZXh0cyA9IFtdO1xuXG4gICAgaWYgKHR5cGVvZiBjb25maWcuZGVzdGluYXRpb24gPT09IFwidW5kZWZpbmVkXCIgfHwgY29uZmlnLmRlc3RpbmF0aW9uID09PSBudWxsIHx8IGNvbmZpZy5kZXN0aW5hdGlvbiA9PT0gXCJ3b3JrZXJQYXJlbnRcIikge1xuICAgICAgZGVzdENvbnRleHRzID0gW1xuICAgICAgICB7Y29udGV4dDogbnVsbCwgdHlwZTogXCJ3b3JrZXJQYXJlbnRcIn1cbiAgICAgIF07XG4gICAgfSBlbHNlIGlmIChjb25maWcuZGVzdGluYXRpb24gPT09IFwicHVibGlzaFwiKSB7XG4gICAgICBkZXN0Q29udGV4dHMgPSBmaW5kQWxsUmVhY2hhYmxlQ29udGV4dHMoKTtcbiAgICB9IGVsc2UgaWYgKGNvbmZpZy5kZXN0aW5hdGlvbiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbmZpZy5kZXN0aW5hdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoY29uZmlnLmRlc3RpbmF0aW9uW2ldID09PSBcIndvcmtlclBhcmVudFwiKSB7XG4gICAgICAgICAgZGVzdENvbnRleHRzLnB1c2goe2NvbnRleHQ6IG51bGwsIHR5cGU6IFwid29ya2VyUGFyZW50XCJ9KTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY29uZmlnLmRlc3RpbmF0aW9uW2ldLmZyYW1lcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIGRlc3RDb250ZXh0cy5wdXNoKHtjb250ZXh0OiBjb25maWcuZGVzdGluYXRpb25baV0sIHR5cGU6IFwid2luZG93XCJ9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZXN0Q29udGV4dHMucHVzaCh7Y29udGV4dDogY29uZmlnLmRlc3RpbmF0aW9uW2ldLCB0eXBlOiBcIndvcmtlclwifSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHR5cGVvZiBjb25maWcuZGVzdGluYXRpb24uZnJhbWVzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGRlc3RDb250ZXh0cy5wdXNoKHtjb250ZXh0OiBjb25maWcuZGVzdGluYXRpb24sIHR5cGU6IFwid2luZG93XCJ9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlc3RDb250ZXh0cy5wdXNoKHtjb250ZXh0OiBjb25maWcuZGVzdGluYXRpb24sIHR5cGU6IFwid29ya2VyXCJ9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc3RDb250ZXh0cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNhbGxPYmogPSB7XG4gICAgICAgIGRlc3RpbmF0aW9uICAgICAgICA6IGRlc3RDb250ZXh0c1tpXS5jb250ZXh0LFxuICAgICAgICBkZXN0aW5hdGlvbkRvbWFpbiAgOiB0eXBlb2YgY29uZmlnLmRlc3RpbmF0aW9uRG9tYWluID09PSBcInVuZGVmaW5lZFwiID9cbiAgICAgICAgICBbXCIqXCJdIDogKHR5cGVvZiBjb25maWcuZGVzdGluYXRpb25Eb21haW4gPT09IFwic3RyaW5nXCIgP1xuICAgICAgICAgIFtjb25maWcuZGVzdGluYXRpb25Eb21haW5dIDogY29uZmlnLmRlc3RpbmF0aW9uRG9tYWluKSxcbiAgICAgICAgcHVibGljUHJvY2VkdXJlTmFtZTogY29uZmlnLnB1YmxpY1Byb2NlZHVyZU5hbWUsXG4gICAgICAgIG9uU3VjY2VzcyAgICAgICAgICA6IHR5cGVvZiBjb25maWcub25TdWNjZXNzICE9PSBcInVuZGVmaW5lZFwiID9cbiAgICAgICAgICBjb25maWcub25TdWNjZXNzIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIH0sXG4gICAgICAgIG9uRXJyb3IgICAgICAgICAgICA6IHR5cGVvZiBjb25maWcub25FcnJvciAhPT0gXCJ1bmRlZmluZWRcIiA/XG4gICAgICAgICAgY29uZmlnLm9uRXJyb3IgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0cmllcyAgICAgICAgICAgIDogdHlwZW9mIGNvbmZpZy5yZXRyaWVzICE9PSBcInVuZGVmaW5lZFwiID8gY29uZmlnLnJldHJpZXMgOiA1LFxuICAgICAgICB0aW1lb3V0ICAgICAgICAgICAgOiB0eXBlb2YgY29uZmlnLnRpbWVvdXQgIT09IFwidW5kZWZpbmVkXCIgPyBjb25maWcudGltZW91dCA6IDUwMCxcbiAgICAgICAgc3RhdHVzICAgICAgICAgICAgIDogXCJyZXF1ZXN0Tm90U2VudFwiXG4gICAgICB9O1xuXG4gICAgICBpc05vdGlmaWNhdGlvbiA9IHR5cGVvZiBjb25maWcub25FcnJvciA9PT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgY29uZmlnLm9uU3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIjtcbiAgICAgIHBhcmFtcyA9ICh0eXBlb2YgY29uZmlnLnBhcmFtcyAhPT0gXCJ1bmRlZmluZWRcIikgPyBjb25maWcucGFyYW1zIDogW107XG4gICAgICBjYWxsSWQgPSBnZW5lcmF0ZVVVSUQoKTtcbiAgICAgIGNhbGxRdWV1ZVtjYWxsSWRdID0gY2FsbE9iajtcblxuICAgICAgaWYgKGlzTm90aWZpY2F0aW9uKSB7XG4gICAgICAgIGNhbGxPYmoubWVzc2FnZSA9IGNyZWF0ZUpTT05ScGNSZXF1ZXN0T2JqZWN0KFxuICAgICAgICAgIGNvbmZpZy5wdWJsaWNQcm9jZWR1cmVOYW1lLCBwYXJhbXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbE9iai5tZXNzYWdlID0gY3JlYXRlSlNPTlJwY1JlcXVlc3RPYmplY3QoXG4gICAgICAgICAgY29uZmlnLnB1YmxpY1Byb2NlZHVyZU5hbWUsIHBhcmFtcywgY2FsbElkKTtcbiAgICAgIH1cblxuICAgICAgd2FpdEFuZFNlbmRSZXF1ZXN0KGNhbGxJZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gVXNlIHRoZSBwb3N0TWVzc2FnZSBBUEkgdG8gc2VuZCBhIHBtcnBjIG1lc3NhZ2UgdG8gYSBkZXN0aW5hdGlvblxuICBmdW5jdGlvbiBzZW5kUG1ycGNNZXNzYWdlKGRlc3RpbmF0aW9uLCBtZXNzYWdlLCBhY2wpIHtcbiAgICBpZiAodHlwZW9mIGRlc3RpbmF0aW9uID09PSBcInVuZGVmaW5lZFwiIHx8IGRlc3RpbmF0aW9uID09PSBudWxsKSB7XG4gICAgICBzZWxmLnBvc3RNZXNzYWdlKGVuY29kZShtZXNzYWdlKSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVzdGluYXRpb24uZnJhbWVzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXR1cm4gZGVzdGluYXRpb24ucG9zdE1lc3NhZ2UoZW5jb2RlKG1lc3NhZ2UpLCBhY2wpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZXN0aW5hdGlvbi5wb3N0TWVzc2FnZShlbmNvZGUobWVzc2FnZSkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEV4ZWN1dGUgYSByZW1vdGUgY2FsbCBieSBmaXJzdCBwaW5naW5nIHRoZSBkZXN0aW5hdGlvbiBhbmQgYWZ0ZXJ3YXJkc1xuICAvLyBzZW5kaW5nIHRoZSByZXF1ZXN0XG4gIGZ1bmN0aW9uIHdhaXRBbmRTZW5kUmVxdWVzdChjYWxsSWQpIHtcbiAgICB2YXIgY2FsbE9iaiA9IGNhbGxRdWV1ZVtjYWxsSWRdO1xuICAgIGlmICh0eXBlb2YgY2FsbE9iaiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoY2FsbE9iai5yZXRyaWVzIDw9IC0xKSB7XG4gICAgICBwcm9jZXNzSlNPTlJwY1Jlc3BvbnNlKFxuICAgICAgICBjcmVhdGVKU09OUnBjUmVzcG9uc2VPYmplY3QoXG4gICAgICAgICAgY3JlYXRlSlNPTlJwY0Vycm9yT2JqZWN0KFxuICAgICAgICAgICAgLTQsIFwiQXBwbGljYXRpb24gZXJyb3IuXCIsIFwiRGVzdGluYXRpb24gdW5hdmFpbGFibGUuXCIpLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgY2FsbElkKSk7XG4gICAgfSBlbHNlIGlmIChjYWxsT2JqLnN0YXR1cyA9PT0gXCJyZXF1ZXN0U2VudFwiKSB7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmIChjYWxsT2JqLnJldHJpZXMgPT09IDAgfHwgY2FsbE9iai5zdGF0dXMgPT09IFwiYXZhaWxhYmxlXCIpIHtcbiAgICAgIGNhbGxPYmouc3RhdHVzID0gXCJyZXF1ZXN0U2VudFwiO1xuICAgICAgY2FsbE9iai5yZXRyaWVzID0gLTE7XG4gICAgICBjYWxsUXVldWVbY2FsbElkXSA9IGNhbGxPYmo7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxPYmouZGVzdGluYXRpb25Eb21haW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2VuZFBtcnBjTWVzc2FnZShcbiAgICAgICAgICBjYWxsT2JqLmRlc3RpbmF0aW9uLCBjYWxsT2JqLm1lc3NhZ2UsIGNhbGxPYmouZGVzdGluYXRpb25Eb21haW5baV0sIGNhbGxPYmopO1xuICAgICAgICBzZWxmLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgd2FpdEFuZFNlbmRSZXF1ZXN0KGNhbGxJZCk7XG4gICAgICAgIH0sIGNhbGxPYmoudGltZW91dCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGlmIHdlIGNhbiBwaW5nIHNvbWUgbW9yZSAtIHNlbmQgYSBuZXcgcGluZyByZXF1ZXN0XG4gICAgICBjYWxsT2JqLnN0YXR1cyA9IFwicGluZ2luZ1wiO1xuICAgICAgdmFyIHJldHJpZXMgPSBjYWxsT2JqLnJldHJpZXM7XG4gICAgICBjYWxsT2JqLnJldHJpZXMgPSByZXRyaWVzIC0gMTtcblxuICAgICAgY2FsbCh7XG4gICAgICAgIFwiZGVzdGluYXRpb25cIiAgICAgICAgOiBjYWxsT2JqLmRlc3RpbmF0aW9uLFxuICAgICAgICBcInB1YmxpY1Byb2NlZHVyZU5hbWVcIjogXCJyZWNlaXZlUGluZ1JlcXVlc3RcIixcbiAgICAgICAgXCJvblN1Y2Nlc3NcIiAgICAgICAgICA6IGZ1bmN0aW9uKGNhbGxSZXN1bHQpIHtcbiAgICAgICAgICBpZiAoY2FsbFJlc3VsdC5yZXR1cm5WYWx1ZSA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgdHlwZW9mIGNhbGxRdWV1ZVtjYWxsSWRdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY2FsbFF1ZXVlW2NhbGxJZF0uc3RhdHVzID0gXCJhdmFpbGFibGVcIjtcbiAgICAgICAgICAgIHdhaXRBbmRTZW5kUmVxdWVzdChjYWxsSWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJwYXJhbXNcIiAgICAgICAgICAgICA6IFtjYWxsT2JqLnB1YmxpY1Byb2NlZHVyZU5hbWVdLFxuICAgICAgICBcInJldHJpZXNcIiAgICAgICAgICAgIDogMCxcbiAgICAgICAgXCJkZXN0aW5hdGlvbkRvbWFpblwiICA6IGNhbGxPYmouZGVzdGluYXRpb25Eb21haW59KTtcbiAgICAgIGNhbGxRdWV1ZVtjYWxsSWRdID0gY2FsbE9iajtcbiAgICAgIHNlbGYuc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGNhbGxRdWV1ZVtjYWxsSWRdICYmIGNhbGxRdWV1ZVtjYWxsSWRdLnN0YXR1cyA9PT0gXCJwaW5naW5nXCIpIHtcbiAgICAgICAgICB3YWl0QW5kU2VuZFJlcXVlc3QoY2FsbElkKTtcbiAgICAgICAgfVxuICAgICAgfSwgY2FsbE9iai50aW1lb3V0IC8gcmV0cmllcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gYXR0YWNoIHRoZSBwbXJwYyBldmVudCBsaXN0ZW5lclxuICBmdW5jdGlvbiBhZGRDcm9zc0Jyb3dzZXJFdmVudExpc3Rlcm5lcihvYmosIGV2ZW50TmFtZSwgaGFuZGxlciwgYnViYmxlKSB7XG4gICAgaWYgKFwiYWRkRXZlbnRMaXN0ZW5lclwiIGluIG9iaikge1xuICAgICAgLy8gRkZcbiAgICAgIG9iai5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgYnViYmxlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSUVcbiAgICAgIG9iai5hdHRhY2hFdmVudChcIm9uXCIgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUhhbmRsZXIobWV0aG9kLCBzb3VyY2UsIGRlc3RpbmF0aW9uVHlwZSkge1xuICAgIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgICAgdmFyIHBhcmFtcyA9IHtldmVudDogZXZlbnQsIHNvdXJjZTogc291cmNlLCBkZXN0aW5hdGlvblR5cGU6IGRlc3RpbmF0aW9uVHlwZX07XG4gICAgICBtZXRob2QocGFyYW1zKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKCd3aW5kb3cnIGluIHRoaXMpIHtcbiAgICAvLyB3aW5kb3cgb2JqZWN0IC0gd2luZG93LXRvLXdpbmRvdyBjb21tXG4gICAgdmFyIGhhbmRsZXIgPSBjcmVhdGVIYW5kbGVyKHByb2Nlc3NQbXJwY01lc3NhZ2UsIG51bGwsIFwid2luZG93XCIpO1xuICAgIGFkZENyb3NzQnJvd3NlckV2ZW50TGlzdGVybmVyKHRoaXMsIFwibWVzc2FnZVwiLCBoYW5kbGVyLCBmYWxzZSk7XG4gIH0gZWxzZSBpZiAoJ29ubWVzc2FnZScgaW4gdGhpcykge1xuICAgIC8vIGRlZGljYXRlZCB3b3JrZXIgLSBwYXJlbnQgWCB0byB3b3JrZXIgY29tbVxuICAgIHZhciBoYW5kbGVyID0gY3JlYXRlSGFuZGxlcihwcm9jZXNzUG1ycGNNZXNzYWdlLCB0aGlzLCBcIndvcmtlclwiKTtcbiAgICBhZGRDcm9zc0Jyb3dzZXJFdmVudExpc3Rlcm5lcih0aGlzLCBcIm1lc3NhZ2VcIiwgaGFuZGxlciwgZmFsc2UpO1xuICB9IGVsc2UgaWYgKCdvbmNvbm5lY3QnIGluIHRoaXMpIHtcbiAgICAvLyBzaGFyZWQgd29ya2VyIC0gcGFyZW50IFggdG8gc2hhcmVkLXdvcmtlciBjb21tXG4gICAgdmFyIGNvbm5lY3RIYW5kbGVyID0gZnVuY3Rpb24oZSkge1xuICAgICAgLy90aGlzLnNlbmRQb3J0ID0gZS5wb3J0c1swXTtcbiAgICAgIHZhciBoYW5kbGVyID0gY3JlYXRlSGFuZGxlcihwcm9jZXNzUG1ycGNNZXNzYWdlLCBlLnBvcnRzWzBdLCBcInNoYXJlZFdvcmtlclwiKTtcbiAgICAgIGFkZENyb3NzQnJvd3NlckV2ZW50TGlzdGVybmVyKGUucG9ydHNbMF0sIFwibWVzc2FnZVwiLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICBlLnBvcnRzWzBdLnN0YXJ0KCk7XG4gICAgfTtcbiAgICBhZGRDcm9zc0Jyb3dzZXJFdmVudExpc3Rlcm5lcih0aGlzLCBcImNvbm5lY3RcIiwgY29ubmVjdEhhbmRsZXIsIGZhbHNlKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBcIlBtcnBjIG11c3QgYmUgbG9hZGVkIHdpdGhpbiBhIGJyb3dzZXIgd2luZG93IG9yIHdlYiB3b3JrZXIuXCI7XG4gIH1cblxuICAvLyBPdmVycmlkZSBXb3JrZXIgYW5kIFNoYXJlZFdvcmtlciBjb25zdHJ1Y3RvcnMgc28gdGhhdCBwbXJwYyBtYXkgcmVsYXlcbiAgLy8gbWVzc2FnZXMuIEZvciBlYWNoIG1lc3NhZ2UgcmVjZWl2ZWQgZnJvbSB0aGUgd29ya2VyLCBjYWxsIHBtcnBjIHByb2Nlc3NpbmdcbiAgLy8gbWV0aG9kLiBUaGlzIGlzIGNoaWxkIHdvcmtlciB0byBwYXJlbnQgY29tbXVuaWNhdGlvbi5cblxuICB2YXIgY3JlYXRlRGVkaWNhdGVkV29ya2VyID0gdGhpcy5Xb3JrZXI7XG4gIHRoaXMubm9uUG1ycGNXb3JrZXIgPSBjcmVhdGVEZWRpY2F0ZWRXb3JrZXI7XG4gIHZhciBjcmVhdGVTaGFyZWRXb3JrZXIgPSB0aGlzLlNoYXJlZFdvcmtlcjtcbiAgdGhpcy5ub25QbXJwY1NoYXJlZFdvcmtlciA9IGNyZWF0ZVNoYXJlZFdvcmtlcjtcblxuICB2YXIgYWxsV29ya2VycyA9IFtdO1xuXG4gIHRoaXMuV29ya2VyID0gZnVuY3Rpb24oc2NyaXB0VXJpKSB7XG4gICAgdmFyIG5ld1dvcmtlciA9IG5ldyBjcmVhdGVEZWRpY2F0ZWRXb3JrZXIoc2NyaXB0VXJpKTtcbiAgICBhbGxXb3JrZXJzLnB1c2goe2NvbnRleHQ6IG5ld1dvcmtlciwgdHlwZTogJ3dvcmtlcid9KTtcbiAgICB2YXIgaGFuZGxlciA9IGNyZWF0ZUhhbmRsZXIocHJvY2Vzc1BtcnBjTWVzc2FnZSwgbmV3V29ya2VyLCBcIndvcmtlclwiKTtcbiAgICBhZGRDcm9zc0Jyb3dzZXJFdmVudExpc3Rlcm5lcihuZXdXb3JrZXIsIFwibWVzc2FnZVwiLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgcmV0dXJuIG5ld1dvcmtlcjtcbiAgfTtcblxuICB0aGlzLlNoYXJlZFdvcmtlciA9IGZ1bmN0aW9uKHNjcmlwdFVyaSwgd29ya2VyTmFtZSkge1xuICAgIHZhciBuZXdXb3JrZXIgPSBuZXcgY3JlYXRlU2hhcmVkV29ya2VyKHNjcmlwdFVyaSwgd29ya2VyTmFtZSk7XG4gICAgYWxsV29ya2Vycy5wdXNoKHtjb250ZXh0OiBuZXdXb3JrZXIsIHR5cGU6ICdzaGFyZWRXb3JrZXInfSk7XG4gICAgdmFyIGhhbmRsZXIgPSBjcmVhdGVIYW5kbGVyKHByb2Nlc3NQbXJwY01lc3NhZ2UsIG5ld1dvcmtlci5wb3J0LCBcInNoYXJlZFdvcmtlclwiKTtcbiAgICBhZGRDcm9zc0Jyb3dzZXJFdmVudExpc3Rlcm5lcihuZXdXb3JrZXIucG9ydCwgXCJtZXNzYWdlXCIsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICBuZXdXb3JrZXIucG9zdE1lc3NhZ2UgPSBmdW5jdGlvbihtc2csIHBvcnRBcnJheSkge1xuICAgICAgcmV0dXJuIG5ld1dvcmtlci5wb3J0LnBvc3RNZXNzYWdlKG1zZywgcG9ydEFycmF5KTtcbiAgICB9O1xuICAgIG5ld1dvcmtlci5wb3J0LnN0YXJ0KCk7XG4gICAgcmV0dXJuIG5ld1dvcmtlcjtcbiAgfTtcblxuICAvLyBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIHBpbmdzIGZvciBtZXRob2RzIGFuZCByZXR1cm5zIHJlc3BvbnNlc1xuICBmdW5jdGlvbiByZWNlaXZlUGluZ1JlcXVlc3QocHVibGljUHJvY2VkdXJlTmFtZSkge1xuICAgIHJldHVybiB0eXBlb2YgZmV0Y2hSZWdpc3RlcmVkU2VydmljZShwdWJsaWNQcm9jZWR1cmVOYW1lKSAhPT0gXCJ1bmRlZmluZWRcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHN1YnNjcmliZShwYXJhbXMpIHtcbiAgICByZXR1cm4gcmVnaXN0ZXIocGFyYW1zKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVuc3Vic2NyaWJlKHBhcmFtcykge1xuICAgIHJldHVybiB1bnJlZ2lzdGVyKHBhcmFtcyk7XG4gIH1cblxuICBmdW5jdGlvbiBmaW5kQWxsV2luZG93cygpIHtcbiAgICB2YXIgYWxsV2luZG93Q29udGV4dHMgPSBbXTtcblxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgYWxsV2luZG93Q29udGV4dHMucHVzaCh7IGNvbnRleHQ6IHdpbmRvdy50b3AsIHR5cGU6ICd3aW5kb3cnIH0pO1xuXG4gICAgICAvLyB3YWxrIHRocm91Z2ggYWxsIGlmcmFtZXMsIHN0YXJ0aW5nIHdpdGggd2luZG93LnRvcFxuICAgICAgZm9yICh2YXIgaSA9IDA7IHR5cGVvZiBhbGxXaW5kb3dDb250ZXh0c1tpXSAhPT0gJ3VuZGVmaW5lZCc7IGkrKykge1xuICAgICAgICB2YXIgY3VycmVudFdpbmRvdyA9IGFsbFdpbmRvd0NvbnRleHRzW2ldO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGN1cnJlbnRXaW5kb3cuY29udGV4dC5mcmFtZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBhbGxXaW5kb3dDb250ZXh0cy5wdXNoKHtcbiAgICAgICAgICAgIGNvbnRleHQ6IGN1cnJlbnRXaW5kb3cuY29udGV4dC5mcmFtZXNbal0sXG4gICAgICAgICAgICB0eXBlICAgOiAnd2luZG93J1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGFsbFdpbmRvd0NvbnRleHRzLnB1c2goe2NvbnRleHQ6IHRoaXMsIHR5cGU6ICd3b3JrZXJQYXJlbnQnfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFsbFdpbmRvd0NvbnRleHRzO1xuICB9XG5cbiAgZnVuY3Rpb24gZmluZEFsbFdvcmtlcnMoKSB7XG4gICAgcmV0dXJuIGFsbFdvcmtlcnM7XG4gIH1cblxuICBmdW5jdGlvbiBmaW5kQWxsUmVhY2hhYmxlQ29udGV4dHMoKSB7XG4gICAgdmFyIGFsbFdpbmRvd3MgPSBmaW5kQWxsV2luZG93cygpO1xuICAgIHZhciBhbGxXb3JrZXJzID0gZmluZEFsbFdvcmtlcnMoKTtcbiAgICB2YXIgYWxsQ29udGV4dHMgPSBhbGxXaW5kb3dzLmNvbmNhdChhbGxXb3JrZXJzKTtcblxuICAgIHJldHVybiBhbGxDb250ZXh0cztcbiAgfVxuXG4gIC8vIHJlZ2lzdGVyIG1ldGhvZCBmb3IgcmVjZWl2aW5nIGFuZCByZXR1cm5pbmcgcGluZ3NcbiAgcmVnaXN0ZXIoe1xuICAgIFwicHVibGljUHJvY2VkdXJlTmFtZVwiOiBcInJlY2VpdmVQaW5nUmVxdWVzdFwiLFxuICAgIFwicHJvY2VkdXJlXCIgICAgICAgICAgOiByZWNlaXZlUGluZ1JlcXVlc3R9KTtcblxuICBmdW5jdGlvbiBnZXRSZWdpc3RlcmVkUHJvY2VkdXJlcygpIHtcbiAgICB2YXIgcmVnU3ZjcyA9IFtdO1xuICAgIHZhciBvcmlnaW4gPSB0eXBlb2YgdGhpcy5mcmFtZXMgIT09IFwidW5kZWZpbmVkXCIgPyAod2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3QgKyAod2luZG93LmxvY2F0aW9uLnBvcnQgIT09IFwiXCIgPyBcIjpcIiArIHdpbmRvdy5sb2NhdGlvbi5wb3J0IDogXCJcIikpIDogXCJcIjtcbiAgICBmb3IgKHZhciBwdWJsaWNQcm9jZWR1cmVOYW1lIGluIHJlZ2lzdGVyZWRTZXJ2aWNlcykge1xuICAgICAgaWYgKHB1YmxpY1Byb2NlZHVyZU5hbWUgaW4gcmVzZXJ2ZWRQcm9jZWR1cmVOYW1lcykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZ1N2Y3MucHVzaCh7XG4gICAgICAgICAgXCJwdWJsaWNQcm9jZWR1cmVOYW1lXCI6IHJlZ2lzdGVyZWRTZXJ2aWNlc1twdWJsaWNQcm9jZWR1cmVOYW1lXS5wdWJsaWNQcm9jZWR1cmVOYW1lLFxuICAgICAgICAgIFwiYWNsXCIgICAgICAgICAgICAgICAgOiByZWdpc3RlcmVkU2VydmljZXNbcHVibGljUHJvY2VkdXJlTmFtZV0uYWNsLFxuICAgICAgICAgIFwib3JpZ2luXCIgICAgICAgICAgICAgOiBvcmlnaW5cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZWdTdmNzO1xuICB9XG5cbiAgLy8gcmVnaXN0ZXIgbWV0aG9kIGZvciByZXR1cm5pbmcgcmVnaXN0ZXJlZCBwcm9jZWR1cmVzXG4gIHJlZ2lzdGVyKHtcbiAgICBcInB1YmxpY1Byb2NlZHVyZU5hbWVcIjogXCJnZXRSZWdpc3RlcmVkUHJvY2VkdXJlc1wiLFxuICAgIFwicHJvY2VkdXJlXCIgICAgICAgICAgOiBnZXRSZWdpc3RlcmVkUHJvY2VkdXJlc30pO1xuXG4gIGZ1bmN0aW9uIGRpc2NvdmVyKHBhcmFtcykge1xuICAgIHZhciB3aW5kb3dzRm9yRGlzY292ZXJ5ID0gbnVsbDtcblxuICAgIGlmICh0eXBlb2YgcGFyYW1zLmRlc3RpbmF0aW9uID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB3aW5kb3dzRm9yRGlzY292ZXJ5ID0gZmluZEFsbFJlYWNoYWJsZUNvbnRleHRzKCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdpbmRvd3NGb3JEaXNjb3ZlcnkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgd2luZG93c0ZvckRpc2NvdmVyeVtpXSA9IHdpbmRvd3NGb3JEaXNjb3ZlcnlbaV0uY29udGV4dDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93c0ZvckRpc2NvdmVyeSA9IHBhcmFtcy5kZXN0aW5hdGlvbjtcbiAgICB9XG4gICAgdmFyIG9yaWdpblJlZ2V4ID0gdHlwZW9mIHBhcmFtcy5vcmlnaW5SZWdleCA9PT0gXCJ1bmRlZmluZWRcIiA/XG4gICAgICBcIiguKilcIiA6IHBhcmFtcy5vcmlnaW5SZWdleDtcbiAgICB2YXIgbmFtZVJlZ2V4ID0gdHlwZW9mIHBhcmFtcy5uYW1lUmVnZXggPT09IFwidW5kZWZpbmVkXCIgP1xuICAgICAgXCIoLiopXCIgOiBwYXJhbXMubmFtZVJlZ2V4O1xuXG4gICAgdmFyIGNvdW50ZXIgPSB3aW5kb3dzRm9yRGlzY292ZXJ5Lmxlbmd0aDtcblxuICAgIHZhciBkaXNjb3ZlcmVkTWV0aG9kcyA9IFtdO1xuXG4gICAgZnVuY3Rpb24gYWRkVG9EaXNjb3ZlcmVkTWV0aG9kcyhtZXRob2RzLCBkZXN0aW5hdGlvbikge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXRob2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChtZXRob2RzW2ldLm9yaWdpbi5tYXRjaChuZXcgUmVnRXhwKG9yaWdpblJlZ2V4KSkgJiZcbiAgICAgICAgICBtZXRob2RzW2ldLnB1YmxpY1Byb2NlZHVyZU5hbWUubWF0Y2gobmV3IFJlZ0V4cChuYW1lUmVnZXgpKSkge1xuICAgICAgICAgIGRpc2NvdmVyZWRNZXRob2RzLnB1c2goe1xuICAgICAgICAgICAgcHVibGljUHJvY2VkdXJlTmFtZTogbWV0aG9kc1tpXS5wdWJsaWNQcm9jZWR1cmVOYW1lLFxuICAgICAgICAgICAgZGVzdGluYXRpb24gICAgICAgIDogZGVzdGluYXRpb24sXG4gICAgICAgICAgICBwcm9jZWR1cmVBQ0wgICAgICAgOiBtZXRob2RzW2ldLmFjbCxcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uT3JpZ2luICA6IG1ldGhvZHNbaV0ub3JpZ2luXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBwbXJwYy5jYWxsKHtcbiAgICAgIGRlc3RpbmF0aW9uICAgICAgICA6IHdpbmRvd3NGb3JEaXNjb3ZlcnksXG4gICAgICBkZXN0aW5hdGlvbkRvbWFpbiAgOiBcIipcIixcbiAgICAgIHB1YmxpY1Byb2NlZHVyZU5hbWU6IFwiZ2V0UmVnaXN0ZXJlZFByb2NlZHVyZXNcIixcbiAgICAgIG9uU3VjY2VzcyAgICAgICAgICA6IGZ1bmN0aW9uKGNhbGxSZXN1bHQpIHtcbiAgICAgICAgY291bnRlci0tO1xuICAgICAgICBhZGRUb0Rpc2NvdmVyZWRNZXRob2RzKGNhbGxSZXN1bHQucmV0dXJuVmFsdWUsIGNhbGxSZXN1bHQuZGVzdGluYXRpb24pO1xuICAgICAgICBpZiAoY291bnRlciA9PT0gMCkge1xuICAgICAgICAgIHBhcmFtcy5jYWxsYmFjayhkaXNjb3ZlcmVkTWV0aG9kcyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBvbkVycm9yICAgICAgICAgICAgOiBmdW5jdGlvbihjYWxsUmVzdWx0KSB7XG4gICAgICAgIGNvdW50ZXItLTtcbiAgICAgICAgaWYgKGNvdW50ZXIgPT09IDApIHtcbiAgICAgICAgICBwYXJhbXMuY2FsbGJhY2soZGlzY292ZXJlZE1ldGhvZHMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXNlcnZlZFByb2NlZHVyZU5hbWVzID0ge1wiZ2V0UmVnaXN0ZXJlZFByb2NlZHVyZXNcIjogbnVsbCwgXCJyZWNlaXZlUGluZ1JlcXVlc3RcIjogbnVsbH07XG5cbiAgLy8gcmV0dXJuIHB1YmxpYyBtZXRob2RzXG4gIHJldHVybiB7XG4gICAgcmVnaXN0ZXIgIDogcmVnaXN0ZXIsXG4gICAgdW5yZWdpc3RlcjogdW5yZWdpc3RlcixcbiAgICBjYWxsICAgICAgOiBjYWxsLFxuICAgIGRpc2NvdmVyICA6IGRpc2NvdmVyXG4gIH07XG59KCk7XG5cbi8vQU1EIHN1cHBwb3J0XG5pZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgZGVmaW5lKHBtcnBjKTtcbn0iLCJ2YXIgcHJvY2Vzcz1yZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIik777u/Ly8gdmltOnRzPTQ6c3RzPTQ6c3c9NDpcbi8qIVxuICpcbiAqIENvcHlyaWdodCAyMDA5LTIwMTIgS3JpcyBLb3dhbCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVFxuICogbGljZW5zZSBmb3VuZCBhdCBodHRwOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9yYXcvbWFzdGVyL0xJQ0VOU0VcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IFR5bGVyIENsb3NlXG4gKiBDb3B5cmlnaHQgMjAwNy0yMDA5IFR5bGVyIENsb3NlIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUIFggbGljZW5zZSBmb3VuZFxuICogYXQgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5odG1sXG4gKiBGb3JrZWQgYXQgcmVmX3NlbmQuanMgdmVyc2lvbjogMjAwOS0wNS0xMVxuICpcbiAqIFdpdGggcGFydHMgYnkgTWFyayBNaWxsZXJcbiAqIENvcHlyaWdodCAoQykgMjAxMSBHb29nbGUgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBoYXNTdGFja3MgPSBmYWxzZTtcbnRyeSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCk7XG59IGNhdGNoIChlKSB7XG4gICAgaGFzU3RhY2tzID0gISFlLnN0YWNrO1xufVxuXG4vLyBBbGwgY29kZSBhZnRlciB0aGlzIHBvaW50IHdpbGwgYmUgZmlsdGVyZWQgZnJvbSBzdGFjayB0cmFjZXMgcmVwb3J0ZWRcbi8vIGJ5IFEuXG52YXIgcVN0YXJ0aW5nTGluZSA9IGNhcHR1cmVMaW5lKCk7XG52YXIgcUZpbGVOYW1lO1xuXG4vLyBzaGltc1xuXG4vLyB1c2VkIGZvciBmYWxsYmFjayBpbiBcImFsbFJlc29sdmVkXCJcbnZhciBub29wID0gZnVuY3Rpb24gKCkge307XG5cbi8vIFVzZSB0aGUgZmFzdGVzdCBwb3NzaWJsZSBtZWFucyB0byBleGVjdXRlIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuXG4vLyBvZiB0aGUgZXZlbnQgbG9vcC5cbnZhciBuZXh0VGljayA9KGZ1bmN0aW9uICgpIHtcbiAgICAvLyBsaW5rZWQgbGlzdCBvZiB0YXNrcyAoc2luZ2xlLCB3aXRoIGhlYWQgbm9kZSlcbiAgICB2YXIgaGVhZCA9IHt0YXNrOiB2b2lkIDAsIG5leHQ6IG51bGx9O1xuICAgIHZhciB0YWlsID0gaGVhZDtcbiAgICB2YXIgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB2YXIgcmVxdWVzdFRpY2sgPSB2b2lkIDA7XG4gICAgdmFyIGlzTm9kZUpTID0gZmFsc2U7XG5cbiAgICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICAgICAgLyoganNoaW50IGxvb3BmdW5jOiB0cnVlICovXG5cbiAgICAgICAgd2hpbGUgKGhlYWQubmV4dCkge1xuICAgICAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcbiAgICAgICAgICAgIHZhciB0YXNrID0gaGVhZC50YXNrO1xuICAgICAgICAgICAgaGVhZC50YXNrID0gdm9pZCAwO1xuICAgICAgICAgICAgdmFyIGRvbWFpbiA9IGhlYWQuZG9tYWluO1xuXG4gICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgaGVhZC5kb21haW4gPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGFzaygpO1xuXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTm9kZUpTKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluIG5vZGUsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIGNvbnNpZGVyZWQgZmF0YWwgZXJyb3JzLlxuICAgICAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIHN5bmNocm9ub3VzbHkgdG8gaW50ZXJydXB0IGZsdXNoaW5nIVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEVuc3VyZSBjb250aW51YXRpb24gaWYgdGhlIHVuY2F1Z2h0IGV4Y2VwdGlvbiBpcyBzdXBwcmVzc2VkXG4gICAgICAgICAgICAgICAgICAgIC8vIGxpc3RlbmluZyBcInVuY2F1Z2h0RXhjZXB0aW9uXCIgZXZlbnRzIChhcyBkb21haW5zIGRvZXMpLlxuICAgICAgICAgICAgICAgICAgICAvLyBDb250aW51ZSBpbiBuZXh0IGV2ZW50IHRvIGF2b2lkIHRpY2sgcmVjdXJzaW9uLlxuICAgICAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBJbiBicm93c2VycywgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLlxuICAgICAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIHNsb3ctZG93bnMuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmbHVzaGluZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIG5leHRUaWNrID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGFpbCA9IHRhaWwubmV4dCA9IHtcbiAgICAgICAgICAgIHRhc2s6IHRhc2ssXG4gICAgICAgICAgICBkb21haW46IGlzTm9kZUpTICYmIHByb2Nlc3MuZG9tYWluLFxuICAgICAgICAgICAgbmV4dDogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSBcInVuZGVmaW5lZFwiICYmIHByb2Nlc3MubmV4dFRpY2spIHtcbiAgICAgICAgLy8gTm9kZS5qcyBiZWZvcmUgMC45LiBOb3RlIHRoYXQgc29tZSBmYWtlLU5vZGUgZW52aXJvbm1lbnRzLCBsaWtlIHRoZVxuICAgICAgICAvLyBNb2NoYSB0ZXN0IHJ1bm5lciwgaW50cm9kdWNlIGEgYHByb2Nlc3NgIGdsb2JhbCB3aXRob3V0IGEgYG5leHRUaWNrYC5cbiAgICAgICAgaXNOb2RlSlMgPSB0cnVlO1xuXG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAvLyBJbiBJRTEwLCBOb2RlLmpzIDAuOSssIG9yIGh0dHBzOi8vZ2l0aHViLmNvbS9Ob2JsZUpTL3NldEltbWVkaWF0ZVxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSBzZXRJbW1lZGlhdGUuYmluZCh3aW5kb3csIGZsdXNoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNldEltbWVkaWF0ZShmbHVzaCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBNZXNzYWdlQ2hhbm5lbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBtb2Rlcm4gYnJvd3NlcnNcbiAgICAgICAgLy8gaHR0cDovL3d3dy5ub25ibG9ja2luZy5pby8yMDExLzA2L3dpbmRvd25leHR0aWNrLmh0bWxcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgICAgLy8gQXQgbGVhc3QgU2FmYXJpIFZlcnNpb24gNi4wLjUgKDg1MzYuMzAuMSkgaW50ZXJtaXR0ZW50bHkgY2Fubm90IGNyZWF0ZVxuICAgICAgICAvLyB3b3JraW5nIG1lc3NhZ2UgcG9ydHMgdGhlIGZpcnN0IHRpbWUgYSBwYWdlIGxvYWRzLlxuICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gcmVxdWVzdFBvcnRUaWNrO1xuICAgICAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmbHVzaDtcbiAgICAgICAgICAgIGZsdXNoKCk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZXF1ZXN0UG9ydFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBPcGVyYSByZXF1aXJlcyB1cyB0byBwcm92aWRlIGEgbWVzc2FnZSBwYXlsb2FkLCByZWdhcmRsZXNzIG9mXG4gICAgICAgICAgICAvLyB3aGV0aGVyIHdlIHVzZSBpdC5cbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICByZXF1ZXN0UG9ydFRpY2soKTtcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG9sZCBicm93c2Vyc1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBuZXh0VGljaztcbn0pKCk7XG5cbi8vIEF0dGVtcHQgdG8gbWFrZSBnZW5lcmljcyBzYWZlIGluIHRoZSBmYWNlIG9mIGRvd25zdHJlYW1cbi8vIG1vZGlmaWNhdGlvbnMuXG4vLyBUaGVyZSBpcyBubyBzaXR1YXRpb24gd2hlcmUgdGhpcyBpcyBuZWNlc3NhcnkuXG4vLyBJZiB5b3UgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSwgdGhlc2UgcHJpbW9yZGlhbHMgbmVlZCB0byBiZVxuLy8gZGVlcGx5IGZyb3plbiBhbnl3YXksIGFuZCBpZiB5b3UgZG9u4oCZdCBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLFxuLy8gdGhpcyBpcyBqdXN0IHBsYWluIHBhcmFub2lkLlxuLy8gSG93ZXZlciwgdGhpcyBkb2VzIGhhdmUgdGhlIG5pY2Ugc2lkZS1lZmZlY3Qgb2YgcmVkdWNpbmcgdGhlIHNpemVcbi8vIG9mIHRoZSBjb2RlIGJ5IHJlZHVjaW5nIHguY2FsbCgpIHRvIG1lcmVseSB4KCksIGVsaW1pbmF0aW5nIG1hbnlcbi8vIGhhcmQtdG8tbWluaWZ5IGNoYXJhY3RlcnMuXG4vLyBTZWUgTWFyayBNaWxsZXLigJlzIGV4cGxhbmF0aW9uIG9mIHdoYXQgdGhpcyBkb2VzLlxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9Y29udmVudGlvbnM6c2FmZV9tZXRhX3Byb2dyYW1taW5nXG52YXIgY2FsbCA9IEZ1bmN0aW9uLmNhbGw7XG5mdW5jdGlvbiB1bmN1cnJ5VGhpcyhmKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNhbGwuYXBwbHkoZiwgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuLy8gVGhpcyBpcyBlcXVpdmFsZW50LCBidXQgc2xvd2VyOlxuLy8gdW5jdXJyeVRoaXMgPSBGdW5jdGlvbl9iaW5kLmJpbmQoRnVuY3Rpb25fYmluZC5jYWxsKTtcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3VuY3Vycnl0aGlzXG5cbnZhciBhcnJheV9zbGljZSA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5zbGljZSk7XG5cbnZhciBhcnJheV9yZWR1Y2UgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUucmVkdWNlIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgYmFzaXMpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gMCxcbiAgICAgICAgICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAvLyBjb25jZXJuaW5nIHRoZSBpbml0aWFsIHZhbHVlLCBpZiBvbmUgaXMgbm90IHByb3ZpZGVkXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAvLyBzZWVrIHRvIHRoZSBmaXJzdCB2YWx1ZSBpbiB0aGUgYXJyYXksIGFjY291bnRpbmdcbiAgICAgICAgICAgIC8vIGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCBpcyBpcyBhIHNwYXJzZSBhcnJheVxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGJhc2lzID0gdGhpc1tpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgrK2luZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAoMSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVkdWNlXG4gICAgICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgLy8gYWNjb3VudCBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgdGhlIGFycmF5IGlzIHNwYXJzZVxuICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICBiYXNpcyA9IGNhbGxiYWNrKGJhc2lzLCB0aGlzW2luZGV4XSwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYXNpcztcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfaW5kZXhPZiA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIHx8IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBub3QgYSB2ZXJ5IGdvb2Qgc2hpbSwgYnV0IGdvb2QgZW5vdWdoIGZvciBvdXIgb25lIHVzZSBvZiBpdFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzW2ldID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfbWFwID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLm1hcCB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNwKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGNvbGxlY3QgPSBbXTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHNlbGYsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgY29sbGVjdC5wdXNoKGNhbGxiYWNrLmNhbGwodGhpc3AsIHZhbHVlLCBpbmRleCwgc2VsZikpO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICByZXR1cm4gY29sbGVjdDtcbiAgICB9XG4pO1xuXG52YXIgb2JqZWN0X2NyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gKHByb3RvdHlwZSkge1xuICAgIGZ1bmN0aW9uIFR5cGUoKSB7IH1cbiAgICBUeXBlLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICByZXR1cm4gbmV3IFR5cGUoKTtcbn07XG5cbnZhciBvYmplY3RfaGFzT3duUHJvcGVydHkgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KTtcblxudmFyIG9iamVjdF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0X2hhc093blByb3BlcnR5KG9iamVjdCwga2V5KSkge1xuICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG59O1xuXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gT2JqZWN0KHZhbHVlKTtcbn1cblxuLy8gbG9uZyBzdGFjayB0cmFjZXNcblxudmFyIFNUQUNLX0pVTVBfU0VQQVJBVE9SID0gXCJGcm9tIHByZXZpb3VzIGV2ZW50OlwiO1xuXG5mdW5jdGlvbiBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpIHtcbiAgICAvLyBJZiBwb3NzaWJsZSwgdHJhbnNmb3JtIHRoZSBlcnJvciBzdGFjayB0cmFjZSBieSByZW1vdmluZyBOb2RlIGFuZCBRXG4gICAgLy8gY3J1ZnQsIHRoZW4gY29uY2F0ZW5hdGluZyB3aXRoIHRoZSBzdGFjayB0cmFjZSBvZiBgcHJvbWlzZWAuIFNlZSAjNTcuXG4gICAgaWYgKGhhc1N0YWNrcyAmJlxuICAgICAgICBwcm9taXNlLnN0YWNrICYmXG4gICAgICAgIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBlcnJvciAhPT0gbnVsbCAmJlxuICAgICAgICBlcnJvci5zdGFjayAmJlxuICAgICAgICBlcnJvci5zdGFjay5pbmRleE9mKFNUQUNLX0pVTVBfU0VQQVJBVE9SKSA9PT0gLTFcbiAgICApIHtcbiAgICAgICAgdmFyIHN0YWNrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBwID0gcHJvbWlzZTsgISFwOyBwID0gcC5zb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChwLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgc3RhY2tzLnVuc2hpZnQocC5zdGFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2tzLnVuc2hpZnQoZXJyb3Iuc3RhY2spO1xuXG4gICAgICAgIHZhciBjb25jYXRlZFN0YWNrcyA9IHN0YWNrcy5qb2luKFwiXFxuXCIgKyBTVEFDS19KVU1QX1NFUEFSQVRPUiArIFwiXFxuXCIpO1xuICAgICAgICBlcnJvci5zdGFjayA9IGZpbHRlclN0YWNrU3RyaW5nKGNvbmNhdGVkU3RhY2tzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpbHRlclN0YWNrU3RyaW5nKHN0YWNrU3RyaW5nKSB7XG4gICAgdmFyIGxpbmVzID0gc3RhY2tTdHJpbmcuc3BsaXQoXCJcXG5cIik7XG4gICAgdmFyIGRlc2lyZWRMaW5lcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTtcblxuICAgICAgICBpZiAoIWlzSW50ZXJuYWxGcmFtZShsaW5lKSAmJiAhaXNOb2RlRnJhbWUobGluZSkgJiYgbGluZSkge1xuICAgICAgICAgICAgZGVzaXJlZExpbmVzLnB1c2gobGluZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlc2lyZWRMaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBpc05vZGVGcmFtZShzdGFja0xpbmUpIHtcbiAgICByZXR1cm4gc3RhY2tMaW5lLmluZGV4T2YoXCIobW9kdWxlLmpzOlwiKSAhPT0gLTEgfHxcbiAgICAgICAgICAgc3RhY2tMaW5lLmluZGV4T2YoXCIobm9kZS5qczpcIikgIT09IC0xO1xufVxuXG5mdW5jdGlvbiBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKSB7XG4gICAgLy8gTmFtZWQgZnVuY3Rpb25zOiBcImF0IGZ1bmN0aW9uTmFtZSAoZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXIpXCJcbiAgICAvLyBJbiBJRTEwIGZ1bmN0aW9uIG5hbWUgY2FuIGhhdmUgc3BhY2VzIChcIkFub255bW91cyBmdW5jdGlvblwiKSBPX29cbiAgICB2YXIgYXR0ZW1wdDEgPSAvYXQgLisgXFwoKC4rKTooXFxkKyk6KD86XFxkKylcXCkkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQxKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDFbMV0sIE51bWJlcihhdHRlbXB0MVsyXSldO1xuICAgIH1cblxuICAgIC8vIEFub255bW91cyBmdW5jdGlvbnM6IFwiYXQgZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MiA9IC9hdCAoW14gXSspOihcXGQrKTooPzpcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDIpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MlsxXSwgTnVtYmVyKGF0dGVtcHQyWzJdKV07XG4gICAgfVxuXG4gICAgLy8gRmlyZWZveCBzdHlsZTogXCJmdW5jdGlvbkBmaWxlbmFtZTpsaW5lTnVtYmVyIG9yIEBmaWxlbmFtZTpsaW5lTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDMgPSAvLipAKC4rKTooXFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQzKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDNbMV0sIE51bWJlcihhdHRlbXB0M1syXSldO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNJbnRlcm5hbEZyYW1lKHN0YWNrTGluZSkge1xuICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKTtcblxuICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgZmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgdmFyIGxpbmVOdW1iZXIgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG5cbiAgICByZXR1cm4gZmlsZU5hbWUgPT09IHFGaWxlTmFtZSAmJlxuICAgICAgICBsaW5lTnVtYmVyID49IHFTdGFydGluZ0xpbmUgJiZcbiAgICAgICAgbGluZU51bWJlciA8PSBxRW5kaW5nTGluZTtcbn1cblxuLy8gZGlzY292ZXIgb3duIGZpbGUgbmFtZSBhbmQgbGluZSBudW1iZXIgcmFuZ2UgZm9yIGZpbHRlcmluZyBzdGFja1xuLy8gdHJhY2VzXG5mdW5jdGlvbiBjYXB0dXJlTGluZSgpIHtcbiAgICBpZiAoIWhhc1N0YWNrcykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB2YXIgbGluZXMgPSBlLnN0YWNrLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICB2YXIgZmlyc3RMaW5lID0gbGluZXNbMF0uaW5kZXhPZihcIkBcIikgPiAwID8gbGluZXNbMV0gOiBsaW5lc1syXTtcbiAgICAgICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihmaXJzdExpbmUpO1xuICAgICAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcUZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgICAgICByZXR1cm4gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVwcmVjYXRlKGNhbGxiYWNrLCBuYW1lLCBhbHRlcm5hdGl2ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgdHlwZW9mIGNvbnNvbGUud2FybiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obmFtZSArIFwiIGlzIGRlcHJlY2F0ZWQsIHVzZSBcIiArIGFsdGVybmF0aXZlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBcIiBpbnN0ZWFkLlwiLCBuZXcgRXJyb3IoXCJcIikuc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShjYWxsYmFjaywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vLyBlbmQgb2Ygc2hpbXNcbi8vIGJlZ2lubmluZyBvZiByZWFsIHdvcmtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZSwgcGFzc2VzIHByb21pc2VzIHRocm91Z2gsIG9yXG4gKiBjb2VyY2VzIHByb21pc2VzIGZyb20gZGlmZmVyZW50IHN5c3RlbXMuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZSBvciBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIFEodmFsdWUpIHtcbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGFscmVhZHkgYSBQcm9taXNlLCByZXR1cm4gaXQgZGlyZWN0bHkuICBUaGlzIGVuYWJsZXNcbiAgICAvLyB0aGUgcmVzb2x2ZSBmdW5jdGlvbiB0byBib3RoIGJlIHVzZWQgdG8gY3JlYXRlZCByZWZlcmVuY2VzIGZyb20gb2JqZWN0cyxcbiAgICAvLyBidXQgdG8gdG9sZXJhYmx5IGNvZXJjZSBub24tcHJvbWlzZXMgdG8gcHJvbWlzZXMuXG4gICAgaWYgKGlzUHJvbWlzZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8vIGFzc2ltaWxhdGUgdGhlbmFibGVzXG4gICAgaWYgKGlzUHJvbWlzZUFsaWtlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gY29lcmNlKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVsZmlsbCh2YWx1ZSk7XG4gICAgfVxufVxuUS5yZXNvbHZlID0gUTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIHRhc2sgaW4gYSBmdXR1cmUgdHVybiBvZiB0aGUgZXZlbnQgbG9vcC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHRhc2tcbiAqL1xuUS5uZXh0VGljayA9IG5leHRUaWNrO1xuXG4vKipcbiAqIENvbnRyb2xzIHdoZXRoZXIgb3Igbm90IGxvbmcgc3RhY2sgdHJhY2VzIHdpbGwgYmUgb25cbiAqL1xuUS5sb25nU3RhY2tTdXBwb3J0ID0gZmFsc2U7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHtwcm9taXNlLCByZXNvbHZlLCByZWplY3R9IG9iamVjdC5cbiAqXG4gKiBgcmVzb2x2ZWAgaXMgYSBjYWxsYmFjayB0byBpbnZva2Ugd2l0aCBhIG1vcmUgcmVzb2x2ZWQgdmFsdWUgZm9yIHRoZVxuICogcHJvbWlzZS4gVG8gZnVsZmlsbCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGFueSB2YWx1ZSB0aGF0IGlzXG4gKiBub3QgYSB0aGVuYWJsZS4gVG8gcmVqZWN0IHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYSByZWplY3RlZFxuICogdGhlbmFibGUsIG9yIGludm9rZSBgcmVqZWN0YCB3aXRoIHRoZSByZWFzb24gZGlyZWN0bHkuIFRvIHJlc29sdmUgdGhlXG4gKiBwcm9taXNlIHRvIGFub3RoZXIgdGhlbmFibGUsIHRodXMgcHV0dGluZyBpdCBpbiB0aGUgc2FtZSBzdGF0ZSwgaW52b2tlXG4gKiBgcmVzb2x2ZWAgd2l0aCB0aGF0IG90aGVyIHRoZW5hYmxlLlxuICovXG5RLmRlZmVyID0gZGVmZXI7XG5mdW5jdGlvbiBkZWZlcigpIHtcbiAgICAvLyBpZiBcIm1lc3NhZ2VzXCIgaXMgYW4gXCJBcnJheVwiLCB0aGF0IGluZGljYXRlcyB0aGF0IHRoZSBwcm9taXNlIGhhcyBub3QgeWV0XG4gICAgLy8gYmVlbiByZXNvbHZlZC4gIElmIGl0IGlzIFwidW5kZWZpbmVkXCIsIGl0IGhhcyBiZWVuIHJlc29sdmVkLiAgRWFjaFxuICAgIC8vIGVsZW1lbnQgb2YgdGhlIG1lc3NhZ2VzIGFycmF5IGlzIGl0c2VsZiBhbiBhcnJheSBvZiBjb21wbGV0ZSBhcmd1bWVudHMgdG9cbiAgICAvLyBmb3J3YXJkIHRvIHRoZSByZXNvbHZlZCBwcm9taXNlLiAgV2UgY29lcmNlIHRoZSByZXNvbHV0aW9uIHZhbHVlIHRvIGFcbiAgICAvLyBwcm9taXNlIHVzaW5nIHRoZSBgcmVzb2x2ZWAgZnVuY3Rpb24gYmVjYXVzZSBpdCBoYW5kbGVzIGJvdGggZnVsbHlcbiAgICAvLyBub24tdGhlbmFibGUgdmFsdWVzIGFuZCBvdGhlciB0aGVuYWJsZXMgZ3JhY2VmdWxseS5cbiAgICB2YXIgbWVzc2FnZXMgPSBbXSwgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSBbXSwgcmVzb2x2ZWRQcm9taXNlO1xuXG4gICAgdmFyIGRlZmVycmVkID0gb2JqZWN0X2NyZWF0ZShkZWZlci5wcm90b3R5cGUpO1xuICAgIHZhciBwcm9taXNlID0gb2JqZWN0X2NyZWF0ZShQcm9taXNlLnByb3RvdHlwZSk7XG5cbiAgICBwcm9taXNlLnByb21pc2VEaXNwYXRjaCA9IGZ1bmN0aW9uIChyZXNvbHZlLCBvcCwgb3BlcmFuZHMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2goYXJncyk7XG4gICAgICAgICAgICBpZiAob3AgPT09IFwid2hlblwiICYmIG9wZXJhbmRzWzFdKSB7IC8vIHByb2dyZXNzIG9wZXJhbmRcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVycy5wdXNoKG9wZXJhbmRzWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlZFByb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KHJlc29sdmVkUHJvbWlzZSwgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZFxuICAgIHByb21pc2UudmFsdWVPZiA9IGRlcHJlY2F0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5lYXJlclZhbHVlID0gbmVhcmVyKHJlc29sdmVkUHJvbWlzZSk7XG4gICAgICAgIGlmIChpc1Byb21pc2UobmVhcmVyVmFsdWUpKSB7XG4gICAgICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZWFyZXJWYWx1ZTsgLy8gc2hvcnRlbiBjaGFpblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZWFyZXJWYWx1ZTtcbiAgICB9LCBcInZhbHVlT2ZcIiwgXCJpbnNwZWN0XCIpO1xuXG4gICAgcHJvbWlzZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicGVuZGluZ1wiIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc29sdmVkUHJvbWlzZS5pbnNwZWN0KCk7XG4gICAgfTtcblxuICAgIGlmIChRLmxvbmdTdGFja1N1cHBvcnQgJiYgaGFzU3RhY2tzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gTk9URTogZG9uJ3QgdHJ5IHRvIHVzZSBgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2VgIG9yIHRyYW5zZmVyIHRoZVxuICAgICAgICAgICAgLy8gYWNjZXNzb3IgYXJvdW5kOyB0aGF0IGNhdXNlcyBtZW1vcnkgbGVha3MgYXMgcGVyIEdILTExMS4gSnVzdFxuICAgICAgICAgICAgLy8gcmVpZnkgdGhlIHN0YWNrIHRyYWNlIGFzIGEgc3RyaW5nIEFTQVAuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQXQgdGhlIHNhbWUgdGltZSwgY3V0IG9mZiB0aGUgZmlyc3QgbGluZTsgaXQncyBhbHdheXMganVzdFxuICAgICAgICAgICAgLy8gXCJbb2JqZWN0IFByb21pc2VdXFxuXCIsIGFzIHBlciB0aGUgYHRvU3RyaW5nYC5cbiAgICAgICAgICAgIHByb21pc2Uuc3RhY2sgPSBlLnN0YWNrLnN1YnN0cmluZyhlLnN0YWNrLmluZGV4T2YoXCJcXG5cIikgKyAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5PVEU6IHdlIGRvIHRoZSBjaGVja3MgZm9yIGByZXNvbHZlZFByb21pc2VgIGluIGVhY2ggbWV0aG9kLCBpbnN0ZWFkIG9mXG4gICAgLy8gY29uc29saWRhdGluZyB0aGVtIGludG8gYGJlY29tZWAsIHNpbmNlIG90aGVyd2lzZSB3ZSdkIGNyZWF0ZSBuZXdcbiAgICAvLyBwcm9taXNlcyB3aXRoIHRoZSBsaW5lcyBgYmVjb21lKHdoYXRldmVyKHZhbHVlKSlgLiBTZWUgZS5nLiBHSC0yNTIuXG5cbiAgICBmdW5jdGlvbiBiZWNvbWUobmV3UHJvbWlzZSkge1xuICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZXdQcm9taXNlO1xuICAgICAgICBwcm9taXNlLnNvdXJjZSA9IG5ld1Byb21pc2U7XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKG1lc3NhZ2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbmV3UHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkobmV3UHJvbWlzZSwgbWVzc2FnZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcblxuICAgICAgICBtZXNzYWdlcyA9IHZvaWQgMDtcbiAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSB2b2lkIDA7XG4gICAgfVxuXG4gICAgZGVmZXJyZWQucHJvbWlzZSA9IHByb21pc2U7XG4gICAgZGVmZXJyZWQucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUoUSh2YWx1ZSkpO1xuICAgIH07XG5cbiAgICBkZWZlcnJlZC5mdWxmaWxsID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShmdWxmaWxsKHZhbHVlKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5yZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShyZWplY3QocmVhc29uKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5ub3RpZnkgPSBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb2dyZXNzTGlzdGVuZXJzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9ncmVzc0xpc3RlbmVyKSB7XG4gICAgICAgICAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcihwcm9ncmVzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmVycmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBOb2RlLXN0eWxlIGNhbGxiYWNrIHRoYXQgd2lsbCByZXNvbHZlIG9yIHJlamVjdCB0aGUgZGVmZXJyZWRcbiAqIHByb21pc2UuXG4gKiBAcmV0dXJucyBhIG5vZGViYWNrXG4gKi9cbmRlZmVyLnByb3RvdHlwZS5tYWtlTm9kZVJlc29sdmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVycm9yLCB2YWx1ZSkge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNlbGYucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vKipcbiAqIEBwYXJhbSByZXNvbHZlciB7RnVuY3Rpb259IGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIG5vdGhpbmcgYW5kIGFjY2VwdHNcbiAqIHRoZSByZXNvbHZlLCByZWplY3QsIGFuZCBub3RpZnkgZnVuY3Rpb25zIGZvciBhIGRlZmVycmVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgbWF5IGJlIHJlc29sdmVkIHdpdGggdGhlIGdpdmVuIHJlc29sdmUgYW5kIHJlamVjdFxuICogZnVuY3Rpb25zLCBvciByZWplY3RlZCBieSBhIHRocm93biBleGNlcHRpb24gaW4gcmVzb2x2ZXJcbiAqL1xuUS5wcm9taXNlID0gcHJvbWlzZTtcbmZ1bmN0aW9uIHByb21pc2UocmVzb2x2ZXIpIHtcbiAgICBpZiAodHlwZW9mIHJlc29sdmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInJlc29sdmVyIG11c3QgYmUgYSBmdW5jdGlvbi5cIik7XG4gICAgfVxuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIoZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0LCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgIH0gY2F0Y2ggKHJlYXNvbikge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVhc29uKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbi8vIFhYWCBleHBlcmltZW50YWwuICBUaGlzIG1ldGhvZCBpcyBhIHdheSB0byBkZW5vdGUgdGhhdCBhIGxvY2FsIHZhbHVlIGlzXG4vLyBzZXJpYWxpemFibGUgYW5kIHNob3VsZCBiZSBpbW1lZGlhdGVseSBkaXNwYXRjaGVkIHRvIGEgcmVtb3RlIHVwb24gcmVxdWVzdCxcbi8vIGluc3RlYWQgb2YgcGFzc2luZyBhIHJlZmVyZW5jZS5cblEucGFzc0J5Q29weSA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5wYXNzQnlDb3B5ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vZnJlZXplKG9iamVjdCk7XG4gICAgLy9wYXNzQnlDb3BpZXMuc2V0KG9iamVjdCwgdHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIElmIHR3byBwcm9taXNlcyBldmVudHVhbGx5IGZ1bGZpbGwgdG8gdGhlIHNhbWUgdmFsdWUsIHByb21pc2VzIHRoYXQgdmFsdWUsXG4gKiBidXQgb3RoZXJ3aXNlIHJlamVjdHMuXG4gKiBAcGFyYW0geCB7QW55Kn1cbiAqIEBwYXJhbSB5IHtBbnkqfVxuICogQHJldHVybnMge0FueSp9IGEgcHJvbWlzZSBmb3IgeCBhbmQgeSBpZiB0aGV5IGFyZSB0aGUgc2FtZSwgYnV0IGEgcmVqZWN0aW9uXG4gKiBvdGhlcndpc2UuXG4gKlxuICovXG5RLmpvaW4gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiBRKHgpLmpvaW4oeSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5qb2luID0gZnVuY3Rpb24gKHRoYXQpIHtcbiAgICByZXR1cm4gUShbdGhpcywgdGhhdF0pLnNwcmVhZChmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICBpZiAoeCA9PT0geSkge1xuICAgICAgICAgICAgLy8gVE9ETzogXCI9PT1cIiBzaG91bGQgYmUgT2JqZWN0LmlzIG9yIGVxdWl2XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGpvaW46IG5vdCB0aGUgc2FtZTogXCIgKyB4ICsgXCIgXCIgKyB5KTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGZpcnN0IG9mIGFuIGFycmF5IG9mIHByb21pc2VzIHRvIGJlY29tZSBmdWxmaWxsZWQuXG4gKiBAcGFyYW0gYW5zd2VycyB7QXJyYXlbQW55Kl19IHByb21pc2VzIHRvIHJhY2VcbiAqIEByZXR1cm5zIHtBbnkqfSB0aGUgZmlyc3QgcHJvbWlzZSB0byBiZSBmdWxmaWxsZWRcbiAqL1xuUS5yYWNlID0gcmFjZTtcbmZ1bmN0aW9uIHJhY2UoYW5zd2VyUHMpIHtcbiAgICByZXR1cm4gcHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gU3dpdGNoIHRvIHRoaXMgb25jZSB3ZSBjYW4gYXNzdW1lIGF0IGxlYXN0IEVTNVxuICAgICAgICAvLyBhbnN3ZXJQcy5mb3JFYWNoKGZ1bmN0aW9uKGFuc3dlclApIHtcbiAgICAgICAgLy8gICAgIFEoYW5zd2VyUCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy8gVXNlIHRoaXMgaW4gdGhlIG1lYW50aW1lXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhbnN3ZXJQcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgUShhbnN3ZXJQc1tpXSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihRLnJhY2UpO1xufTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgUHJvbWlzZSB3aXRoIGEgcHJvbWlzZSBkZXNjcmlwdG9yIG9iamVjdCBhbmQgb3B0aW9uYWwgZmFsbGJhY2tcbiAqIGZ1bmN0aW9uLiAgVGhlIGRlc2NyaXB0b3IgY29udGFpbnMgbWV0aG9kcyBsaWtlIHdoZW4ocmVqZWN0ZWQpLCBnZXQobmFtZSksXG4gKiBzZXQobmFtZSwgdmFsdWUpLCBwb3N0KG5hbWUsIGFyZ3MpLCBhbmQgZGVsZXRlKG5hbWUpLCB3aGljaCBhbGxcbiAqIHJldHVybiBlaXRoZXIgYSB2YWx1ZSwgYSBwcm9taXNlIGZvciBhIHZhbHVlLCBvciBhIHJlamVjdGlvbi4gIFRoZSBmYWxsYmFja1xuICogYWNjZXB0cyB0aGUgb3BlcmF0aW9uIG5hbWUsIGEgcmVzb2x2ZXIsIGFuZCBhbnkgZnVydGhlciBhcmd1bWVudHMgdGhhdCB3b3VsZFxuICogaGF2ZSBiZWVuIGZvcndhcmRlZCB0byB0aGUgYXBwcm9wcmlhdGUgbWV0aG9kIGFib3ZlIGhhZCBhIG1ldGhvZCBiZWVuXG4gKiBwcm92aWRlZCB3aXRoIHRoZSBwcm9wZXIgbmFtZS4gIFRoZSBBUEkgbWFrZXMgbm8gZ3VhcmFudGVlcyBhYm91dCB0aGUgbmF0dXJlXG4gKiBvZiB0aGUgcmV0dXJuZWQgb2JqZWN0LCBhcGFydCBmcm9tIHRoYXQgaXQgaXMgdXNhYmxlIHdoZXJlZXZlciBwcm9taXNlcyBhcmVcbiAqIGJvdWdodCBhbmQgc29sZC5cbiAqL1xuUS5tYWtlUHJvbWlzZSA9IFByb21pc2U7XG5mdW5jdGlvbiBQcm9taXNlKGRlc2NyaXB0b3IsIGZhbGxiYWNrLCBpbnNwZWN0KSB7XG4gICAgaWYgKGZhbGxiYWNrID09PSB2b2lkIDApIHtcbiAgICAgICAgZmFsbGJhY2sgPSBmdW5jdGlvbiAob3ApIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIFwiUHJvbWlzZSBkb2VzIG5vdCBzdXBwb3J0IG9wZXJhdGlvbjogXCIgKyBvcFxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChpbnNwZWN0ID09PSB2b2lkIDApIHtcbiAgICAgICAgaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7c3RhdGU6IFwidW5rbm93blwifTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgcHJvbWlzZSA9IG9iamVjdF9jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpO1xuXG4gICAgcHJvbWlzZS5wcm9taXNlRGlzcGF0Y2ggPSBmdW5jdGlvbiAocmVzb2x2ZSwgb3AsIGFyZ3MpIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChkZXNjcmlwdG9yW29wXSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGRlc2NyaXB0b3Jbb3BdLmFwcGx5KHByb21pc2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxsYmFjay5jYWxsKHByb21pc2UsIG9wLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb21pc2UuaW5zcGVjdCA9IGluc3BlY3Q7XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZCBgdmFsdWVPZmAgYW5kIGBleGNlcHRpb25gIHN1cHBvcnRcbiAgICBpZiAoaW5zcGVjdCkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcInJlamVjdGVkXCIpIHtcbiAgICAgICAgICAgIHByb21pc2UuZXhjZXB0aW9uID0gaW5zcGVjdGVkLnJlYXNvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb21pc2UudmFsdWVPZiA9IGRlcHJlY2F0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHxcbiAgICAgICAgICAgICAgICBpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBcIltvYmplY3QgUHJvbWlzZV1cIjtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciBkb25lID0gZmFsc2U7ICAgLy8gZW5zdXJlIHRoZSB1bnRydXN0ZWQgcHJvbWlzZSBtYWtlcyBhdCBtb3N0IGFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbmdsZSBjYWxsIHRvIG9uZSBvZiB0aGUgY2FsbGJhY2tzXG5cbiAgICBmdW5jdGlvbiBfZnVsZmlsbGVkKHZhbHVlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGZ1bGZpbGxlZCA9PT0gXCJmdW5jdGlvblwiID8gZnVsZmlsbGVkKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yZWplY3RlZChleGNlcHRpb24pIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZWplY3RlZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBtYWtlU3RhY2tUcmFjZUxvbmcoZXhjZXB0aW9uLCBzZWxmKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkKGV4Y2VwdGlvbik7XG4gICAgICAgICAgICB9IGNhdGNoIChuZXdFeGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ld0V4Y2VwdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9wcm9ncmVzc2VkKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgcHJvZ3Jlc3NlZCA9PT0gXCJmdW5jdGlvblwiID8gcHJvZ3Jlc3NlZCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9XG5cbiAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfZnVsZmlsbGVkKHZhbHVlKSk7XG4gICAgICAgIH0sIFwid2hlblwiLCBbZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfcmVqZWN0ZWQoZXhjZXB0aW9uKSk7XG4gICAgICAgIH1dKTtcbiAgICB9KTtcblxuICAgIC8vIFByb2dyZXNzIHByb3BhZ2F0b3IgbmVlZCB0byBiZSBhdHRhY2hlZCBpbiB0aGUgY3VycmVudCB0aWNrLlxuICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKHZvaWQgMCwgXCJ3aGVuXCIsIFt2b2lkIDAsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgbmV3VmFsdWU7XG4gICAgICAgIHZhciB0aHJldyA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbmV3VmFsdWUgPSBfcHJvZ3Jlc3NlZCh2YWx1ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocmV3ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChRLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBRLm9uZXJyb3IoZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRocmV3KSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkobmV3VmFsdWUpO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVycyBhbiBvYnNlcnZlciBvbiBhIHByb21pc2UuXG4gKlxuICogR3VhcmFudGVlczpcbiAqXG4gKiAxLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBiZSBjYWxsZWQgb25seSBvbmNlLlxuICogMi4gdGhhdCBlaXRoZXIgdGhlIGZ1bGZpbGxlZCBjYWxsYmFjayBvciB0aGUgcmVqZWN0ZWQgY2FsbGJhY2sgd2lsbCBiZVxuICogICAgY2FsbGVkLCBidXQgbm90IGJvdGguXG4gKiAzLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBub3QgYmUgY2FsbGVkIGluIHRoaXMgdHVybi5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgICAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgdG8gb2JzZXJ2ZVxuICogQHBhcmFtIGZ1bGZpbGxlZCAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIGZ1bGZpbGxlZCB2YWx1ZVxuICogQHBhcmFtIHJlamVjdGVkICAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIHJlamVjdGlvbiBleGNlcHRpb25cbiAqIEBwYXJhbSBwcm9ncmVzc2VkIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBhbnkgcHJvZ3Jlc3Mgbm90aWZpY2F0aW9uc1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIGZyb20gdGhlIGludm9rZWQgY2FsbGJhY2tcbiAqL1xuUS53aGVuID0gd2hlbjtcbmZ1bmN0aW9uIHdoZW4odmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbHVlOyB9KTtcbn07XG5cblEudGhlblJlc29sdmUgPSBmdW5jdGlvbiAocHJvbWlzZSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVzb2x2ZSh2YWx1ZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuUmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKCkgeyB0aHJvdyByZWFzb247IH0pO1xufTtcblxuUS50aGVuUmVqZWN0ID0gZnVuY3Rpb24gKHByb21pc2UsIHJlYXNvbikge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRoZW5SZWplY3QocmVhc29uKTtcbn07XG5cbi8qKlxuICogSWYgYW4gb2JqZWN0IGlzIG5vdCBhIHByb21pc2UsIGl0IGlzIGFzIFwibmVhclwiIGFzIHBvc3NpYmxlLlxuICogSWYgYSBwcm9taXNlIGlzIHJlamVjdGVkLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZSB0b28uXG4gKiBJZiBpdOKAmXMgYSBmdWxmaWxsZWQgcHJvbWlzZSwgdGhlIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5lYXJlci5cbiAqIElmIGl04oCZcyBhIGRlZmVycmVkIHByb21pc2UgYW5kIHRoZSBkZWZlcnJlZCBoYXMgYmVlbiByZXNvbHZlZCwgdGhlXG4gKiByZXNvbHV0aW9uIGlzIFwibmVhcmVyXCIuXG4gKiBAcGFyYW0gb2JqZWN0XG4gKiBAcmV0dXJucyBtb3N0IHJlc29sdmVkIChuZWFyZXN0KSBmb3JtIG9mIHRoZSBvYmplY3RcbiAqL1xuXG4vLyBYWFggc2hvdWxkIHdlIHJlLWRvIHRoaXM/XG5RLm5lYXJlciA9IG5lYXJlcjtcbmZ1bmN0aW9uIG5lYXJlcih2YWx1ZSkge1xuICAgIGlmIChpc1Byb21pc2UodmFsdWUpKSB7XG4gICAgICAgIHZhciBpbnNwZWN0ZWQgPSB2YWx1ZS5pbnNwZWN0KCk7XG4gICAgICAgIGlmIChpbnNwZWN0ZWQuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnNwZWN0ZWQudmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHByb21pc2UuXG4gKiBPdGhlcndpc2UgaXQgaXMgYSBmdWxmaWxsZWQgdmFsdWUuXG4gKi9cblEuaXNQcm9taXNlID0gaXNQcm9taXNlO1xuZnVuY3Rpb24gaXNQcm9taXNlKG9iamVjdCkge1xuICAgIHJldHVybiBpc09iamVjdChvYmplY3QpICYmXG4gICAgICAgIHR5cGVvZiBvYmplY3QucHJvbWlzZURpc3BhdGNoID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgdHlwZW9mIG9iamVjdC5pbnNwZWN0ID09PSBcImZ1bmN0aW9uXCI7XG59XG5cblEuaXNQcm9taXNlQWxpa2UgPSBpc1Byb21pc2VBbGlrZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZUFsaWtlKG9iamVjdCkge1xuICAgIHJldHVybiBpc09iamVjdChvYmplY3QpICYmIHR5cGVvZiBvYmplY3QudGhlbiA9PT0gXCJmdW5jdGlvblwiO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHBlbmRpbmcgcHJvbWlzZSwgbWVhbmluZyBub3RcbiAqIGZ1bGZpbGxlZCBvciByZWplY3RlZC5cbiAqL1xuUS5pc1BlbmRpbmcgPSBpc1BlbmRpbmc7XG5mdW5jdGlvbiBpc1BlbmRpbmcob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzUHJvbWlzZShvYmplY3QpICYmIG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1BlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcInBlbmRpbmdcIjtcbn07XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgdmFsdWUgb3IgZnVsZmlsbGVkXG4gKiBwcm9taXNlLlxuICovXG5RLmlzRnVsZmlsbGVkID0gaXNGdWxmaWxsZWQ7XG5mdW5jdGlvbiBpc0Z1bGZpbGxlZChvYmplY3QpIHtcbiAgICByZXR1cm4gIWlzUHJvbWlzZShvYmplY3QpIHx8IG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzRnVsZmlsbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn07XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcmVqZWN0ZWQgcHJvbWlzZS5cbiAqL1xuUS5pc1JlamVjdGVkID0gaXNSZWplY3RlZDtcbmZ1bmN0aW9uIGlzUmVqZWN0ZWQob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzUHJvbWlzZShvYmplY3QpICYmIG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwicmVqZWN0ZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNSZWplY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicmVqZWN0ZWRcIjtcbn07XG5cbi8vLy8gQkVHSU4gVU5IQU5ETEVEIFJFSkVDVElPTiBUUkFDS0lOR1xuXG4vLyBUaGlzIHByb21pc2UgbGlicmFyeSBjb25zdW1lcyBleGNlcHRpb25zIHRocm93biBpbiBoYW5kbGVycyBzbyB0aGV5IGNhbiBiZVxuLy8gaGFuZGxlZCBieSBhIHN1YnNlcXVlbnQgcHJvbWlzZS4gIFRoZSBleGNlcHRpb25zIGdldCBhZGRlZCB0byB0aGlzIGFycmF5IHdoZW5cbi8vIHRoZXkgYXJlIGNyZWF0ZWQsIGFuZCByZW1vdmVkIHdoZW4gdGhleSBhcmUgaGFuZGxlZC4gIE5vdGUgdGhhdCBpbiBFUzYgb3Jcbi8vIHNoaW1tZWQgZW52aXJvbm1lbnRzLCB0aGlzIHdvdWxkIG5hdHVyYWxseSBiZSBhIGBTZXRgLlxudmFyIHVuaGFuZGxlZFJlYXNvbnMgPSBbXTtcbnZhciB1bmhhbmRsZWRSZWplY3Rpb25zID0gW107XG52YXIgdW5oYW5kbGVkUmVhc29uc0Rpc3BsYXllZCA9IGZhbHNlO1xudmFyIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG5mdW5jdGlvbiBkaXNwbGF5VW5oYW5kbGVkUmVhc29ucygpIHtcbiAgICBpZiAoXG4gICAgICAgICF1bmhhbmRsZWRSZWFzb25zRGlzcGxheWVkICYmXG4gICAgICAgIHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgIXdpbmRvdy5Ub3VjaCAmJlxuICAgICAgICB3aW5kb3cuY29uc29sZVxuICAgICkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbUV0gVW5oYW5kbGVkIHJlamVjdGlvbiByZWFzb25zIChzaG91bGQgYmUgZW1wdHkpOlwiLFxuICAgICAgICAgICAgICAgICAgICAgdW5oYW5kbGVkUmVhc29ucyk7XG4gICAgfVxuXG4gICAgdW5oYW5kbGVkUmVhc29uc0Rpc3BsYXllZCA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIGxvZ1VuaGFuZGxlZFJlYXNvbnMoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB1bmhhbmRsZWRSZWFzb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciByZWFzb24gPSB1bmhhbmRsZWRSZWFzb25zW2ldO1xuICAgICAgICBjb25zb2xlLndhcm4oXCJVbmhhbmRsZWQgcmVqZWN0aW9uIHJlYXNvbjpcIiwgcmVhc29uKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpIHtcbiAgICB1bmhhbmRsZWRSZWFzb25zLmxlbmd0aCA9IDA7XG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5sZW5ndGggPSAwO1xuICAgIHVuaGFuZGxlZFJlYXNvbnNEaXNwbGF5ZWQgPSBmYWxzZTtcblxuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG5cbiAgICAgICAgLy8gU2hvdyB1bmhhbmRsZWQgcmVqZWN0aW9uIHJlYXNvbnMgaWYgTm9kZSBleGl0cyB3aXRob3V0IGhhbmRsaW5nIGFuXG4gICAgICAgIC8vIG91dHN0YW5kaW5nIHJlamVjdGlvbi4gIChOb3RlIHRoYXQgQnJvd3NlcmlmeSBwcmVzZW50bHkgcHJvZHVjZXMgYVxuICAgICAgICAvLyBgcHJvY2Vzc2AgZ2xvYmFsIHdpdGhvdXQgdGhlIGBFdmVudEVtaXR0ZXJgIGBvbmAgbWV0aG9kLilcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSBcInVuZGVmaW5lZFwiICYmIHByb2Nlc3Mub24pIHtcbiAgICAgICAgICAgIHByb2Nlc3Mub24oXCJleGl0XCIsIGxvZ1VuaGFuZGxlZFJlYXNvbnMpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFja1JlamVjdGlvbihwcm9taXNlLCByZWFzb24pIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgIGlmIChyZWFzb24gJiYgdHlwZW9mIHJlYXNvbi5zdGFjayAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2gocmVhc29uLnN0YWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2goXCIobm8gc3RhY2spIFwiICsgcmVhc29uKTtcbiAgICB9XG4gICAgZGlzcGxheVVuaGFuZGxlZFJlYXNvbnMoKTtcbn1cblxuZnVuY3Rpb24gdW50cmFja1JlamVjdGlvbihwcm9taXNlKSB7XG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBhdCA9IGFycmF5X2luZGV4T2YodW5oYW5kbGVkUmVqZWN0aW9ucywgcHJvbWlzZSk7XG4gICAgaWYgKGF0ICE9PSAtMSkge1xuICAgICAgICB1bmhhbmRsZWRSZWplY3Rpb25zLnNwbGljZShhdCwgMSk7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICB9XG59XG5cblEucmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zID0gcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zO1xuXG5RLmdldFVuaGFuZGxlZFJlYXNvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gTWFrZSBhIGNvcHkgc28gdGhhdCBjb25zdW1lcnMgY2FuJ3QgaW50ZXJmZXJlIHdpdGggb3VyIGludGVybmFsIHN0YXRlLlxuICAgIHJldHVybiB1bmhhbmRsZWRSZWFzb25zLnNsaWNlKCk7XG59O1xuXG5RLnN0b3BVbmhhbmRsZWRSZWplY3Rpb25UcmFja2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2Vzcy5vbikge1xuICAgICAgICBwcm9jZXNzLnJlbW92ZUxpc3RlbmVyKFwiZXhpdFwiLCBsb2dVbmhhbmRsZWRSZWFzb25zKTtcbiAgICB9XG4gICAgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gZmFsc2U7XG59O1xuXG5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcblxuLy8vLyBFTkQgVU5IQU5ETEVEIFJFSkVDVElPTiBUUkFDS0lOR1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSByZWplY3RlZCBwcm9taXNlLlxuICogQHBhcmFtIHJlYXNvbiB2YWx1ZSBkZXNjcmliaW5nIHRoZSBmYWlsdXJlXG4gKi9cblEucmVqZWN0ID0gcmVqZWN0O1xuZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAgIHZhciByZWplY3Rpb24gPSBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgICAgICAgICAgLy8gbm90ZSB0aGF0IHRoZSBlcnJvciBoYXMgYmVlbiBoYW5kbGVkXG4gICAgICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB1bnRyYWNrUmVqZWN0aW9uKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQocmVhc29uKSA6IHRoaXM7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjaygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicmVqZWN0ZWRcIiwgcmVhc29uOiByZWFzb24gfTtcbiAgICB9KTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcmVhc29uIGhhcyBub3QgYmVlbiBoYW5kbGVkLlxuICAgIHRyYWNrUmVqZWN0aW9uKHJlamVjdGlvbiwgcmVhc29uKTtcblxuICAgIHJldHVybiByZWplY3Rpb247XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIGZ1bGZpbGxlZCBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2VcbiAqL1xuUS5mdWxmaWxsID0gZnVsZmlsbDtcbmZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0XCI6IGZ1bmN0aW9uIChuYW1lLCByaHMpIHtcbiAgICAgICAgICAgIHZhbHVlW25hbWVdID0gcmhzO1xuICAgICAgICB9LFxuICAgICAgICBcImRlbGV0ZVwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInBvc3RcIjogZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICAgICAgICAgIC8vIE1hcmsgTWlsbGVyIHByb3Bvc2VzIHRoYXQgcG9zdCB3aXRoIG5vIG5hbWUgc2hvdWxkIGFwcGx5IGFcbiAgICAgICAgICAgIC8vIHByb21pc2VkIGZ1bmN0aW9uLlxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IG51bGwgfHwgbmFtZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHZvaWQgMCwgYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYXBwbHlcIjogZnVuY3Rpb24gKHRoaXNwLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodGhpc3AsIGFyZ3MpO1xuICAgICAgICB9LFxuICAgICAgICBcImtleXNcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sIHZvaWQgMCwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwiZnVsZmlsbGVkXCIsIHZhbHVlOiB2YWx1ZSB9O1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZW5hYmxlcyB0byBRIHByb21pc2VzLlxuICogQHBhcmFtIHByb21pc2UgdGhlbmFibGUgcHJvbWlzZVxuICogQHJldHVybnMgYSBRIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gY29lcmNlKHByb21pc2UpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYW4gb2JqZWN0IHN1Y2ggdGhhdCBpdCB3aWxsIG5ldmVyIGJlXG4gKiB0cmFuc2ZlcnJlZCBhd2F5IGZyb20gdGhpcyBwcm9jZXNzIG92ZXIgYW55IHByb21pc2VcbiAqIGNvbW11bmljYXRpb24gY2hhbm5lbC5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIHByb21pc2UgYSB3cmFwcGluZyBvZiB0aGF0IG9iamVjdCB0aGF0XG4gKiBhZGRpdGlvbmFsbHkgcmVzcG9uZHMgdG8gdGhlIFwiaXNEZWZcIiBtZXNzYWdlXG4gKiB3aXRob3V0IGEgcmVqZWN0aW9uLlxuICovXG5RLm1hc3RlciA9IG1hc3RlcjtcbmZ1bmN0aW9uIG1hc3RlcihvYmplY3QpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwiaXNEZWZcIjogZnVuY3Rpb24gKCkge31cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjayhvcCwgYXJncykge1xuICAgICAgICByZXR1cm4gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncyk7XG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gUShvYmplY3QpLmluc3BlY3QoKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBTcHJlYWRzIHRoZSB2YWx1ZXMgb2YgYSBwcm9taXNlZCBhcnJheSBvZiBhcmd1bWVudHMgaW50byB0aGVcbiAqIGZ1bGZpbGxtZW50IGNhbGxiYWNrLlxuICogQHBhcmFtIGZ1bGZpbGxlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHZhcmlhZGljIGFyZ3VtZW50cyBmcm9tIHRoZVxuICogcHJvbWlzZWQgYXJyYXlcbiAqIEBwYXJhbSByZWplY3RlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHRoZSBleGNlcHRpb24gaWYgdGhlIHByb21pc2VcbiAqIGlzIHJlamVjdGVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9yIHRocm93biBleGNlcHRpb24gb2ZcbiAqIGVpdGhlciBjYWxsYmFjay5cbiAqL1xuUS5zcHJlYWQgPSBzcHJlYWQ7XG5mdW5jdGlvbiBzcHJlYWQodmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkuc3ByZWFkKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5zcHJlYWQgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLmFsbCgpLnRoZW4oZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsZWQuYXBwbHkodm9pZCAwLCBhcnJheSk7XG4gICAgfSwgcmVqZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBUaGUgYXN5bmMgZnVuY3Rpb24gaXMgYSBkZWNvcmF0b3IgZm9yIGdlbmVyYXRvciBmdW5jdGlvbnMsIHR1cm5pbmdcbiAqIHRoZW0gaW50byBhc3luY2hyb25vdXMgZ2VuZXJhdG9ycy4gIEFsdGhvdWdoIGdlbmVyYXRvcnMgYXJlIG9ubHkgcGFydFxuICogb2YgdGhlIG5ld2VzdCBFQ01BU2NyaXB0IDYgZHJhZnRzLCB0aGlzIGNvZGUgZG9lcyBub3QgY2F1c2Ugc3ludGF4XG4gKiBlcnJvcnMgaW4gb2xkZXIgZW5naW5lcy4gIFRoaXMgY29kZSBzaG91bGQgY29udGludWUgdG8gd29yayBhbmQgd2lsbFxuICogaW4gZmFjdCBpbXByb3ZlIG92ZXIgdGltZSBhcyB0aGUgbGFuZ3VhZ2UgaW1wcm92ZXMuXG4gKlxuICogRVM2IGdlbmVyYXRvcnMgYXJlIGN1cnJlbnRseSBwYXJ0IG9mIFY4IHZlcnNpb24gMy4xOSB3aXRoIHRoZVxuICogLS1oYXJtb255LWdlbmVyYXRvcnMgcnVudGltZSBmbGFnIGVuYWJsZWQuICBTcGlkZXJNb25rZXkgaGFzIGhhZCB0aGVtXG4gKiBmb3IgbG9uZ2VyLCBidXQgdW5kZXIgYW4gb2xkZXIgUHl0aG9uLWluc3BpcmVkIGZvcm0uICBUaGlzIGZ1bmN0aW9uXG4gKiB3b3JrcyBvbiBib3RoIGtpbmRzIG9mIGdlbmVyYXRvcnMuXG4gKlxuICogRGVjb3JhdGVzIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uIHN1Y2ggdGhhdDpcbiAqICAtIGl0IG1heSB5aWVsZCBwcm9taXNlc1xuICogIC0gZXhlY3V0aW9uIHdpbGwgY29udGludWUgd2hlbiB0aGF0IHByb21pc2UgaXMgZnVsZmlsbGVkXG4gKiAgLSB0aGUgdmFsdWUgb2YgdGhlIHlpZWxkIGV4cHJlc3Npb24gd2lsbCBiZSB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiAgLSBpdCByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSAod2hlbiB0aGUgZ2VuZXJhdG9yXG4gKiAgICBzdG9wcyBpdGVyYXRpbmcpXG4gKiAgLSB0aGUgZGVjb3JhdGVkIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKiAgICBvZiB0aGUgZ2VuZXJhdG9yIG9yIHRoZSBmaXJzdCByZWplY3RlZCBwcm9taXNlIGFtb25nIHRob3NlXG4gKiAgICB5aWVsZGVkLlxuICogIC0gaWYgYW4gZXJyb3IgaXMgdGhyb3duIGluIHRoZSBnZW5lcmF0b3IsIGl0IHByb3BhZ2F0ZXMgdGhyb3VnaFxuICogICAgZXZlcnkgZm9sbG93aW5nIHlpZWxkIHVudGlsIGl0IGlzIGNhdWdodCwgb3IgdW50aWwgaXQgZXNjYXBlc1xuICogICAgdGhlIGdlbmVyYXRvciBmdW5jdGlvbiBhbHRvZ2V0aGVyLCBhbmQgaXMgdHJhbnNsYXRlZCBpbnRvIGFcbiAqICAgIHJlamVjdGlvbiBmb3IgdGhlIHByb21pc2UgcmV0dXJuZWQgYnkgdGhlIGRlY29yYXRlZCBnZW5lcmF0b3IuXG4gKi9cblEuYXN5bmMgPSBhc3luYztcbmZ1bmN0aW9uIGFzeW5jKG1ha2VHZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJzZW5kXCIsIGFyZyBpcyBhIHZhbHVlXG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInRocm93XCIsIGFyZyBpcyBhbiBleGNlcHRpb25cbiAgICAgICAgZnVuY3Rpb24gY29udGludWVyKHZlcmIsIGFyZykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQudmFsdWUsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gbWFrZUdlbmVyYXRvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwibmV4dFwiKTtcbiAgICAgICAgdmFyIGVycmJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwidGhyb3dcIik7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH07XG59XG5cbi8qKlxuICogVGhlIHNwYXduIGZ1bmN0aW9uIGlzIGEgc21hbGwgd3JhcHBlciBhcm91bmQgYXN5bmMgdGhhdCBpbW1lZGlhdGVseVxuICogY2FsbHMgdGhlIGdlbmVyYXRvciBhbmQgYWxzbyBlbmRzIHRoZSBwcm9taXNlIGNoYWluLCBzbyB0aGF0IGFueVxuICogdW5oYW5kbGVkIGVycm9ycyBhcmUgdGhyb3duIGluc3RlYWQgb2YgZm9yd2FyZGVkIHRvIHRoZSBlcnJvclxuICogaGFuZGxlci4gVGhpcyBpcyB1c2VmdWwgYmVjYXVzZSBpdCdzIGV4dHJlbWVseSBjb21tb24gdG8gcnVuXG4gKiBnZW5lcmF0b3JzIGF0IHRoZSB0b3AtbGV2ZWwgdG8gd29yayB3aXRoIGxpYnJhcmllcy5cbiAqL1xuUS5zcGF3biA9IHNwYXduO1xuZnVuY3Rpb24gc3Bhd24obWFrZUdlbmVyYXRvcikge1xuICAgIFEuZG9uZShRLmFzeW5jKG1ha2VHZW5lcmF0b3IpKCkpO1xufVxuXG4vKipcbiAqIFRoZSBwcm9taXNlZCBmdW5jdGlvbiBkZWNvcmF0b3IgZW5zdXJlcyB0aGF0IGFueSBwcm9taXNlIGFyZ3VtZW50c1xuICogYXJlIHNldHRsZWQgYW5kIHBhc3NlZCBhcyB2YWx1ZXMgKGB0aGlzYCBpcyBhbHNvIHNldHRsZWQgYW5kIHBhc3NlZFxuICogYXMgYSB2YWx1ZSkuICBJdCB3aWxsIGFsc28gZW5zdXJlIHRoYXQgdGhlIHJlc3VsdCBvZiBhIGZ1bmN0aW9uIGlzXG4gKiBhbHdheXMgYSBwcm9taXNlLlxuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgYWRkID0gUS5wcm9taXNlZChmdW5jdGlvbiAoYSwgYikge1xuICogICAgIHJldHVybiBhICsgYjtcbiAqIH0pO1xuICogYWRkKFEoYSksIFEoQikpO1xuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBkZWNvcmF0ZVxuICogQHJldHVybnMge2Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgaGFzIGJlZW4gZGVjb3JhdGVkLlxuICovXG5RLnByb21pc2VkID0gcHJvbWlzZWQ7XG5mdW5jdGlvbiBwcm9taXNlZChjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzcHJlYWQoW3RoaXMsIGFsbChhcmd1bWVudHMpXSwgZnVuY3Rpb24gKHNlbGYsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBzZW5kcyBhIG1lc3NhZ2UgdG8gYSB2YWx1ZSBpbiBhIGZ1dHVyZSB0dXJuXG4gKiBAcGFyYW0gb2JqZWN0KiB0aGUgcmVjaXBpZW50XG4gKiBAcGFyYW0gb3AgdGhlIG5hbWUgb2YgdGhlIG1lc3NhZ2Ugb3BlcmF0aW9uLCBlLmcuLCBcIndoZW5cIixcbiAqIEBwYXJhbSBhcmdzIGZ1cnRoZXIgYXJndW1lbnRzIHRvIGJlIGZvcndhcmRlZCB0byB0aGUgb3BlcmF0aW9uXG4gKiBAcmV0dXJucyByZXN1bHQge1Byb21pc2V9IGEgcHJvbWlzZSBmb3IgdGhlIHJlc3VsdCBvZiB0aGUgb3BlcmF0aW9uXG4gKi9cblEuZGlzcGF0Y2ggPSBkaXNwYXRjaDtcbmZ1bmN0aW9uIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKG9wLCBhcmdzKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuZGlzcGF0Y2ggPSBmdW5jdGlvbiAob3AsIGFyZ3MpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGRlZmVycmVkLnJlc29sdmUsIG9wLCBhcmdzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBnZXRcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHByb3BlcnR5IHZhbHVlXG4gKi9cblEuZ2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3Igb2JqZWN0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIHNldFxuICogQHBhcmFtIHZhbHVlICAgICBuZXcgdmFsdWUgb2YgcHJvcGVydHlcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG4vKipcbiAqIERlbGV0ZXMgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBkZWxldGVcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLmRlbCA9IC8vIFhYWCBsZWdhY3lcblFbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbCA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gdmFsdWUgICAgIGEgdmFsdWUgdG8gcG9zdCwgdHlwaWNhbGx5IGFuIGFycmF5IG9mXG4gKiAgICAgICAgICAgICAgICAgIGludm9jYXRpb24gYXJndW1lbnRzIGZvciBwcm9taXNlcyB0aGF0XG4gKiAgICAgICAgICAgICAgICAgIGFyZSB1bHRpbWF0ZWx5IGJhY2tlZCB3aXRoIGByZXNvbHZlYCB2YWx1ZXMsXG4gKiAgICAgICAgICAgICAgICAgIGFzIG9wcG9zZWQgdG8gdGhvc2UgYmFja2VkIHdpdGggVVJMc1xuICogICAgICAgICAgICAgICAgICB3aGVyZWluIHRoZSBwb3N0ZWQgdmFsdWUgY2FuIGJlIGFueVxuICogICAgICAgICAgICAgICAgICBKU09OIHNlcmlhbGl6YWJsZSBvYmplY3QuXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuLy8gYm91bmQgbG9jYWxseSBiZWNhdXNlIGl0IGlzIHVzZWQgYnkgb3RoZXIgbWV0aG9kc1xuUS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBpbnZvY2F0aW9uIGFyZ3VtZW50c1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5RLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEuaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblByb21pc2UucHJvdG90eXBlLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gYXJncyAgICAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZhcHBseSA9IGZ1bmN0aW9uIChvYmplY3QsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmFwcGx5ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RW1widHJ5XCJdID1cblEuZmNhbGwgPSBmdW5jdGlvbiAob2JqZWN0IC8qIC4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzKV0pO1xufTtcblxuLyoqXG4gKiBCaW5kcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24sIHRyYW5zZm9ybWluZyByZXR1cm4gdmFsdWVzIGludG8gYSBmdWxmaWxsZWRcbiAqIHByb21pc2UgYW5kIHRocm93biBlcnJvcnMgaW50byBhIHJlamVjdGVkIG9uZS5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmJpbmQgPSBmdW5jdGlvbiAob2JqZWN0IC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSBRKG9iamVjdCk7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuUHJvbWlzZS5wcm90b3R5cGUuZmJpbmQgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuXG4vKipcbiAqIFJlcXVlc3RzIHRoZSBuYW1lcyBvZiB0aGUgb3duZWQgcHJvcGVydGllcyBvZiBhIHByb21pc2VkXG4gKiBvYmplY3QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBrZXlzIG9mIHRoZSBldmVudHVhbGx5IHNldHRsZWQgb2JqZWN0XG4gKi9cblEua2V5cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheS4gIElmIGFueSBvZlxuICogdGhlIHByb21pc2VzIGdldHMgcmVqZWN0ZWQsIHRoZSB3aG9sZSBhcnJheSBpcyByZWplY3RlZCBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHZhbHVlcyAob3JcbiAqIHByb21pc2VzIGZvciB2YWx1ZXMpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlc1xuICovXG4vLyBCeSBNYXJrIE1pbGxlclxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9c3RyYXdtYW46Y29uY3VycmVuY3kmcmV2PTEzMDg3NzY1MjEjYWxsZnVsZmlsbGVkXG5RLmFsbCA9IGFsbDtcbmZ1bmN0aW9uIGFsbChwcm9taXNlcykge1xuICAgIHJldHVybiB3aGVuKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgdmFyIGNvdW50RG93biA9IDA7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvbWlzZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBzbmFwc2hvdDtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBpc1Byb21pc2UocHJvbWlzZSkgJiZcbiAgICAgICAgICAgICAgICAoc25hcHNob3QgPSBwcm9taXNlLmluc3BlY3QoKSkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHNuYXBzaG90LnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICArK2NvdW50RG93bjtcbiAgICAgICAgICAgICAgICB3aGVuKFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC0tY291bnREb3duID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoeyBpbmRleDogaW5kZXgsIHZhbHVlOiBwcm9ncmVzcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIGlmIChjb3VudERvd24gPT09IDApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFsbCh0aGlzKTtcbn07XG5cbi8qKlxuICogV2FpdHMgZm9yIGFsbCBwcm9taXNlcyB0byBiZSBzZXR0bGVkLCBlaXRoZXIgZnVsZmlsbGVkIG9yXG4gKiByZWplY3RlZC4gIFRoaXMgaXMgZGlzdGluY3QgZnJvbSBgYWxsYCBzaW5jZSB0aGF0IHdvdWxkIHN0b3BcbiAqIHdhaXRpbmcgYXQgdGhlIGZpcnN0IHJlamVjdGlvbi4gIFRoZSBwcm9taXNlIHJldHVybmVkIGJ5XG4gKiBgYWxsUmVzb2x2ZWRgIHdpbGwgbmV2ZXIgYmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0gcHJvbWlzZXMgYSBwcm9taXNlIGZvciBhbiBhcnJheSAob3IgYW4gYXJyYXkpIG9mIHByb21pc2VzXG4gKiAob3IgdmFsdWVzKVxuICogQHJldHVybiBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHByb21pc2VzXG4gKi9cblEuYWxsUmVzb2x2ZWQgPSBkZXByZWNhdGUoYWxsUmVzb2x2ZWQsIFwiYWxsUmVzb2x2ZWRcIiwgXCJhbGxTZXR0bGVkXCIpO1xuZnVuY3Rpb24gYWxsUmVzb2x2ZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHByb21pc2VzID0gYXJyYXlfbWFwKHByb21pc2VzLCBRKTtcbiAgICAgICAgcmV0dXJuIHdoZW4oYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB3aGVuKHByb21pc2UsIG5vb3AsIG5vb3ApO1xuICAgICAgICB9KSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlcztcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbFJlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGxSZXNvbHZlZCh0aGlzKTtcbn07XG5cbi8qKlxuICogQHNlZSBQcm9taXNlI2FsbFNldHRsZWRcbiAqL1xuUS5hbGxTZXR0bGVkID0gYWxsU2V0dGxlZDtcbmZ1bmN0aW9uIGFsbFNldHRsZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gUShwcm9taXNlcykuYWxsU2V0dGxlZCgpO1xufVxuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGVpciBzdGF0ZXMgKGFzXG4gKiByZXR1cm5lZCBieSBgaW5zcGVjdGApIHdoZW4gdGhleSBoYXZlIGFsbCBzZXR0bGVkLlxuICogQHBhcmFtIHtBcnJheVtBbnkqXX0gdmFsdWVzIGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIHtBcnJheVtTdGF0ZV19IGFuIGFycmF5IG9mIHN0YXRlcyBmb3IgdGhlIHJlc3BlY3RpdmUgdmFsdWVzLlxuICovXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxTZXR0bGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHJldHVybiBhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcHJvbWlzZSA9IFEocHJvbWlzZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiByZWdhcmRsZXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlLmluc3BlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4ocmVnYXJkbGVzcywgcmVnYXJkbGVzcyk7XG4gICAgICAgIH0pKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2FwdHVyZXMgdGhlIGZhaWx1cmUgb2YgYSBwcm9taXNlLCBnaXZpbmcgYW4gb3BvcnR1bml0eSB0byByZWNvdmVyXG4gKiB3aXRoIGEgY2FsbGJhY2suICBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpcyBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZFxuICogcHJvbWlzZSBpcyBmdWxmaWxsZWQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gZnVsZmlsbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpZiB0aGVcbiAqIGdpdmVuIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgY2FsbGJhY2tcbiAqL1xuUS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKG9iamVjdCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGEgbGlzdGVuZXIgdGhhdCBjYW4gcmVzcG9uZCB0byBwcm9ncmVzcyBub3RpZmljYXRpb25zIGZyb20gYVxuICogcHJvbWlzZSdzIG9yaWdpbmF0aW5nIGRlZmVycmVkLiBUaGlzIGxpc3RlbmVyIHJlY2VpdmVzIHRoZSBleGFjdCBhcmd1bWVudHNcbiAqIHBhc3NlZCB0byBgYGRlZmVycmVkLm5vdGlmeWBgLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIHJlY2VpdmUgYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm5zIHRoZSBnaXZlbiBwcm9taXNlLCB1bmNoYW5nZWRcbiAqL1xuUS5wcm9ncmVzcyA9IHByb2dyZXNzO1xuZnVuY3Rpb24gcHJvZ3Jlc3Mob2JqZWN0LCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBvYnNlcnZlIHRoZSBzZXR0bGluZyBvZiBhIHByb21pc2UsXG4gKiByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIHByb21pc2UgaXMgZnVsZmlsbGVkIG9yIHJlamVjdGVkLiAgRm9yd2FyZHNcbiAqIHRoZSByZXNvbHV0aW9uIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlIHdoZW4gdGhlIGNhbGxiYWNrIGlzIGRvbmUuXG4gKiBUaGUgY2FsbGJhY2sgY2FuIHJldHVybiBhIHByb21pc2UgdG8gZGVmZXIgY29tcGxldGlvbi5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gb2JzZXJ2ZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW5cbiAqIHByb21pc2UsIHRha2VzIG5vIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2Ugd2hlblxuICogYGBmaW5gYCBpcyBkb25lLlxuICovXG5RLmZpbiA9IC8vIFhYWCBsZWdhY3lcblFbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpW1wiZmluYWxseVwiXShjYWxsYmFjayk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5maW4gPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRPRE8gYXR0ZW1wdCB0byByZWN5Y2xlIHRoZSByZWplY3Rpb24gd2l0aCBcInRoaXNcIi5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUZXJtaW5hdGVzIGEgY2hhaW4gb2YgcHJvbWlzZXMsIGZvcmNpbmcgcmVqZWN0aW9ucyB0byBiZVxuICogdGhyb3duIGFzIGV4Y2VwdGlvbnMuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgYXQgdGhlIGVuZCBvZiBhIGNoYWluIG9mIHByb21pc2VzXG4gKiBAcmV0dXJucyBub3RoaW5nXG4gKi9cblEuZG9uZSA9IGZ1bmN0aW9uIChvYmplY3QsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kb25lKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICB2YXIgb25VbmhhbmRsZWRFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAvLyBmb3J3YXJkIHRvIGEgZnV0dXJlIHR1cm4gc28gdGhhdCBgYHdoZW5gYFxuICAgICAgICAvLyBkb2VzIG5vdCBjYXRjaCBpdCBhbmQgdHVybiBpdCBpbnRvIGEgcmVqZWN0aW9uLlxuICAgICAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpO1xuICAgICAgICAgICAgaWYgKFEub25lcnJvcikge1xuICAgICAgICAgICAgICAgIFEub25lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gQXZvaWQgdW5uZWNlc3NhcnkgYG5leHRUaWNrYGluZyB2aWEgYW4gdW5uZWNlc3NhcnkgYHdoZW5gLlxuICAgIHZhciBwcm9taXNlID0gZnVsZmlsbGVkIHx8IHJlamVjdGVkIHx8IHByb2dyZXNzID9cbiAgICAgICAgdGhpcy50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSA6XG4gICAgICAgIHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2VzcyAmJiBwcm9jZXNzLmRvbWFpbikge1xuICAgICAgICBvblVuaGFuZGxlZEVycm9yID0gcHJvY2Vzcy5kb21haW4uYmluZChvblVuaGFuZGxlZEVycm9yKTtcbiAgICB9XG5cbiAgICBwcm9taXNlLnRoZW4odm9pZCAwLCBvblVuaGFuZGxlZEVycm9yKTtcbn07XG5cbi8qKlxuICogQ2F1c2VzIGEgcHJvbWlzZSB0byBiZSByZWplY3RlZCBpZiBpdCBkb2VzIG5vdCBnZXQgZnVsZmlsbGVkIGJlZm9yZVxuICogc29tZSBtaWxsaXNlY29uZHMgdGltZSBvdXQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHMgdGltZW91dFxuICogQHBhcmFtIHtTdHJpbmd9IGN1c3RvbSBlcnJvciBtZXNzYWdlIChvcHRpb25hbClcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgaWYgaXQgaXNcbiAqIGZ1bGZpbGxlZCBiZWZvcmUgdGhlIHRpbWVvdXQsIG90aGVyd2lzZSByZWplY3RlZC5cbiAqL1xuUS50aW1lb3V0ID0gZnVuY3Rpb24gKG9iamVjdCwgbXMsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRpbWVvdXQobXMsIG1lc3NhZ2UpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uIChtcywgbWVzc2FnZSkge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKG1lc3NhZ2UgfHwgXCJUaW1lZCBvdXQgYWZ0ZXIgXCIgKyBtcyArIFwiIG1zXCIpKTtcbiAgICB9LCBtcyk7XG5cbiAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICB9LCBmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9LCBkZWZlcnJlZC5ub3RpZnkpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgZ2l2ZW4gdmFsdWUgKG9yIHByb21pc2VkIHZhbHVlKSwgc29tZVxuICogbWlsbGlzZWNvbmRzIGFmdGVyIGl0IHJlc29sdmVkLiBQYXNzZXMgcmVqZWN0aW9ucyBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kc1xuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSBhZnRlciBtaWxsaXNlY29uZHNcbiAqIHRpbWUgaGFzIGVsYXBzZWQgc2luY2UgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UuXG4gKiBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSByZWplY3RzLCB0aGF0IGlzIHBhc3NlZCBpbW1lZGlhdGVseS5cbiAqL1xuUS5kZWxheSA9IGZ1bmN0aW9uIChvYmplY3QsIHRpbWVvdXQpIHtcbiAgICBpZiAodGltZW91dCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRpbWVvdXQgPSBvYmplY3Q7XG4gICAgICAgIG9iamVjdCA9IHZvaWQgMDtcbiAgICB9XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kZWxheSh0aW1lb3V0KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24gKHRpbWVvdXQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGFzIGFuIGFycmF5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKlxuICogICAgICBRLm5mYXBwbHkoRlMucmVhZEZpbGUsIFtfX2ZpbGVuYW1lXSlcbiAqICAgICAgLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqICAgICAgfSlcbiAqXG4gKi9cblEubmZhcHBseSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgYXJncykge1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZhcHBseSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogUGFzc2VzIGEgY29udGludWF0aW9uIHRvIGEgTm9kZSBmdW5jdGlvbiwgd2hpY2ggaXMgY2FsbGVkIHdpdGggdGhlIGdpdmVuXG4gKiBhcmd1bWVudHMgcHJvdmlkZWQgaW5kaXZpZHVhbGx5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmNhbGwoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpXG4gKiAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogfSlcbiAqXG4gKi9cblEubmZjYWxsID0gZnVuY3Rpb24gKGNhbGxiYWNrIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZjYWxsID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBXcmFwcyBhIE5vZGVKUyBjb250aW51YXRpb24gcGFzc2luZyBmdW5jdGlvbiBhbmQgcmV0dXJucyBhbiBlcXVpdmFsZW50XG4gKiB2ZXJzaW9uIHRoYXQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmJpbmQoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpKFwidXRmLThcIilcbiAqIC50aGVuKGNvbnNvbGUubG9nKVxuICogLmRvbmUoKVxuICovXG5RLm5mYmluZCA9XG5RLmRlbm9kZWlmeSA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIFEoY2FsbGJhY2spLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZiaW5kID1cblByb21pc2UucHJvdG90eXBlLmRlbm9kZWlmeSA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEuZGVub2RlaWZ5LmFwcGx5KHZvaWQgMCwgYXJncyk7XG59O1xuXG5RLm5iaW5kID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXNwLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIFEoYm91bmQpLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmJpbmQgPSBmdW5jdGlvbiAoLyp0aGlzcCwgLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDApO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICByZXR1cm4gUS5uYmluZC5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrIHdpdGggYSBnaXZlbiBhcnJheSBvZiBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZCBjYWxsYmFjay5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3MgYXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIG1ldGhvZDsgdGhlIGNhbGxiYWNrXG4gKiB3aWxsIGJlIHByb3ZpZGVkIGJ5IFEgYW5kIGFwcGVuZGVkIHRvIHRoZXNlIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9yIGVycm9yXG4gKi9cblEubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLm5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkubnBvc3QobmFtZSwgYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5ubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLm5wb3N0ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzIHx8IFtdKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2ssIGZvcndhcmRpbmcgdGhlIGdpdmVuIHZhcmlhZGljIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkXG4gKiBjYWxsYmFjayBhcmd1bWVudC5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSAuLi5hcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFjayB3aWxsXG4gKiBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5zZW5kID0gLy8gWFhYIEJhc2VkIG9uIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgXCJzZW5kXCJcblEubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUS5uaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5Qcm9taXNlLnByb3RvdHlwZS5ubWNhbGwgPSAvLyBYWFggQmFzZWQgb24gXCJSZWRzYW5kcm8nc1wiIHByb3Bvc2FsXG5Qcm9taXNlLnByb3RvdHlwZS5uaW52b2tlID0gZnVuY3Rpb24gKG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogSWYgYSBmdW5jdGlvbiB3b3VsZCBsaWtlIHRvIHN1cHBvcnQgYm90aCBOb2RlIGNvbnRpbnVhdGlvbi1wYXNzaW5nLXN0eWxlIGFuZFxuICogcHJvbWlzZS1yZXR1cm5pbmctc3R5bGUsIGl0IGNhbiBlbmQgaXRzIGludGVybmFsIHByb21pc2UgY2hhaW4gd2l0aFxuICogYG5vZGVpZnkobm9kZWJhY2spYCwgZm9yd2FyZGluZyB0aGUgb3B0aW9uYWwgbm9kZWJhY2sgYXJndW1lbnQuICBJZiB0aGUgdXNlclxuICogZWxlY3RzIHRvIHVzZSBhIG5vZGViYWNrLCB0aGUgcmVzdWx0IHdpbGwgYmUgc2VudCB0aGVyZS4gIElmIHRoZXkgZG8gbm90XG4gKiBwYXNzIGEgbm9kZWJhY2ssIHRoZXkgd2lsbCByZWNlaXZlIHRoZSByZXN1bHQgcHJvbWlzZS5cbiAqIEBwYXJhbSBvYmplY3QgYSByZXN1bHQgKG9yIGEgcHJvbWlzZSBmb3IgYSByZXN1bHQpXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBub2RlYmFjayBhIE5vZGUuanMtc3R5bGUgY2FsbGJhY2tcbiAqIEByZXR1cm5zIGVpdGhlciB0aGUgcHJvbWlzZSBvciBub3RoaW5nXG4gKi9cblEubm9kZWlmeSA9IG5vZGVpZnk7XG5mdW5jdGlvbiBub2RlaWZ5KG9iamVjdCwgbm9kZWJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5vZGVpZnkobm9kZWJhY2spO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKG5vZGViYWNrKSB7XG4gICAgaWYgKG5vZGViYWNrKSB7XG4gICAgICAgIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbm9kZWJhY2soZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUTtcblxuLy8gQWxsIGNvZGUgYmVmb3JlIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcy5cbnZhciBxRW5kaW5nTGluZSA9IGNhcHR1cmVMaW5lKCk7XG4iLCLvu792YXIgcSA9IHJlcXVpcmUoJy4uLy4uLy4uL3NoYXJlZC9saWIva3Jpc2tvd2FsL3EuanMnKTtcbm1vZHVsZS5leHBvcnRzID0gRWxlbWVudERlY29yYXRvcjtcblxuLyoqXG4gKiBgRWxlbWVudGAgZGVjb3JhdG9yIGNsYXNzXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgQnJvd3NlciBET00gRWxlbWVudCB0byBkZWNvcmF0ZS5cbiAqIEByZXR1cm4ge0VsZW1lbnREZWNvcmF0b3J9IGB0aGlzYCBFbGVtZW50RGVjb3JhdG9yIGluc3RhbmNlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRWxlbWVudERlY29yYXRvcihlbGVtZW50KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgYW5pbWF0aW9uUXVldWUgPSBbXVxuICAgIDtcbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblxuICAvL0RlbGVnYXRlIHNlbGVjdCBtZXRob2RzIGRpcmVjdGx5IHRvIGB0aGlzLmVsZW1lbnRgXG4gIFsncmVtb3ZlJ11cbiAgICAuZm9yRWFjaChmdW5jdGlvbihmdW5jdGlvbk5hbWUpIHtcbiAgICAgIHNlbGZbZnVuY3Rpb25OYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBwYXJhbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoYXJndW1lbnRzKTtcbiAgICAgICAgc2VsZi5lbGVtZW50W2Z1bmN0aW9uTmFtZV0uYXBwbHkoc2VsZi5lbGVtZW50LCBwYXJhbXMpXG4gICAgICB9XG4gICAgfSk7XG5cbiAgLyoqXG4gICAqIERlbGVnYXRlcyB0byBzZXRBdHRyc1xuICAgKiBAcGFyYW0ge29iamVjdH0gYXR0cnMgaS5lLiB7aWQ6ICdlbGVtZW50LWlkJywgc3JjOiAnaHR0cDovLy4uJ31cbiAgICogQHJldHVybiB7RWxlbWVudERlY29yYXRvcn0gYHRoaXNgIEVsZW1lbnREZWNvcmF0b3IgaW5zdGFuY2VcbiAgICovXG4gIHRoaXMuYXR0ciA9IGZ1bmN0aW9uKGF0dHJzKSB7XG4gICAgc2V0QXR0cnMoYXR0cnMsIHRoaXMuZWxlbWVudCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIFxuICB0aGlzLmF0dHJzID0gdGhpcy5hdHRyO1xuXG4gIC8qKlxuICAgKiBEZWxlZ2F0ZXMgdG8gc2V0Q3NzIG9yIGdldENzcyBkZXBlbmRpbmcgb24gYXJndW1lbnQgdHlwZVxuICAgKiBAcGFyYW0ge29iamVjdHxhcnJheX0gY3NzIGkuZS4ge2JvcmRlcjogJzFweCBzb2xpZCByZWQnLCBwYWRkaW5nOiAnMTBweCd9XG4gICAqIEByZXR1cm4ge0VsZW1lbnREZWNvcmF0b3J8b2JqZWN0fSBgdGhpc2AgRWxlbWVudERlY29yYXRvciBpbnN0YW5jZVxuICAgKi9cbiAgdGhpcy5jc3MgPSBmdW5jdGlvbihjc3MpIHtcbiAgICBpZiAoY3NzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIHJldHVybiBnZXRDb21wdXRlZENzcyhjc3MsIHRoaXMuZWxlbWVudClcbiAgICB9XG4gICAgc2V0Q3NzKGNzcywgdGhpcy5lbGVtZW50KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogSW5zZXJ0L21vdmUgcGFzc2VkIGBlbGVtZW50YCBhZnRlciBgdGhpcy5lbGVtZW50YCBhcyBhIHNpYmxpbmdcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IEJyb3dzZXIgRE9NIEVsZW1lbnRcbiAgICogQHJldHVybiB7RWxlbWVudERlY29yYXRvcn0gYHRoaXNgIEVsZW1lbnREZWNvcmF0b3IgaW5zdGFuY2VcbiAgICovXG4vLyAgdGhpcy5hZnRlciA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbi8vICAgIHZhciBlbGVtZW50ID0gZWxlbWVudCBpbnN0YW5jZW9mKEVsZW1lbnREZWNvcmF0b3IpXG4vLyAgICAgICAgPyBlbGVtZW50LmVsZW1lbnRcbi8vICAgICAgICA6IGVsZW1lbnRcbi8vICAgICAgO1xuLy8gICAgXG4vLyAgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnQgYHRoaXMuZWxlbWVudGAgYmVmb3JlIHBhc3NlZCBgdGFyZ2V0YCBFbGVtZW50XG4gICAqICAgIChvciBFbGVtZW50RGVjb3JhdG9yJ3MgZWxlbWVudClcbiAgICogQHBhcmFtIHtFbGVtZW50fEVsZW1lbnREZWNvcmF0b3J9IHRhcmdldCBFbGVtZW50IHRvIHB1dCBgdGhpcy5lbGVtZW50YCBiZWZvcmVcbiAgICogQHJldHVybiB7RWxlbWVudERlY29yYXRvcn0gYHRoaXNgIEVsZW1lbnREZWNvcmF0b3IgaW5zdGFuY2VcbiAgICovXG4gIHRoaXMuaW5zZXJ0QmVmb3JlID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0IGluc3RhbmNlb2YgRWxlbWVudERlY29yYXRvclxuICAgICAgPyB0YXJnZXQuZWxlbWVudFxuICAgICAgOiB0YXJnZXRcbiAgICA7XG4gICAgdGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRoaXMuZWxlbWVudCwgdGFyZ2V0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQXBwZW5kIHRoZSBwYXNzZWQgRWxlbWVudCBvciBFbGVtZW50RGVjb3JhdG9yIHRvIGB0aGlzLmVsZW1lbnRgXG4gICAqIEBwYXJhbSB7RWxlbWVudHxFbGVtZW50RGVjb3JhdG9yfSBlbGVtZW50IEhUTUwgRE9NIEVsZW1lbnQgb3JcbiAgICogICAgRWxlbWVudERlY29yYXRvciBpbnN0YW5jZVxuICAgKiBAcmV0dXJuIHtFbGVtZW50RGVjb3JhdG9yfSBgdGhpc2AgRWxlbWVudERlY29yYXRvciBpbnN0YW5jZVxuICAgKi9cbiAgdGhpcy5hcHBlbmQgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgZWxlbWVudCA9IGVsZW1lbnQgaW5zdGFuY2VvZiBFbGVtZW50RGVjb3JhdG9yXG4gICAgICA/IGVsZW1lbnQuZWxlbWVudFxuICAgICAgOiBlbGVtZW50XG4gICAgO1xuICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQXBwZW5kIHRoZSBgdGhpcy5lbGVtZW50YCB0byBwYXNzZWQgRWxlbWVudCBvciBFbGVtZW50RGVjb3JhdG9yXG4gICAqIEBwYXJhbSB7RWxlbWVudHxFbGVtZW50RGVjb3JhdG9yfSBlbGVtZW50IEhUTUwgRE9NIEVsZW1lbnQgb3JcbiAgICogICAgRWxlbWVudERlY29yYXRvciBpbnN0YW5jZVxuICAgKiBAcmV0dXJuIHtFbGVtZW50RGVjb3JhdG9yfSBgdGhpc2AgRWxlbWVudERlY29yYXRvciBpbnN0YW5jZVxuICAgKi9cbiAgdGhpcy5hcHBlbmRUbyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50ID0gZWxlbWVudCBpbnN0YW5jZW9mIEVsZW1lbnREZWNvcmF0b3JcbiAgICAgID8gZWxlbWVudC5lbGVtZW50XG4gICAgICA6IGVsZW1lbnRcbiAgICA7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG5cbiAgdGhpcy5hbmltYXRlID0gZnVuY3Rpb24ocHJvcGVydGllcywgZHVyYXRpb24pIHtcbiAgICBkdXJhdGlvbiA9IGR1cmF0aW9uIHx8ICcyMDBtcyc7XG4gICAgdmFyIGxhc3RJblF1ZXVlID0gYW5pbWF0aW9uUXVldWVbYW5pbWF0aW9uUXVldWUubGVuZ3RoIC0gMV07XG5cbiAgICByZXR1cm4gbGFzdEluUXVldWVcbiAgICAgID8gbGFzdEluUXVldWUudGhlbihhbmltYXRlKVxuICAgICAgOiBhbmltYXRlKClcbiAgICAgIDtcblxuICAgIC8vVE9ETzogbWFrZSB0aGlzIHdvcmsgd2l0aCBkZWNpbWFsIGR1cmF0aW9ucyEhIGUuZy4gYDEuMTVzYFxuICAgIGZ1bmN0aW9uIGFuaW1hdGUoKSB7XG4gICAgICB2YXIgb3JpZ2luYWxUcmFuc2l0aW9uID0gc2VsZi5lbGVtZW50LnN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3RyYW5zaXRpb24nKSB8fCAnJ1xuICAgICAgICAsIHRyYW5zaXRpb25zID0gb3JpZ2luYWxUcmFuc2l0aW9uLnNwbGl0KCcsICcpXG4gICAgICAgICwgZGVmZXJyZWQgPSBxLmRlZmVyKClcbiAgICAgICAgLCBwcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZVxuICAgICAgICAsIGR1cmF0aW9uTWF0Y2ggPSBkdXJhdGlvbi5tYXRjaCgvKFxcZCspKG0pP3MvKVxuICAgICAgICA7XG5cbiAgICAgIGFuaW1hdGlvblF1ZXVlLnB1c2gocHJvbWlzZSk7XG5cbiAgICAgIC8vYHRyYW5zaXRpb25gIHByb3BlcnR5IHRlc3RlZCBhbmQgd29ya2luZyBvbjpcbiAgICAgIC8vICBDaHJvbWUgMzAuMC4xNTk5LjEwMVxuICAgICAgLy8gIEZpcmVmb3ggMjQuMFxuICAgICAgLy8gIFNhZmFyaSA3LjAgKDk1MzcuNzEpXG4gICAgICAvLyAgKG5vIG5lZWQgZm9yIC1tb3otdHJhbnNpdGlvbiwgZXRjLilcbiAgICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24ocHJvcGVydHkpIHtcbiAgICAgICAgaWYgKHRyYW5zaXRpb25zWzBdICE9PSAnJykge1xuICAgICAgICAgIHZhciBpbmNsdWRlZCA9IHRyYW5zaXRpb25zLnNvbWUoZnVuY3Rpb24odHJhbnNpdGlvbikge1xuICAgICAgICAgICAgdmFyIHRyYW5zaXRpb25Qcm9wZXJ0eSA9IHRyYW5zaXRpb24uc3BsaXQoJyAnKVswXTtcbiAgICAgICAgICAgIHJldHVybiB0cmFuc2l0aW9uUHJvcGVydHkgPT09IHByb3BlcnR5XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKCFpbmNsdWRlZCkgdHJhbnNpdGlvbnMucHVzaChwcm9wZXJ0eSArICcgJyArIGR1cmF0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cmFuc2l0aW9ucy5zaGlmdCgpO1xuICAgICAgICAgIHRyYW5zaXRpb25zLnB1c2gocHJvcGVydHkgKyAnICcgKyBkdXJhdGlvbilcbiAgICAgICAgfVxuXG4gICAgICB9KTtcbi8vICAgICAgc2VsZi5lbGVtZW50LnN0eWxlLnRyYW5zaXRpb24gPSB0cmFuc2l0aW9ucy5qb2luKCcsICcpO1xuICAgICAgc2VsZi5jc3Moe3RyYW5zaXRpb246IHRyYW5zaXRpb25zLmpvaW4oJywgJyl9KTtcbiAgICAgIHNlbGYuY3NzKHByb3BlcnRpZXMpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuLy8gICAgICAgIHNlbGYuZWxlbWVudC5zdHlsZS50cmFuc2l0aW9uID0gb3JpZ2luYWxUcmFuc2l0aW9uO1xuICAgICAgICBzZWxmLmNzcyh7dHJhbnNpdGlvbjogb3JpZ2luYWxUcmFuc2l0aW9ufSk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUodHJ1ZSk7XG4gICAgICAgIHZhciBvbGRQcm9taXNlID0gYW5pbWF0aW9uUXVldWUuc3BsaWNlKGFuaW1hdGlvblF1ZXVlLmxhc3RJbmRleE9mKHByb21pc2UpLCAxKVswXTtcbiAgICAgICAgaWYgKG9sZFByb21pc2UgIT09IHByb21pc2UgJiYgIW9sZFByb21pc2UuaXNQZW5kaW5nKCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb21pc2VzIGRpZG5cXCd0IG1hdGNoIG9yIG9sZFByb21pc2UgaXMgc3RpbGwgcGVuZGluZyEnKVxuICAgICAgICB9XG4gICAgICB9LCBkdXJhdGlvbk1hdGNoWzJdID8gcGFyc2VJbnQoZHVyYXRpb25NYXRjaFsxXSwgMTApIDogKHBhcnNlSW50KGR1cmF0aW9uTWF0Y2hbMV0sIDEwKSAqIDEwMDApKTtcblxuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBTZXQgYSBjc3MgdHJhbnNpdGlvbiBvbiBvcGFjaXR5ICh1bmxlc3MgaXQgZXhpc3RzIGFscmVhZHkpXG4gICAqICAgIHdpdGggYSBkdXJhdGlvbiAod2l0aCBtZWFzdXJlbWVudCBpLmUuICdtcycgb3IgJ3MnKSBlcXVhbFxuICAgKiAgICB0byB0aGUgYXJndW1lbnQgKG9yIDIwMG1zIGJ5IGRlZmF1bHQpLiBUaGVuIHNldCB2aXNpYmlsaXR5IHRvXG4gICAqICAgIHZpc2libGUgYW5kIG9wYWNpdHkgdG8gMS4gV2FpdCB0aGUgZHVyYXRpb24gYW5kIGZpbmFsbHksXG4gICAqICAgIHJlbW92ZSB0aGUgdHJhbnNpdGlvbiAodW5sZXNzIGl0IHdhcyBwcmUtZXhpc3RpbmcpLlxuICAgKlxuICAgKiAgICBOT1RFOiB0aGlzIGRvZXMgbm90IHByZXZlbnQgdGhlIGVsZW1lbnQgZnJvbSB0YWtpbmcgdXAgL1xuICAgKiAgICBibG9ja2luZyBvdXQgc3BhY2UuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkdXJhdGlvbiBEdXJhdGlvbiB0byBwdXQgb24gQ1NTIHRyYW5zaXRpb25cbiAgICovXG4gIHRoaXMuZmFkZUluID0gZnVuY3Rpb24oZHVyYXRpb24pIHtcbi8vICAgIHRoaXMuZWxlbWVudC5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgIHRoaXMuY3NzKHt2aXNpYmlsaXR5OiAndmlzaWJsZSd9KTtcbiAgICByZXR1cm4gdGhpcy5hbmltYXRlKHtvcGFjaXR5OiAxfSwgZHVyYXRpb24pXG4gIH07XG5cbiAgLyoqXG4gICAqIFNldCBhIGNzcyB0cmFuc2l0aW9uIG9uIG9wYWNpdHkgKHVubGVzcyBpdCBleGlzdHMgYWxyZWFkeSlcbiAgICogICAgd2l0aCBhIGR1cmF0aW9uICh3aXRoIG1lYXN1cmVtZW50IGkuZS4gJ21zJyBvciAncycpIGVxdWFsXG4gICAqICAgIHRvIHRoZSBhcmd1bWVudCAob3IgMjAwbXMgYnkgZGVmYXVsdCkuIFRoZW4gc2V0IG9wYWNpdHkgdG8gMC5cbiAgICogICAgV2FpdCB0aGUgZHVyYXRpb24gYW5kIGZpbmFsbHksIHJlbW92ZSB0aGUgdHJhbnNpdGlvbiAodW5sZXNzXG4gICAqICAgIGl0IHdhcyBwcmUtZXhpc3RpbmcpIGFuZCBzZXQgdmlzaWJpbGl0eSB0byBoaWRkZW4uXG4gICAqXG4gICAqICAgIE5PVEU6IHRoaXMgZG9lcyBub3QgcHJldmVudCB0aGUgZWxlbWVudCBmcm9tIHRha2luZyB1cCAvXG4gICAqICAgIGJsb2NraW5nIG91dCBzcGFjZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGR1cmF0aW9uIER1cmF0aW9uIHRvIHB1dCBvbiBDU1MgdHJhbnNpdGlvblxuICAgKi9cbiAgdGhpcy5mYWRlT3V0ID0gZnVuY3Rpb24oZHVyYXRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5hbmltYXRlKHtvcGFjaXR5OiAwfSwgZHVyYXRpb24pXG4gICAgICAudGhlbihmdW5jdGlvbigpIHtcbi8vICAgICAgICBzZWxmLmVsZW1lbnQuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nXG4gICAgICAgIHNlbGYuY3NzKHt2aXNpYmlsaXR5OiAnaGlkZGVuJ30pXG4gICAgICB9KVxuICB9O1xufVxuXG4vKipcbiAqIFNldCBlbGVtZW50IGF0dHJpYnV0ZXNcbiAqIEBwYXJhbSB7b2JqZWN0fSBhdHRycyBpLmUuIHtpZDogJ2VsZW1lbnQtaWQnLCBzcmM6ICdodHRwOi8vLi4nfVxuICovXG5mdW5jdGlvbiBzZXRBdHRycyhhdHRycywgZWxlbWVudCkge1xuICBPYmplY3Qua2V5cyhhdHRycykuZm9yRWFjaChmdW5jdGlvbihhdHRyTmFtZSkge1xuICAgIGVsZW1lbnRbYXR0ck5hbWVdID0gYXR0cnNbYXR0ck5hbWVdO1xuICB9KTtcbn1cblxuLyoqXG4gKiBTZXQgZWxlbWVudCBjc3MgcHJvcGVydGllcyAodmlhIHN0eWxlIGF0dHIpXG4gKiBAcGFyYW0ge29iamVjdH0gY3NzIGkuZS4ge2JvcmRlcjogJzFweCBzb2xpZCByZWQnLCBwYWRkaW5nOiAnMTBweCd9XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgSFRNTCBET00gRWxlbWVudFxuICovXG5mdW5jdGlvbiBzZXRDc3MoY3NzLCBlbGVtZW50KSB7XG4gIE9iamVjdC5rZXlzKGNzcykuZm9yRWFjaChmdW5jdGlvbihhdHRyTmFtZSkge1xuICAgIGVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoYXR0ck5hbWUsIGNzc1thdHRyTmFtZV0pO1xuICB9KTtcbn1cblxuLyoqXG4gKiBHZXQgY29tcHV0ZWQgY3NzIHByb3BlcnR5IHZhbHVlcyBmb3IgdGhlIHBhc3NlZCBwcm9wZXJ0eSBuYW1lcyBhcnJheVxuICogQHBhcmFtIHthcnJheX0gcHJvcGVydHlOYW1lcyBBcnJheSBvZiBjc3MgcHJvcGVydHkgbmFtZXNcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBIVE1MIERvbSBFbGVtZW50IG9uIHdoaWNoIHRoZSBwcm9wZXJ0aWVzXG4gKiAgIGFyZSB0byBiZSByZXRyaWV2ZWRcbiAqIEByZXR1cm4ge29iamVjdH0gT2JqZWN0IG9mIGNzcyBwcm9wZXJ0eSBuYW1lcyBhbmQgdmFsdWVzXG4gKiAgICh1c2FibGUgd2l0aCAuY3NzIGZ1bmN0aW9uIGZvciBzZXR0aW5nIHRvIHRoZSByZXRyaWV2ZWQgdmFsdWVzKVxuICovXG5mdW5jdGlvbiBnZXRDb21wdXRlZENzcyhwcm9wZXJ0eU5hbWVzLCBlbGVtZW50KSB7XG4gIHZhciBwcm9wZXJ0aWVzID0ge307XG4gIHZhciBjb21wdXRlZFByb3BlcnRpZXMgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcblxuICBwcm9wZXJ0eU5hbWVzLmZvckVhY2goZnVuY3Rpb24ocHJvcGVydHlOYW1lKSB7XG4vLyAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSBjb21wdXRlZFByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSB8fCAnJztcbiAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSBjb21wdXRlZFByb3BlcnRpZXMuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eU5hbWUpOy8vIHx8ICcnO1xuICB9KTtcbiAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG4iLCLvu792YXIgRWxlbWVudERlY29yYXRvciA9IHJlcXVpcmUoJy4vRWxlbWVudERlY29yYXRvcicpXG4gICwgZmlsdGVyID0gcmVxdWlyZSgnLi9maWx0ZXInKVxuICA7XG5tb2R1bGUuZXhwb3J0cyA9IGRlY29yYXRlO1xuXG4vKipcbiAqIEZhY3RvcnkgbWV0aG9kIGZvciBFbGVtZW50RGVjb3JhdG9yXG4gKiBAcGFyYW0ge3N0cmluZ3xFbGVtZW50fSB0YWdOYW1lT3JFbGVtZW50IEVsZW1lbnQgaW5zdGFuY2UgdG8gZGVjb3JhdGVcbiAqICAgIG9yIG5hbWUgb2YgSFRNTCB0YWcgdG8gY3JlYXRlIGFuZCBkZWNvcmF0ZS5cbiAqIEByZXR1cm4ge0VsZW1lbnREZWNvcmF0b3J9IE5ldyBFbGVtZW50RGVjb3JhdG9yIGluc3RhbmNlXG4gKi9cbmZ1bmN0aW9uIGRlY29yYXRlKHRhZ05hbWVPckVsZW1lbnQpIHtcbiAgdmFyIGVsZW1lbnQgPSB0YWdOYW1lT3JFbGVtZW50IGluc3RhbmNlb2YoRWxlbWVudClcbiAgICAgID8gdGFnTmFtZU9yRWxlbWVudFxuICAgICAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWVPckVsZW1lbnQpXG4gICAgO1xuICByZXR1cm4gbmV3IEVsZW1lbnREZWNvcmF0b3IoZWxlbWVudCk7XG59XG5cbi8qKlxuICogQWRkcyB0aGUgcHJvcGVydGllcyBvZiB0aGUgcGFzc2VkIGFycmF5IGVsZW1lbnRzIG9yIG9iamVjdCB0b1xuICogdGhlIHBhc3NlZCBvYmplY3RcbiAqIEBwYXJhbSB7b2JqZWN0fGFycmF5fSBleHRlbmRlZSBvYmplY3QgdG8gZXh0ZW5kXG4gKiBAcGFyYW0ge2FycmF5fG9iamVjdHx1bmRlZmluZWR9IGV4dGVuZGVyIG9iamVjdHMgdG8gZXh0ZW5kIGV4dGVuZGVlIHdpdGhcbiAqIEByZXR1cm4ge29iamVjdH0gZXh0ZW5kZWQgb2JqZWN0XG4gKi9cbmRlY29yYXRlLmV4dGVuZCA9IGZ1bmN0aW9uKGV4dGVuZGVlLCBleHRlbmRlcikge1xuICBpZiAoIWV4dGVuZGVyKSB7XG4gICAgZXh0ZW5kZXIgPSBleHRlbmRlZTtcbiAgICBleHRlbmRlZSA9IHt9O1xuICB9XG5cbiAgaWYgKGV4dGVuZGVyIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBleHRlbmRlci5mb3JFYWNoKGZ1bmN0aW9uKGV4dGVuZGVyKSB7XG4gICAgICBkZWNvcmF0ZS5jb3B5KGV4dGVuZGVlLCBleHRlbmRlcilcbiAgICB9KTtcbiAgICByZXR1cm4gZXh0ZW5kZWVcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZGVjb3JhdGUuY29weShleHRlbmRlZSwgZXh0ZW5kZXIpXG4gIH1cbn07XG5cbi8qKlxuICogSWYgMiBhcmdzOiBBZGRzIHByb3BlcnRpZXMgZm8gdGhlIHNlY29uZCBvYmplY3QgdG8gdGhlIGZpcnN0XG4gKiAgIG9iamVjdCBhbmQgcmV0dXJucyB0aGUgZmlyc3Qgb2JqZWN0LlxuICogSWYgMSBhcmc6IEFkZHMgcHJvcGVydGllcyBmbyB0aGUgYXJndW1lbnQgb2JqZWN0IHRvIGEgbmV3XG4gKiAgb2JqZWN0IGFuZCByZXR1cm5zIHRoYXQgb2JqZWN0LlxuICogQHBhcmFtIHtvYmplY3R9IGV4dGVuZGVlIG9iamVjdCB0byBiZSBleHRlbmRlZFxuICogQHBhcmFtIHtvYmplY3R8dW5kZWZpbmVkfSBleHRlbmRlciBvYmplY3QgdG8gZXh0ZW5kIGV4dGVuZGVlIHdpdGhcbiAqIEByZXR1cm4ge29iamVjdH0gZXh0ZW5kZWQgb2JqZWN0XG4gKi9cbmRlY29yYXRlLmNvcHkgPSBmdW5jdGlvbihleHRlbmRlZSwgZXh0ZW5kZXIpIHtcbiAgaWYgKCFleHRlbmRlcikge1xuICAgIGV4dGVuZGVyID0gZXh0ZW5kZWU7XG4gICAgZXh0ZW5kZWUgPSB7fTtcbiAgfVxuXG4gIE9iamVjdC5rZXlzKGV4dGVuZGVyKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3BlcnR5KSB7XG4gICAgZXh0ZW5kZWVbcHJvcGVydHldID0gZXh0ZW5kZXJbcHJvcGVydHldXG4gIH0pO1xuICByZXR1cm4gZXh0ZW5kZWVcbn07XG5cbmRlY29yYXRlLmZpbHRlciA9IGZpbHRlcjtcbiIsIu+7vy8qKlxuICogQ0FSVCBCVUlMREVSXG4gKi9cblxudmFyICQgPSByZXF1aXJlKCcuL2J1aWxkJylcbiAgLCBwbXJwYyA9IHJlcXVpcmUoJy4uLy4uLy4uL3NoYXJlZC9saWIvaXp1emFrL3BtcnBjJylcbiAgLCB0aHJvdHRsZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3NoYXJlZC9hcHAvc2VydmljZXMvdGhyb3R0bGUnKVxuICA7XG5cbmV4cG9ydHMuYnVpbGQgPSBmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gY2xvc2VDYXJ0KCkge1xuICAgIHJlc2l6ZUNhcnQoJ0NMT1NFRCcpXG4gIH1cblxuICBmdW5jdGlvbiBvcGVuQ2FydCgpIHtcbiAgICByZXNpemVDYXJ0KCdWSVNJQkxFJylcbiAgfVxuXG4gIGlmIChTaG9wYmVhbS5UT1BfV0lORE9XKSB7XG4gICAgdmFyIG1vYmlsZVRocmVzaG9sZCA9IDc2OFxuICAgICAgLCAkY2FydCA9ICQoJ2lmcmFtZScpXG4gICAgICAgIC5hdHRyKHtcbiAgICAgICAgICBpZCA6ICdzaG9wYmVhbS1jYXJ0JyxcbiAgICAgICAgICBzcmM6IFNob3BiZWFtLkhPU1QgKyAnL2FwcC9jYXJ0J1xuICAgICAgICB9KVxuICAgICAgLCBsYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbm5lcldpZHRoIDwgbW9iaWxlVGhyZXNob2xkID9cbiAgICAgICAgICAnUEhPTkUnIDogJ0RFU0tUT1AnO1xuICAgICAgfVxuICAgICAgLCBjc3NGb3IgPSBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICByZXR1cm4gU2hvcGJlYW1bJ0NBUlRfJyArIHN0YXRlICsgJ18nICsgbGF5b3V0KCkgKyAnX0NTUyddXG4gICAgICB9XG5cbiAgICAvLy0tIGluaXRpYWxpemUgY2FydFN0YXRlIHRvICdISURERU4nXG4gICAgICAsIGNhcnRTdGF0ZSA9ICdISURERU4nXG4gICAgICAsIHJlc2l6ZUNhcnQgPSBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICBwbXJwYy5jYWxsKHtcbiAgICAgICAgICBkZXN0aW5hdGlvbiAgICAgICAgOiAncHVibGlzaCcsXG4gICAgICAgICAgcHVibGljUHJvY2VkdXJlTmFtZTogJ3VwZGF0ZUNhcnRMYXlvdXQnLFxuICAgICAgICAgIHBhcmFtcyAgICAgICAgICAgICA6IFtsYXlvdXQoKV1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBpZiAoc3RhdGUpIGNhcnRTdGF0ZSA9IHN0YXRlO1xuICAgICAgICAkY2FydC5jc3MoJC5leHRlbmQoW2Nzc0ZvcignREVGQVVMVCcpLCBjc3NGb3IoY2FydFN0YXRlKV0pKTtcbiAgICAgIH1cbiAgICAgIDtcblxuICAgIHdpbmRvdy50b3AuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZnVuY3Rpb24oKSB7XG4gICAgICB0aHJvdHRsZShyZXNpemVDYXJ0KVxuICAgIH0pO1xuXG4gICAgU2hvcGJlYW0uRE9DVU1FTlRfQk9EWS50aGVuKGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgICRjYXJ0LmFwcGVuZFRvKGJvZHkpO1xuXG4gICAgICAvLy0tIGluaXRpYWwgc2l6aW5nXG4gICAgICByZXNpemVDYXJ0KCk7XG4gICAgfSk7XG5cbiAgICBwbXJwYy5yZWdpc3Rlcih7XG4gICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAncmVzaXplQ2FydCcsXG4gICAgICBwcm9jZWR1cmUgICAgICAgICAgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXNpemVDYXJ0KCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBwbXJwYy5yZWdpc3Rlcih7XG4gICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnb3BlbkNhcnQnLFxuICAgICAgcHJvY2VkdXJlICAgICAgICAgIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgb3BlbkNhcnQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBwbXJwYy5yZWdpc3Rlcih7XG4gICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnY2xvc2VDYXJ0JyxcbiAgICAgIHByb2NlZHVyZSAgICAgICAgICA6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY2xvc2VDYXJ0KHN0YXRlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBwbXJwYy5yZWdpc3Rlcih7XG4gICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnZmxhc2hDYXJ0JyxcbiAgICAgIHByb2NlZHVyZSAgICAgICAgICA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG9wZW5DYXJ0KCk7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNsb3NlQ2FydCgpXG4gICAgICAgICAgfSwgMjAwMClcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBwbXJwYy5yZWdpc3Rlcih7XG4gICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnaGlkZUNhcnQnLFxuICAgICAgcHJvY2VkdXJlICAgICAgICAgIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzaXplQ2FydCgnSElEREVOJylcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG4iLCLvu78vKipcbiAqIENIRUNLT1VUIEJVSUxERVJcbiAqL1xuXG52YXIgJCA9IHJlcXVpcmUoJy4vYnVpbGQnKVxuICAsIHBtcnBjID0gcmVxdWlyZSgnLi4vLi4vLi4vc2hhcmVkL2xpYi9penV6YWsvcG1ycGMnKVxuICAsIHpvb20gPSByZXF1aXJlKCcuL3pvb20nKVxuICA7XG5cbmV4cG9ydHMuYnVpbGQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKFNob3BiZWFtLlRPUF9XSU5ET1cpIHtcbiAgICB2YXIgJGNoZWNrb3V0ID0gJCgnaWZyYW1lJylcbiAgICAgICAgLmNzcygkLmV4dGVuZChbXG4gICAgICAgICAgU2hvcGJlYW0uQ0hFQ0tPVVRfREVGQVVMVF9DU1MsXG4gICAgICAgICAgU2hvcGJlYW0uQ0hFQ0tPVVRfSElEREVOX0NTU1xuICAgICAgICBdKSlcbiAgICAgICAgLmF0dHIoe1xuICAgICAgICAgIHNyYzogU2hvcGJlYW0uSE9TVCArICcvYXBwL2NoZWNrb3V0LyMvcmV2aWV3P21vZGU9Y29wcGVyJyxcbiAgICAgICAgICBpZCA6ICdzaG9wYmVhbS1jaGVja291dCdcbiAgICAgICAgfSlcbiAgICAgICwgJGNoZWNrb3V0Q29udGFpbmVyID0gJCgnZGl2JylcbiAgICAgICAgLmNzcygkLmV4dGVuZChbXG4gICAgICAgICAgU2hvcGJlYW0uQ0hFQ0tPVVRfQkFDS0RST1BfREVGQVVMVF9DU1MsXG4gICAgICAgICAgU2hvcGJlYW0uQ0hFQ0tPVVRfQkFDS0RST1BfSElEREVOX0NTU1xuICAgICAgICBdKSlcbiAgICAgICAgLmF0dHIoe2lkOiAnc2hvcGJlYW0tY2hlY2tvdXQtYmFja2Ryb3AnfSlcbiAgICAgIDtcblxuICAgIFNob3BiZWFtLkRPQ1VNRU5UX0JPRFkudGhlbihmdW5jdGlvbihib2R5KSB7XG4gICAgICAkY2hlY2tvdXQuYXBwZW5kVG8oYm9keSk7XG4gICAgICAkY2hlY2tvdXRDb250YWluZXIuYXBwZW5kVG8oYm9keSk7XG4gICAgfSk7XG4gICAgXG4gICAgcG1ycGMucmVnaXN0ZXIoe1xuICAgICAgcHVibGljUHJvY2VkdXJlTmFtZTogJ29wZW5DaGVja291dCcsXG4gICAgICBwcm9jZWR1cmUgICAgICAgICAgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB6b29tLmRpc2FibGUoKTtcbiAgICAgICAgICAkY2hlY2tvdXRDb250YWluZXIuYW5pbWF0ZShTaG9wYmVhbS5DSEVDS09VVF9CQUNLRFJPUF9WSVNJQkxFX0NTUywgJzExNTBtcycpO1xuICAgICAgICAgICRjaGVja291dC5hbmltYXRlKFNob3BiZWFtLkNIRUNLT1VUX1ZJU0lCTEVfQ1NTLCAnMXMnKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBwbXJwYy5yZWdpc3Rlcih7XG4gICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnY2xvc2VDaGVja291dCcsXG4gICAgICBwcm9jZWR1cmUgICAgICAgICAgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB6b29tLnJlc2V0KCk7XG4gICAgICAgICAgJGNoZWNrb3V0LmFuaW1hdGUoU2hvcGJlYW0uQ0hFQ0tPVVRfSElEREVOX0NTUywgJzFzJyk7XG4gICAgICAgICAgJGNoZWNrb3V0Q29udGFpbmVyLmFuaW1hdGUoU2hvcGJlYW0uQ0hFQ0tPVVRfQkFDS0RST1BfSElEREVOX0NTUywgJzExNTBtcycpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTsiLCLvu79tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZpbHRlcihuYW1lKSB7XG4gIHJldHVybiB7XG4gICAgdW5pcXVlOiB1bmlxdWVGaWx0ZXIsXG4gICAgZmlsdGVyOiBkeW5hbWljRmlsdGVyXG4gIH1bbmFtZV07XG59O1xuXG4vKipcbiAqIEZpbHRlciBhbiBhcnJheSBieSBhIGZ1bmN0aW9uIG9yIGJ5IGEgbWFwIG9iamVjdFxuICogQHBhcmFtIHthcnJheX0gYXJyYXkgQXJyYXkgdG8gYmUgZmlsdGVyZWRcbiAqIEBwYXJhbSB7ZnVuY3Rpb258b2JqZWN0fSBmaWx0ZXJCeSBJZiBhIGZ1bmN0aW9uLCBpdCdzIHBhc3NlZFxuICogICAgdG8gQXJyYXkucHJvcm90eXBlLmZpbHRlcjsgaWYgYW4gb2JqZWN0LCBlbGVtZW50cyB3aGljaCBoYXZlXG4gKiAgICBtYXRjaGluZyBrZXkvdmFsdWUgcGFpcnMgYXJlIGluY2x1ZGVkIGluIHRoZSByZXR1cm4gYXJyYXkuXG4gKiBAcmV0dXJuIHthcnJheX0gRmlsdGVyZWQgYXJyYXlcbiAqL1xuZnVuY3Rpb24gZHluYW1pY0ZpbHRlcihhcnJheSwgZmlsdGVyQnkpIHtcbiAgaWYgKHR5cGVvZihmaWx0ZXJCeSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gYXJyYXkuZmlsdGVyKGZpbHRlckJ5KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YoZmlsdGVyQnkpID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBhcnJheS5maWx0ZXIoZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGZpbHRlckJ5KS5ldmVyeShmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRba2V5XSA9PT0gZmlsdGVyQnlba2V5XTtcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1bmlxdWVGaWx0ZXIoYXJyYXksIHRhcmdldFByb3BlcnR5KSB7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgdmFyIHRlc3QgPSByZXN1bHQuc29tZShmdW5jdGlvbih0ZXN0RWxlbWVudCkge1xuICAgICAgcmV0dXJuIHRlc3RFbGVtZW50W3RhcmdldFByb3BlcnR5XSA9PT0gZWxlbWVudFt0YXJnZXRQcm9wZXJ0eV07XG4gICAgfSk7XG5cbiAgICBpZiAoIXRlc3QpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGVsZW1lbnQpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59Iiwi77u/LyoqXG4gKiBJTUFHRSBXSURHRVQgQ0xBU1NcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlV2lkZ2V0O1xuXG52YXIgJCA9IHJlcXVpcmUoJy4vYnVpbGQnKVxuICAsIHEgPSByZXF1aXJlKCcuLi8uLi8uLi9zaGFyZWQvbGliL2tyaXNrb3dhbC9xJylcbiAgLCBXaWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldCcpXG4gIDtcblxuZnVuY3Rpb24gSW1hZ2VXaWRnZXQoaW5pdGlhbEltYWdlKSB7XG4gIC8vdGhlIGlkIGF0dHJpYnV0ZSB0aGF0IHdpbGwgYmUgc2V0IG9uIHRoZSAkd2lkZ2V0IGlmcmFtZSBlbGVtZW50XG4gIHZhciB3aWRnZXRUYWdJZCA9IGluaXRpYWxJbWFnZS5pZC5yZXBsYWNlKFNob3BiZWFtLldJREdFVF9UQUdfSURfRVhDTFVERV9SRUdFWCwgJycpXG4gIC8vdGhlIHV1aWQtb25seSBvZiB0aGlzIHdpZGdldDsgdXNlZCBmb3IgdW5pcXVlbmVzcyBiZXR3ZWVuIG11bHRpcGxlIHdpZGdldHNcbiAgICAsIHdpZGdldFV1aWQgPSB3aWRnZXRUYWdJZC5tYXRjaChTaG9wYmVhbS5XSURHRVRfVVVJRF9SRUdFWClbMV1cbiAgLy9wcm9kdWN0cyByZXNvdXJlY2UgdXJsIHdpdGggcXVlcnktc3RyaW5nIHBhcmFtcyBmb3IgdGhpcyBwYXJ0aWN1bGFyIHdpZGdldFxuICAgICwgZGF0YVVybFxuICAvL2hvdmVyQWN0aW9uOiBkZXNjcmliZXMgaG92ZXIgYmVoYXZpb3Igb2Ygd2lkZ2V0XG4gICAgLCBob3ZlckFjdGlvblxuICAgIDtcblxuICBpZiAoaW5pdGlhbEltYWdlLmRhdGFzZXQpIHtcbiAgICBkYXRhVXJsID0gU2hvcGJlYW0uSE9TVCArIGluaXRpYWxJbWFnZS5kYXRhc2V0LnNob3BiZWFtVXJsO1xuICAgIGhvdmVyQWN0aW9uID0gaW5pdGlhbEltYWdlLmRhdGFzZXQuc2hvcGJlYW1Ib3ZlckFjdGlvbjtcbiAgfSBlbHNlIHtcbiAgICBkYXRhVXJsID0gU2hvcGJlYW0uSE9TVCArIGluaXRpYWxJbWFnZS5hdHRyaWJ1dGVzWydkYXRhLXNob3BiZWFtLXVybCddLnZhbHVlO1xuICAgIHZhciBob3ZlckF0dHJpYnV0ZSA9IGluaXRpYWxJbWFnZS5hdHRyaWJ1dGVzWydkYXRhLXNob3BiZWFtLWhvdmVyLWFjdGlvbiddO1xuICAgIGlmIChob3ZlckF0dHJpYnV0ZSkgaG92ZXJBY3Rpb24gPSBob3ZlckF0dHJpYnV0ZS52YWx1ZTtcbiAgfVxuICBcbiAgdGhpcy5kYXRhVXJsID0gZGF0YVVybDtcblxuICB2YXIgaW1hZ2VXaWR0aCA9IGluaXRpYWxJbWFnZS53aWR0aFxuICAgICwgaW1hZ2VIZWlnaHQgPSBpbml0aWFsSW1hZ2UuaGVpZ2h0XG4gICAgLCAkaW5pdGlhbEltYWdlID0gJChpbml0aWFsSW1hZ2UpXG5cbiAgLy9jb3B5IGFsbCBjb21wdXRlZCBib3JkZXJzLCBwYWRkaW5ncywgYW5kIG1hcmdpbnMgZnJvbSAkaW5pdGlhbEltYWdlIHRvIGJlIGFwcGxpZWQgdG9cbiAgLy8gIHRoZSBjb250YWluZXIgdGhhdCB3aWxsIHRha2UgaXQncyBwbGFjZSBhbmQgXCJlYXRcIiBpdFxuICAgICwgY29waWVkQm9yZGVycyA9ICRpbml0aWFsSW1hZ2UuY3NzKFsnYm9yZGVyLWxlZnQnLCAnYm9yZGVyLXJpZ2h0JywgJ2JvcmRlci10b3AnLCAnYm9yZGVyLWJvdHRvbSddKVxuICAgICwgY29waWVkTWFyZ2lucyA9ICRpbml0aWFsSW1hZ2UuY3NzKFsnbWFyZ2luLWxlZnQnLCAnbWFyZ2luLXJpZ2h0JywgJ21hcmdpbi10b3AnLCAnbWFyZ2luLWJvdHRvbSddKVxuICAgICwgY29waWVkUGFkZGluZ3MgPSAkaW5pdGlhbEltYWdlLmNzcyhbJ3BhZGRpbmctbGVmdCcsICdwYWRkaW5nLXJpZ2h0JywgJ3BhZGRpbmctdG9wJywgJ3BhZGRpbmctYm90dG9tJ10pXG5cbiAgLy9tZXJnZSB3aWR0aCBhbmQgaGVpZ2h0IHdpdGggdGhlIGNvcGllZCBib3JkZXJzLCBwYWRkaW5ncywgYW5kIG1hcmdpbnNcbiAgICAsIGNvcGllZENzcyA9ICQuZXh0ZW5kKCRpbml0aWFsSW1hZ2UuY3NzKFsnd2lkdGgnLCAnaGVpZ2h0JywgJ2Zsb2F0JywgJ3otaW5kZXgnXSksIFtcbiAgICAgIGNvcGllZEJvcmRlcnMsIGNvcGllZE1hcmdpbnMsXG4gICAgICBjb3BpZWRQYWRkaW5nc1xuICAgIF0pXG5cbiAgLy9jcmVhdGUgJHdpZGdldENvbnRhaW5lciBkaXYsIHNldCBpdCdzIGNzcyBcbiAgICAsICR3aWRnZXRDb250YWluZXIgPSAkKCdkaXYnKVxuICAgICAgLy9pbmxpbmUtYmxvY2sgdG8gbm90IGZvcmNlIGxpbmUtYnJlYWs7IHJlbGF0aXZlIHBvc2l0aW9uIGJlY2F1c2Ugb2YgXG4gICAgICAvLyAgYWJzb2x1dGVseSBwb3NpdGlvbmVkIGNoaWxkIGVsZW1lbnQocylcbiAgICAgIC5jc3Moe1xuICAgICAgICBkaXNwbGF5IDogJ2lubGluZS1ibG9jaycsXG4gICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnXG4gICAgICB9KVxuXG4gIC8vY3JlYXRlICR3aWRnZXQgaWZyYW1lOyBzZXQgaXQncyBjc3MgdG8gdGhlIGRlZmF1bHQgcGx1cyAkaW5pdGlhbEltYWdlJ3Mgd2lkdGhcbiAgLy8gIGFuZCBoZWlnaHQuIGFsc28gc2V0IGl0cyBpZCBhdHRyaWJ1dGVcbiAgICAsICR3aWRnZXQgPSAkKCdpZnJhbWUnKVxuICAgICAgLmNzcygkLmV4dGVuZChbXG4gICAgICAgIFNob3BiZWFtLldJREdFVF9ERUZBVUxUX0NTUyxcbiAgICAgICAgU2hvcGJlYW0uV0lER0VUX0hJRERFTl9DU1MsXG4gICAgICAgIHtcbiAgICAgICAgICB3aWR0aCA6IGltYWdlV2lkdGggKyAncHgnLFxuICAgICAgICAgIGhlaWdodDogaW1hZ2VIZWlnaHQgKyAncHgnXG4gICAgICAgIH1cbiAgICAgIF0pKS5hdHRyKFNob3BiZWFtLldJREdFVF9BVFRSUylcbiAgICAgIC5hdHRyKHtpZDogd2lkZ2V0VGFnSWR9KVxuXG4gIC8vY3JlYXRlIGRlZmVycmVkIGFuZCBwcm9taXNlIGZvciBwcm9kdWN0cyByZXNvdXJjZSByZXF1ZXN0LlxuICAvLyAgYW55dGhpbmcgdGhhdCBkZXBlbmRzIG9uIHByb2R1Y3RzIGRhdGEgdG8gYmUgbG9hZGVkIHdpbGwgLnRoZW4gb24gSlNPTlByb21pc2VcbiAgICAsIGRlZmVycmVkSlNPTiA9IHEuZGVmZXIoKVxuICAgICwgSlNPTlByb21pc2UgPSBkZWZlcnJlZEpTT04ucHJvbWlzZVxuICAgICwgZGF0YUNhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICB3aWRnZXRJZCAgICAgICAgICA6IHdpZGdldFV1aWQsXG4gICAgICAgICAgaG92ZXJBY3Rpb24gICAgICAgOiBob3ZlckFjdGlvbixcbiAgICAgICAgICB3aWR0aCAgICAgICAgICAgICA6IGltYWdlV2lkdGgsXG4gICAgICAgICAgcHJvZHVjdHNVcmwgICAgICAgOiBkYXRhVXJsLFxuICAgICAgICAgIGluaXRpYWxJbWFnZVNvdXJjZTogaW5pdGlhbEltYWdlLnNyY1xuICAgICAgICB9LFxuICAgICAgICBkYXRhID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgO1xuICAgICAgZGVmZXJyZWRKU09OLnJlc29sdmUoe2RhdGE6IGRhdGEsIG9wdGlvbnM6IG9wdGlvbnN9KTtcbiAgICB9XG4gICAgO1xuXG4gIC8vcHJlLWxvYWQgcHJvZHVjdHMgcmVzb3VyY2UgSlNPTlxuICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICByZXF1ZXN0Lm9ubG9hZCA9IGRhdGFDYWxsYmFjaztcbiAgcmVxdWVzdC5vcGVuKCdnZXQnLCBkYXRhVXJsLCB0cnVlKTtcbiAgcmVxdWVzdC5zZW5kKCk7XG5cblxuICB0aGlzLmJ1aWxkID0gZnVuY3Rpb24oKSB7XG4gICAgLy9JbnNlcnQgJHdpZGdldENvbnRhaW5lciBqdXN0IGJlZm9yZSB0aGUgaW1hZ2UgaXQgd2lsbCBjb250YWluIGFuZCB0aGVuIHJlcGxhY2VcbiAgICAkd2lkZ2V0Q29udGFpbmVyLmluc2VydEJlZm9yZSgkaW5pdGlhbEltYWdlKTtcblxuICAgIC8vbW92ZSBib3JkZXJzLCBwYWRkaW5ncyAmIG1hcmdpbnMgZnJvbSAkaW5pdGlhbEltYWdlIHRvICR3aWRnZXRDb250YWluZXJcbiAgICAvLyAgYW5kIG1vdmUgJGluaXRpYWxJbWFnZSAmICR3aWRnZXQgdG8gYmUgY2hpbGRyZW4gb2YgJHdpZGd0Q29udGFpbmVyLlxuICAgIC8vICBBbHNvIGFic29sdXRlbHkgcG9zaXRpb24gJGluaXRpYWxJbWFnZSBzbyB3aGVuICR3aWRnZXQgZmFkZXMgaW4gb3ZlciBpdCwgXG4gICAgLy8gIHRoZXkncmUgZGlyZWN0bHkgb3Zlci10b3Agb25lIGFub3RoZXIgKG5vIERPTSB3ZWlyZG5lc3Mgb3IgZWxlbWVudHMgYm91bmNpbmcpLlxuICAgICRpbml0aWFsSW1hZ2UuY3NzKHtib3JkZXI6ICdub25lJywgcGFkZGluZzogMCwgbWFyZ2luOiAwLCBwb3NpdGlvbjogJ2Fic29sdXRlJywgdG9wOiAwLCBsZWZ0OiAwfSk7XG4gICAgJHdpZGdldENvbnRhaW5lci5jc3MoY29waWVkQ3NzKVxuICAgICAgLmFwcGVuZCgkaW5pdGlhbEltYWdlKVxuICAgICAgLmFwcGVuZCgkd2lkZ2V0KTtcblxuICAgIC8vYWZ0ZXIgJHdpZGdldCBoYXMgYmVlbiBhZGRlZCB0byBET00sIHdlIGNhbiBpbnRlcmFjdCB3aXRoIGl0J3MgYGNvbnRlbnRXaW5kb3dgIGFuZCBgY29udGVudERvY3VtZW50YFxuICAgIC8vd3JpdGUgdGhlIHdpZGdldCBpbmRleCBtYXJrdXAgdG8gJHdpZGdldCdzIGRvY3VtZW50XG4gICAgdmFyIHdpZGdldFdpbmRvdyA9ICR3aWRnZXQuZWxlbWVudC5jb250ZW50V2luZG93XG4gICAgICAsIHdpZGdldERvY3VtZW50ID0gd2lkZ2V0V2luZG93LmRvY3VtZW50XG4gICAgICA7XG5cbiAgICAvKipcbiAgICAgKiBOT1RFOiAub3BlbiBNVVNUIGJlIGNhbGxlZCBCRUZPUkUgYXNzaWduaW5nIGFueSBwcm9wZXJ0aWVzIG9uIHRoZSBpZnJhbWUgd2luZG93LlxuICAgICAqICAgIElFIHNlZW1zIHRvIGVpdGhlciBjcmVhdGUgYSBuZXcgd2luZG93IGFmdGVyIC5vcGVuIGlzIGNhbGxlZCBvciBkZWxldGUgcHJvcGVydGllc1xuICAgICAqICAgIHNldCBvbiBpdC5cbiAgICAgKi9cbiAgICB3aWRnZXREb2N1bWVudC5vcGVuKCk7XG4gICAgd2lkZ2V0V2luZG93LlNob3BiZWFtV2lkZ2V0ID0gdGhpcztcbiAgICB3aWRnZXREb2N1bWVudC53cml0ZShhcHBJbmRleGVzLndpZGdldChTaG9wYmVhbSkpO1xuICAgIHdpZGdldERvY3VtZW50LmNsb3NlKCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEZhZGUgd2lkZ2V0IGluLCBvdmVyLXRvcCBvZiBpdHMgcmVzcGVjdGl2ZSBpbml0aWFsSW1hZ2U7XG4gICAqICAgIHRoZW4sIHdoZW4gZmFkaW5nIGlzIGNvbXBsZXRlLCByZW1vdmUgJGluaXRpYWxJbWFnZSBmcm9tIHRoZSBET00uXG4gICAqL1xuICB0aGlzLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgICR3aWRnZXQuZmFkZUluKCcxcycpLnRoZW4oJGluaXRpYWxJbWFnZS5yZW1vdmUpO1xuICB9O1xuXG4gIHRoaXMudXVpZCA9IHdpZGdldFV1aWQ7XG4gIHRoaXMuSlNPTlByb21pc2UgPSBKU09OUHJvbWlzZTtcblxuICAvL0luaGVyaXQgZnJvbSBXaWRnZXQgQ2xhc3NcbiAgV2lkZ2V0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG4iLCJ2YXIgcHJvY2Vzcz1yZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIiksZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsoZnVuY3Rpb24oZSl7aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgYm9vdHN0cmFwKWJvb3RzdHJhcChcImphZGVcIixlKTtlbHNlIGlmKFwib2JqZWN0XCI9PXR5cGVvZiBlY2tzcG9ydHMpbW9kdXdlbC5leHBvcnRzPWUoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoZSk7ZWxzZSBpZihcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VzKXtpZighc2VzLm9rKCkpcmV0dXJuO3Nlcy5tYWtlSmFkZT1lfWVsc2VcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdy5qYWRlPWUoKTpnbG9iYWwuamFkZT1lKCl9KShmdW5jdGlvbigpe3ZhciBkZWZpbmUsc2VzLGJvb3RzdHJhcCxtb2R1bGUsZXhwb3J0cztcbnJldHVybiAoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJla3dpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cclxuLyohXHJcbiAqIEphZGUgLSBydW50aW1lXHJcbiAqIENvcHlyaWdodChjKSAyMDEwIFRKIEhvbG93YXljaHVrIDx0akB2aXNpb24tbWVkaWEuY2E+XHJcbiAqIE1JVCBMaWNlbnNlZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBMYW1lIEFycmF5LmlzQXJyYXkoKSBwb2x5ZmlsbCBmb3Igbm93LlxyXG4gKi9cclxuXHJcbmlmICghQXJyYXkuaXNBcnJheSkge1xyXG4gIEFycmF5LmlzQXJyYXkgPSBmdW5jdGlvbihhcnIpe1xyXG4gICAgcmV0dXJuICdbb2JqZWN0IEFycmF5XScgPT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFycik7XHJcbiAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIExhbWUgT2JqZWN0LmtleXMoKSBwb2x5ZmlsbCBmb3Igbm93LlxyXG4gKi9cclxuXHJcbmlmICghT2JqZWN0LmtleXMpIHtcclxuICBPYmplY3Qua2V5cyA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICB2YXIgYXJyID0gW107XHJcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIGFyci5wdXNoKGtleSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcnI7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogTWVyZ2UgdHdvIGF0dHJpYnV0ZSBvYmplY3RzIGdpdmluZyBwcmVjZWRlbmNlXHJcbiAqIHRvIHZhbHVlcyBpbiBvYmplY3QgYGJgLiBDbGFzc2VzIGFyZSBzcGVjaWFsLWNhc2VkXHJcbiAqIGFsbG93aW5nIGZvciBhcnJheXMgYW5kIG1lcmdpbmcvam9pbmluZyBhcHByb3ByaWF0ZWx5XHJcbiAqIHJlc3VsdGluZyBpbiBhIHN0cmluZy5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IGFcclxuICogQHBhcmFtIHtPYmplY3R9IGJcclxuICogQHJldHVybiB7T2JqZWN0fSBhXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmV4cG9ydHMubWVyZ2UgPSBmdW5jdGlvbiBtZXJnZShhLCBiKSB7XHJcbiAgdmFyIGFjID0gYVsnY2xhc3MnXTtcclxuICB2YXIgYmMgPSBiWydjbGFzcyddO1xyXG5cclxuICBpZiAoYWMgfHwgYmMpIHtcclxuICAgIGFjID0gYWMgfHwgW107XHJcbiAgICBiYyA9IGJjIHx8IFtdO1xyXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFjKSkgYWMgPSBbYWNdO1xyXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGJjKSkgYmMgPSBbYmNdO1xyXG4gICAgYVsnY2xhc3MnXSA9IGFjLmNvbmNhdChiYykuZmlsdGVyKG51bGxzKTtcclxuICB9XHJcblxyXG4gIGZvciAodmFyIGtleSBpbiBiKSB7XHJcbiAgICBpZiAoa2V5ICE9ICdjbGFzcycpIHtcclxuICAgICAgYVtrZXldID0gYltrZXldO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGE7XHJcbn07XHJcblxyXG4vKipcclxuICogRmlsdGVyIG51bGwgYHZhbGBzLlxyXG4gKlxyXG4gKiBAcGFyYW0geyp9IHZhbFxyXG4gKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5mdW5jdGlvbiBudWxscyh2YWwpIHtcclxuICByZXR1cm4gdmFsICE9IG51bGwgJiYgdmFsICE9PSAnJztcclxufVxyXG5cclxuLyoqXHJcbiAqIGpvaW4gYXJyYXkgYXMgY2xhc3Nlcy5cclxuICpcclxuICogQHBhcmFtIHsqfSB2YWxcclxuICogQHJldHVybiB7U3RyaW5nfVxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5mdW5jdGlvbiBqb2luQ2xhc3Nlcyh2YWwpIHtcclxuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWwpID8gdmFsLm1hcChqb2luQ2xhc3NlcykuZmlsdGVyKG51bGxzKS5qb2luKCcgJykgOiB2YWw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZW5kZXIgdGhlIGdpdmVuIGF0dHJpYnV0ZXMgb2JqZWN0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBlc2NhcGVkXHJcbiAqIEByZXR1cm4ge1N0cmluZ31cclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5hdHRycyA9IGZ1bmN0aW9uIGF0dHJzKG9iaiwgZXNjYXBlZCl7XHJcbiAgdmFyIGJ1ZiA9IFtdXHJcbiAgICAsIHRlcnNlID0gb2JqLnRlcnNlO1xyXG5cclxuICBkZWxldGUgb2JqLnRlcnNlO1xyXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKVxyXG4gICAgLCBsZW4gPSBrZXlzLmxlbmd0aDtcclxuXHJcbiAgaWYgKGxlbikge1xyXG4gICAgYnVmLnB1c2goJycpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xyXG4gICAgICB2YXIga2V5ID0ga2V5c1tpXVxyXG4gICAgICAgICwgdmFsID0gb2JqW2tleV07XHJcblxyXG4gICAgICBpZiAoJ2Jvb2xlYW4nID09IHR5cGVvZiB2YWwgfHwgbnVsbCA9PSB2YWwpIHtcclxuICAgICAgICBpZiAodmFsKSB7XHJcbiAgICAgICAgICB0ZXJzZVxyXG4gICAgICAgICAgICA/IGJ1Zi5wdXNoKGtleSlcclxuICAgICAgICAgICAgOiBidWYucHVzaChrZXkgKyAnPVwiJyArIGtleSArICdcIicpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmICgwID09IGtleS5pbmRleE9mKCdkYXRhJykgJiYgJ3N0cmluZycgIT0gdHlwZW9mIHZhbCkge1xyXG4gICAgICAgIGJ1Zi5wdXNoKGtleSArIFwiPSdcIiArIEpTT04uc3RyaW5naWZ5KHZhbCkgKyBcIidcIik7XHJcbiAgICAgIH0gZWxzZSBpZiAoJ2NsYXNzJyA9PSBrZXkpIHtcclxuICAgICAgICBpZiAoZXNjYXBlZCAmJiBlc2NhcGVkW2tleV0pe1xyXG4gICAgICAgICAgaWYgKHZhbCA9IGV4cG9ydHMuZXNjYXBlKGpvaW5DbGFzc2VzKHZhbCkpKSB7XHJcbiAgICAgICAgICAgIGJ1Zi5wdXNoKGtleSArICc9XCInICsgdmFsICsgJ1wiJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmICh2YWwgPSBqb2luQ2xhc3Nlcyh2YWwpKSB7XHJcbiAgICAgICAgICAgIGJ1Zi5wdXNoKGtleSArICc9XCInICsgdmFsICsgJ1wiJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgaWYgKGVzY2FwZWQgJiYgZXNjYXBlZFtrZXldKSB7XHJcbiAgICAgICAgYnVmLnB1c2goa2V5ICsgJz1cIicgKyBleHBvcnRzLmVzY2FwZSh2YWwpICsgJ1wiJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYnVmLnB1c2goa2V5ICsgJz1cIicgKyB2YWwgKyAnXCInKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGJ1Zi5qb2luKCcgJyk7XHJcbn07XHJcblxyXG4vKipcclxuICogRXNjYXBlIHRoZSBnaXZlbiBzdHJpbmcgb2YgYGh0bWxgLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gaHRtbFxyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmV4cG9ydHMuZXNjYXBlID0gZnVuY3Rpb24gZXNjYXBlKGh0bWwpe1xyXG4gIHJldHVybiBTdHJpbmcoaHRtbClcclxuICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXHJcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXHJcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXHJcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlLXRocm93IHRoZSBnaXZlbiBgZXJyYCBpbiBjb250ZXh0IHRvIHRoZVxyXG4gKiB0aGUgamFkZSBpbiBgZmlsZW5hbWVgIGF0IHRoZSBnaXZlbiBgbGluZW5vYC5cclxuICpcclxuICogQHBhcmFtIHtFcnJvcn0gZXJyXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlbmFtZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gbGluZW5vXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmV4cG9ydHMucmV0aHJvdyA9IGZ1bmN0aW9uIHJldGhyb3coZXJyLCBmaWxlbmFtZSwgbGluZW5vLCBzdHIpe1xyXG4gIGlmICghKGVyciBpbnN0YW5jZW9mIEVycm9yKSkgdGhyb3cgZXJyO1xyXG4gIGlmICgodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJyB8fCAhZmlsZW5hbWUpICYmICFzdHIpIHtcclxuICAgIGVyci5tZXNzYWdlICs9ICcgb24gbGluZSAnICsgbGluZW5vO1xyXG4gICAgdGhyb3cgZXJyO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgc3RyID0gIHN0ciB8fCByZXF1aXJlKCdmcycpLnJlYWRGaWxlU3luYyhmaWxlbmFtZSwgJ3V0ZjgnKVxyXG4gIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICByZXRocm93KGVyciwgbnVsbCwgbGluZW5vKVxyXG4gIH1cclxuICB2YXIgY29udGV4dCA9IDNcclxuICAgICwgbGluZXMgPSBzdHIuc3BsaXQoJ1xcbicpXHJcbiAgICAsIHN0YXJ0ID0gTWF0aC5tYXgobGluZW5vIC0gY29udGV4dCwgMClcclxuICAgICwgZW5kID0gTWF0aC5taW4obGluZXMubGVuZ3RoLCBsaW5lbm8gKyBjb250ZXh0KTtcclxuXHJcbiAgLy8gRXJyb3IgY29udGV4dFxyXG4gIHZhciBjb250ZXh0ID0gbGluZXMuc2xpY2Uoc3RhcnQsIGVuZCkubWFwKGZ1bmN0aW9uKGxpbmUsIGkpe1xyXG4gICAgdmFyIGN1cnIgPSBpICsgc3RhcnQgKyAxO1xyXG4gICAgcmV0dXJuIChjdXJyID09IGxpbmVubyA/ICcgID4gJyA6ICcgICAgJylcclxuICAgICAgKyBjdXJyXHJcbiAgICAgICsgJ3wgJ1xyXG4gICAgICArIGxpbmU7XHJcbiAgfSkuam9pbignXFxuJyk7XHJcblxyXG4gIC8vIEFsdGVyIGV4Y2VwdGlvbiBtZXNzYWdlXHJcbiAgZXJyLnBhdGggPSBmaWxlbmFtZTtcclxuICBlcnIubWVzc2FnZSA9IChmaWxlbmFtZSB8fCAnSmFkZScpICsgJzonICsgbGluZW5vXHJcbiAgICArICdcXG4nICsgY29udGV4dCArICdcXG5cXG4nICsgZXJyLm1lc3NhZ2U7XHJcbiAgdGhyb3cgZXJyO1xyXG59O1xyXG5cbn0se1wiZnNcIjoyfV0sMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vLyBub3RoaW5nIHRvIHNlZSBoZXJlLi4uIG5vIGZpbGUgbWV0aG9kcyBmb3IgdGhlIGJyb3dzZXJcblxufSx7fV19LHt9LFsxXSkoMSlcbn0pO1xuOyhmdW5jdGlvbigpeyBcbnZhciBhc3NldHMgPSB7IFxuICAgIGFzc2V0czoge1wiL2pzL3dpZGdldC90ZW1wbGF0ZXMuanNcIjpcIi9qcy93aWRnZXQvdGVtcGxhdGVzLTI3NjliZmFiMmNlZGE2NjA1ZjMyN2U1NDkxMDM1YzRhLmpzXCIsXCIvanMvbGlnaHRib3gvdGVtcGxhdGVzLmpzXCI6XCIvanMvbGlnaHRib3gvdGVtcGxhdGVzLTc2MzRlMWMyZjEzMWJmYmI3YTViYWUwMGE0Y2M3MDgxLmpzXCIsXCIvanMvc2hhcmVkL3RlbXBsYXRlcy5qc1wiOlwiL2pzL3NoYXJlZC90ZW1wbGF0ZXMtMDEyNGM2MTJmNWM0NDAxZTViMzdkZTEyNTgwYTNhMTAuanNcIixcIi8uRFNfU3RvcmVcIjpcIi8uRFNfU3RvcmUtYzAxZGJmNzk4Yzc5NzRjYmRhM2U3MDU2NTYwODVjMzdcIixcIi9jcm9zc2RvbWFpbi54bWxcIjpcIi9jcm9zc2RvbWFpbi1hMGE0MTJiNDg3MzY5ZDg1NWNlMTNkNzRlYjBkOGRhMi54bWxcIixcIi9jc3MvYm9vdHN0cmFwLXJlc3BvbnNpdmUuY3NzXCI6XCIvY3NzL2Jvb3RzdHJhcC1yZXNwb25zaXZlLWUyNmYyYzcxZmE2OWZmYThjNWQzNTcwMzMzN2MyZTg4LmNzc1wiLFwiL2Nzcy9ib290c3RyYXAuY3NzXCI6XCIvY3NzL2Jvb3RzdHJhcC00YjZjZjlkOTgyZGE2NGYxMDkyMmMzMDg5MTkwMTk0MS5jc3NcIixcIi9jc3MvaWNvbW9vbi5zdHlsXCI6XCIvY3NzL2ljb21vb24tNTVhYjIwYTE2ZmRjZGYzYjlhYjg1N2MxN2U5N2NiNTQuc3R5bFwiLFwiL2Nzcy9qcXVlcnkubm91aXNsaWRlci5jc3NcIjpcIi9jc3MvanF1ZXJ5Lm5vdWlzbGlkZXItOTQwZjA0YzAwMDAyMWMxNTkxMDgxNWJiMDY3NzZmNTMuY3NzXCIsXCIvaW1nL2FqYXgtbG9hZGVyMi5naWZcIjpcIi9pbWcvYWpheC1sb2FkZXIyLTQzZmNhMTExNTkwMmRkMTcwNTg3NzdkMGM0YzU1MDgwLmdpZlwiLFwiL2ltZy9hbGV4LnBuZ1wiOlwiL2ltZy9hbGV4LWYzNDZjZGUzZWFhYmRiM2Q0MmFlMThiZjM1NmVkYjMzLnBuZ1wiLFwiL2ltZy9hbWVyaWNhbi1leHByZXNzLWxvZ28uZ2lmXCI6XCIvaW1nL2FtZXJpY2FuLWV4cHJlc3MtbG9nby1jMWUwNzVlZDZjMTViZThmOGJmYjc3NDRmYzRmZGIzMC5naWZcIixcIi9pbWcvYmFieV9kYXJrLnN2Z1wiOlwiL2ltZy9iYWJ5X2RhcmstNTM5YjgxMjFhYjQzMWVlZjc4MWQxNzczZmRkNDE2MTAuc3ZnXCIsXCIvaW1nL2JhYnlfZ3JleS5zdmdcIjpcIi9pbWcvYmFieV9ncmV5LWEyNDFkMDNlZmU1MTlmYmEyYmQ3ODUyODZiNmU0NWZmLnN2Z1wiLFwiL2ltZy9iYWctZ3JleS5wbmdcIjpcIi9pbWcvYmFnLWdyZXktYWQ3MjMyNWY4MjJhMzdlZTAxZWZkNDljOWQyOTA1NTEucG5nXCIsXCIvaW1nL2JhZy1sb2dvLWdyZXkucG5nXCI6XCIvaW1nL2JhZy1sb2dvLWdyZXktODQ1ODlkNTZlYjZhMDI3MjY2NmJlYWFhMmZiOWFiNDkucG5nXCIsXCIvaW1nL2JhZy1sb2dvLXdoaXRlLnBuZ1wiOlwiL2ltZy9iYWctbG9nby13aGl0ZS05MWVkNDEwY2I4NDM0MGY3M2ZjMDg2OTMxMjdlOTIxYS5wbmdcIixcIi9pbWcvYmFnLXdoaXRlLnBuZ1wiOlwiL2ltZy9iYWctd2hpdGUtYTY5NGZmYmM2ZGFiMTY2NTBiMDRjNTlhZDVlOTdmNzIucG5nXCIsXCIvaW1nL2JlYXV0eV9kYXJrLnN2Z1wiOlwiL2ltZy9iZWF1dHlfZGFyay1kYThiOTI0MjllNjkyYTk5NTU3M2Q5MTExNGZkYjUwOS5zdmdcIixcIi9pbWcvYmVhdXR5X2dyZXkuc3ZnXCI6XCIvaW1nL2JlYXV0eV9ncmV5LTIyZDhkNGRlOWQ0NzQzMjRlODY5ZDYzNTRjYjkzYTRjLnN2Z1wiLFwiL2ltZy9ibGFuay5wbmdcIjpcIi9pbWcvYmxhbmstZDM4ZjU1MTYwZTY5NDMxMDg5NTEyNzViZjkxZDZkMGYucG5nXCIsXCIvaW1nL2JvcmlzLnBuZ1wiOlwiL2ltZy9ib3Jpcy02NTlhZmJjMDY4MGUzNTdiYmRjNDQzOGY0MDQ3OTA1OC5wbmdcIixcIi9pbWcvYnJ5YW4ucG5nXCI6XCIvaW1nL2JyeWFuLTMxNzM5MTM0M2E1MmQxY2JmOGE3MWY3Mjg5NmVmYzI2LnBuZ1wiLFwiL2ltZy9jdnYtaW5mb2dyYXBoaWMuZ2lmXCI6XCIvaW1nL2N2di1pbmZvZ3JhcGhpYy1jZGYzOWNiOTNlN2VhMjVhYTg0YmE5NGJjNmJhMGViZC5naWZcIixcIi9pbWcvZGFuLnBuZ1wiOlwiL2ltZy9kYW4tNjNiYjZhYTQxYmZkOTVkMzkyZDQ0OWZkZTcwMTg3NjcucG5nXCIsXCIvaW1nL2ZhY2Vib29rX3NoYXJlLnBuZ1wiOlwiL2ltZy9mYWNlYm9va19zaGFyZS1iZDkyMTE3ZDgwNWE2NWI3NmFkZTM2ZDMzNWU4NTc5My5wbmdcIixcIi9pbWcvZmFzaGlvbl9kYXJrLnN2Z1wiOlwiL2ltZy9mYXNoaW9uX2RhcmstNDRkZmE0ODcxODAwYjc4ZjViNDMzNTJmZmQ2NzFjMTUuc3ZnXCIsXCIvaW1nL2Zhc2hpb25fZ3JleS5zdmdcIjpcIi9pbWcvZmFzaGlvbl9ncmV5LTI4Yzg4YWQ2NGYwOWZmODZkODZlNGNkYjk3ZGU3NjNhLnN2Z1wiLFwiL2ltZy9mYXZpY29uLmljb1wiOlwiL2ltZy9mYXZpY29uLTcwMWI3NmE0MjE0ODhkZjllYjU4ZTFkYjJiYzY3N2VkLmljb1wiLFwiL2ltZy9maWx0ZXItYmFyLWNsb3Nlci1idXR0b24tb3Blbi5qcGdcIjpcIi9pbWcvZmlsdGVyLWJhci1jbG9zZXItYnV0dG9uLW9wZW4tNDJkMjFjMWYyZjlhZjYwZWQyZGM1ZDBkMDRiYTNmZjkuanBnXCIsXCIvaW1nL2ZpbHRlci1iYXItY2xvc2VyLWJ1dHRvbi5qcGdcIjpcIi9pbWcvZmlsdGVyLWJhci1jbG9zZXItYnV0dG9uLTZhYWQyMTY5YmVjYTRmZTU4ODFmOTk0Y2RhNjIwNTM3LmpwZ1wiLFwiL2ltZy9mb290ZXItc29jaWFsLnBuZ1wiOlwiL2ltZy9mb290ZXItc29jaWFsLWY0NTU2ZWM3MGZlMzg5OWZmM2EyMzA3ZTdkOTYwNjZjLnBuZ1wiLFwiL2ltZy9nZW9yZ2llLnBuZ1wiOlwiL2ltZy9nZW9yZ2llLWVkMmEwNjNlYjc0NzgzMGYwNmJjOTI2YTc4Mzc3MDk2LnBuZ1wiLFwiL2ltZy9nbHlwaGljb25zLWhhbGZsaW5ncy13aGl0ZS5wbmdcIjpcIi9pbWcvZ2x5cGhpY29ucy1oYWxmbGluZ3Mtd2hpdGUtOWJiYzZlOTYwMjk5OGEzODVjMmVhMTNkZjU2NDcwZmQucG5nXCIsXCIvaW1nL2dseXBoaWNvbnMtaGFsZmxpbmdzLnBuZ1wiOlwiL2ltZy9nbHlwaGljb25zLWhhbGZsaW5ncy0yNTE2MzM5OTcwZDcxMDgxOTU4NWY5MDc3M2FlYmUwYS5wbmdcIixcIi9pbWcvaG9tZV9kYXJrLnN2Z1wiOlwiL2ltZy9ob21lX2RhcmstYmJmN2QyNzY4NzRlNGE3ZWE1MWUzMGVhYjIyYjI0YWEuc3ZnXCIsXCIvaW1nL2hvbWVfZ3JleS5zdmdcIjpcIi9pbWcvaG9tZV9ncmV5LTNiOTczZmRlMTg5ZDJmYWE1NTkwZWZlZGY5ZDMzZjM3LnN2Z1wiLFwiL2ltZy9pY28tYWRkLnBuZ1wiOlwiL2ltZy9pY28tYWRkLWZmMDc2MDgyNTY1NmFlYmIyMWEyODI3MjZmZmE5ZDZlLnBuZ1wiLFwiL2ltZy9pY28tYWRkcmVzcy5wbmdcIjpcIi9pbWcvaWNvLWFkZHJlc3MtZGJlOTI1ODc4OTdkOTJhZTJmYTgyNWU5Yjg3ODdkZTkucG5nXCIsXCIvaW1nL2ljby1hcnJvdy5wbmdcIjpcIi9pbWcvaWNvLWFycm93LTJlOWM5N2MwOGJmZDRiNThlOGI5Yjc1NmQyMGQ2OWQwLnBuZ1wiLFwiL2ltZy9pY28tYm9vay5wbmdcIjpcIi9pbWcvaWNvLWJvb2stYWQxNDA3NzkwYzg1MDRhMzFiZjIwMjA5MzI3YjkxZTcucG5nXCIsXCIvaW1nL2ljby1jYWxsLnBuZ1wiOlwiL2ltZy9pY28tY2FsbC1kNzdjMzJhZWU1MzViYzc0ZmIyMTQxOWRmNDVkMWMzNS5wbmdcIixcIi9pbWcvaWNvLWNyb3NzLXdoaXRlLnBuZ1wiOlwiL2ltZy9pY28tY3Jvc3Mtd2hpdGUtZjllNTU5MTljZDQwNGY2M2JlMjkxNDY1NGIxMWI3ZjEucG5nXCIsXCIvaW1nL2ljby1lbWFpbC5wbmdcIjpcIi9pbWcvaWNvLWVtYWlsLTZhMjdkODM3MzQxYzdlZTgxMGQ1NjQ4MTAwMGI4OGVkLnBuZ1wiLFwiL2ltZy9pY28tZ2lmdC5wbmdcIjpcIi9pbWcvaWNvLWdpZnQtMTM3ZGY4YzEwNmU2N2I0MTZhYjU2NjA3MjNjOWM2NzkucG5nXCIsXCIvaW1nL2ljby1sb3ZlLnBuZ1wiOlwiL2ltZy9pY28tbG92ZS04M2ZlMDhjNzQ2YjQxNjNiZGQ2ZjJlODdiYzEzOWMxNy5wbmdcIixcIi9pbWcvaWNvLW9wZW4tY2xvc2UucG5nXCI6XCIvaW1nL2ljby1vcGVuLWNsb3NlLTRlMDJlOTI3NzJlYzRjMDc4ZTA0MTA0MzYyNmE1NzQ0LnBuZ1wiLFwiL2ltZy9pY28tdGFnLnBuZ1wiOlwiL2ltZy9pY28tdGFnLTQ0NGNiYzYzMDQ4NzAwOGZmN2JjNDM1NDQyZGFlMWU2LnBuZ1wiLFwiL2ltZy9pY28tdGljay5wbmdcIjpcIi9pbWcvaWNvLXRpY2stZWYxNzM1NTc4YTY1NWQ1M2FlNzhkMTIxOTNjZmFmNGUucG5nXCIsXCIvaW1nL2ljby10cmlhbmdsZS5wbmdcIjpcIi9pbWcvaWNvLXRyaWFuZ2xlLTE3NGZmNjBiZDdhNmZiNDFhZDBhMGRmZjJhNWViOTA4LnBuZ1wiLFwiL2ltZy9pcGFkLWZyYW1lLnBuZ1wiOlwiL2ltZy9pcGFkLWZyYW1lLTFlMDlkNmVjMDdiZGM0MTIxMjFhNzZiYzkxMDk3NDc4LnBuZ1wiLFwiL2ltZy9qYWNrbHluLnBuZ1wiOlwiL2ltZy9qYWNrbHluLWNhMmUyZmIyYjMxOGE0MDA5MmRmNmU1NzU3ODJmOWNmLnBuZ1wiLFwiL2ltZy9qYWsucG5nXCI6XCIvaW1nL2phay03NDRlZTlkNjNhYTlkOGMxZDU3MzA1ZjcwZjZhNDE4OS5wbmdcIixcIi9pbWcvamVzc2UucG5nXCI6XCIvaW1nL2plc3NlLWE1MGIxNzJiMTJjYmM3Mjk3NTc2NmM0OWRmOTdmYWFlLnBuZ1wiLFwiL2ltZy9qaW1teS5wbmdcIjpcIi9pbWcvamltbXktNDM3NzEyYTI2ODA0YzcyOWNjMTM5NDFiMDg2ZDBhYzAucG5nXCIsXCIvaW1nL2xhbmRpbmdfaGVyby5qcGdcIjpcIi9pbWcvbGFuZGluZ19oZXJvLWNjYzE3MjE2ZTU2OWMxOTE3NDMzOWVmNjM0YmZiYTIxLmpwZ1wiLFwiL2ltZy9saXN0LXdvcmtzLnBuZ1wiOlwiL2ltZy9saXN0LXdvcmtzLTRlNjA4YTMxNmI0MzIzZTQ3NDdmZGIzMTU0OWZjNDNlLnBuZ1wiLFwiL2ltZy9sb2FkaW5nX21vcmVfcHJvZHVjdHMuZ2lmXCI6XCIvaW1nL2xvYWRpbmdfbW9yZV9wcm9kdWN0cy0yMzZiZjNiZjQyMjRlNTEwNDAyOTZlOTIxMzdjNWNmNy5naWZcIixcIi9pbWcvbG9nby1ibGFjay5wbmdcIjpcIi9pbWcvbG9nby1ibGFjay1lNjk1ZjA3NDUzNDViZmNmNGFhZjYyNzQ4NjFkNGEwNC5wbmdcIixcIi9pbWcvbG9nby13aGl0ZS5wbmdcIjpcIi9pbWcvbG9nby13aGl0ZS00YjlhNGZjODNlZDY3NTY2NWQzY2JhMTdjY2RhNjVhYi5wbmdcIixcIi9pbWcvbWFzdGVyY2FyZC1sb2dvLmdpZlwiOlwiL2ltZy9tYXN0ZXJjYXJkLWxvZ28tZTI4OGZlMmJkZmE1MGYzZWQ5OGZiMjkxZjM0NzExODAuZ2lmXCIsXCIvaW1nL25vcnRvbi1ibGFjay5wbmdcIjpcIi9pbWcvbm9ydG9uLWJsYWNrLWM1Yzg3NjBkNzQ5MzQwOGIyMmZkMjg0YmRhMGM5OWVkLnBuZ1wiLFwiL2ltZy9wZW9wbGUtZG9uLWRyYXBlci5qcGdcIjpcIi9pbWcvcGVvcGxlLWRvbi1kcmFwZXItYWY0ODUzNzMyMGVkMWEwZTllZWI3MDM4OWUxZTE4YzguanBnXCIsXCIvaW1nL3Blb3BsZS1sbmstaW4ucG5nXCI6XCIvaW1nL3Blb3BsZS1sbmstaW4tODg5YjMyZDgwMWZmNzNhOGM3ZmU0MWZiMjM1MjhmMjYucG5nXCIsXCIvaW1nL3BpbnRlcmVzdF9zaGFyZS5wbmdcIjpcIi9pbWcvcGludGVyZXN0X3NoYXJlLTE3ZjQ5MTViODIyZDI5ODFiYjhiZjA5NWU3YzkwMDZiLnBuZ1wiLFwiL2ltZy9yaWNoYXJkLnBuZ1wiOlwiL2ltZy9yaWNoYXJkLTI3N2Q0ZDZmNmUzOTJjZDZlNGY4MTdkMjdjODhjZThmLnBuZ1wiLFwiL2ltZy9zYW0ucG5nXCI6XCIvaW1nL3NhbS1jZWZmZGYwYmY3MTUzMTQ0YTVjMTUwOWI1ZDVmNTJiYi5wbmdcIixcIi9pbWcvc2VhcmNoLnN2Z1wiOlwiL2ltZy9zZWFyY2gtMzdiMmQ4NzM4OWVlMGEwNTc0ODdjNjY2YzYyYjkyNTUuc3ZnXCIsXCIvaW1nL3Nob3BiZWFtLWNpcmNsZXMtaGlyZXMucG5nXCI6XCIvaW1nL3Nob3BiZWFtLWNpcmNsZXMtaGlyZXMtZTZiNmUyMzVhZmYzMTI4YmEwZTNiNDdiMjFiN2NlYmIucG5nXCIsXCIvaW1nL3Nob3BiZWFtLWNpcmNsZXMucG5nXCI6XCIvaW1nL3Nob3BiZWFtLWNpcmNsZXMtZjZkNDUyNGUxMjM2MDk4MjA2YWQ4Mzg5ZDg0MDg4MDUucG5nXCIsXCIvaW1nL3Nob3BiZWFtLWxvZ28gb2xkLnN2Z1wiOlwiL2ltZy9zaG9wYmVhbS1sb2dvIG9sZC0wNzEzZmE0MzU4MDY5NmJhOGYwZmU5ZTZlYzVjZjgwYy5zdmdcIixcIi9pbWcvc2hvcGJlYW0tbG9nby1ibGFjay1sYXJnZS5wbmdcIjpcIi9pbWcvc2hvcGJlYW0tbG9nby1ibGFjay1sYXJnZS1hZDdmZmU3MWI0ZDc1Y2U2YThiMTUxODcxODBiYWRmYy5wbmdcIixcIi9pbWcvc2hvcGJlYW0tbG9nby1ub3RleHQuc3ZnXCI6XCIvaW1nL3Nob3BiZWFtLWxvZ28tbm90ZXh0LTVhYzk3MDkxMDdmNTc3OTI1NjU1ZmIzODUwOTQyOWQ4LnN2Z1wiLFwiL2ltZy9zaG9wYmVhbS1sb2dvLXdoaXRlLnN2Z1wiOlwiL2ltZy9zaG9wYmVhbS1sb2dvLXdoaXRlLTQzZTM1NjBhNDM4YWNhMGUxZDA3MTg0ODc4MmYyYjJhLnN2Z1wiLFwiL2ltZy9zaG9wYmVhbS1sb2dvLnN2Z1wiOlwiL2ltZy9zaG9wYmVhbS1sb2dvLTBhMzc1NjJmMGI2NDQ0MjA5NGNhZjdjOWE2YWQ5NDJlLnN2Z1wiLFwiL2ltZy9zaG9wYmVhbS10ZXh0LWdyZXkucG5nXCI6XCIvaW1nL3Nob3BiZWFtLXRleHQtZ3JleS04NmFmNzRkN2E0MTJlM2RjMDE4ODgyMzBhMzU4MmFmZS5wbmdcIixcIi9pbWcvc2hvcGJlYW0tdGV4dC13aGl0ZS5wbmdcIjpcIi9pbWcvc2hvcGJlYW0tdGV4dC13aGl0ZS0yYTJjOTgzNjMxODc1MWNmZmZiYjQ2Mjg1MzRhMGZlYy5wbmdcIixcIi9pbWcvc2xpZGVyLWhpbnQucG5nXCI6XCIvaW1nL3NsaWRlci1oaW50LWEyYTc5ODlhZWVkZDAwZDcwODNhNGY0MDYwOTliMmNmLnBuZ1wiLFwiL2ltZy9zdGVwLTEucG5nXCI6XCIvaW1nL3N0ZXAtMS1mNmQ0NTI0ZTEyMzYwOTgyMDZhZDgzODlkODQwODgwNS5wbmdcIixcIi9pbWcvc3RlcC0yLnBuZ1wiOlwiL2ltZy9zdGVwLTItYTJlNTc1ZTZjMGFhM2JmYzczMTk0OTg4ZmZlMTIyZWQucG5nXCIsXCIvaW1nL3N0ZXAtMy5wbmdcIjpcIi9pbWcvc3RlcC0zLTFmMDZiMGEzYzY5NWY3MTQzMzY5NGZhMTc1ZWE5OWUyLnBuZ1wiLFwiL2ltZy9zdGVwLTQucG5nXCI6XCIvaW1nL3N0ZXAtNC04Mzg0ZTU2ZDkzMzczYjU4ODRhNDU4ZmIwODI4MmFhMi5wbmdcIixcIi9pbWcvc3RlcHMtYXJyb3ctYi5wbmdcIjpcIi9pbWcvc3RlcHMtYXJyb3ctYi00NzcyZDY0MTViN2Y3YzVhN2RiYjYyNjlmMGYzMjg3Yi5wbmdcIixcIi9pbWcvc3RlcHMtYXJyb3ctYmwucG5nXCI6XCIvaW1nL3N0ZXBzLWFycm93LWJsLTRmMTk0NTgyOGZkNjFmZTgxOTRhNDI2NWQ4MzIwMTgzLnBuZ1wiLFwiL2ltZy9zdGVwcy1hcnJvdy1yLnBuZ1wiOlwiL2ltZy9zdGVwcy1hcnJvdy1yLTE0ODJiODgyNjJjMDNkNjk0YzlkODE1YzJmZjcwYzAxLnBuZ1wiLFwiL2ltZy92aXNhLWxvZ28uZ2lmXCI6XCIvaW1nL3Zpc2EtbG9nby0xZTQwOGY2M2NhMDM5NDIxZTMxYzU3MmFiYjcyZDNlNi5naWZcIixcIi9pbWcvdmlzdWFsLmpwZ1wiOlwiL2ltZy92aXN1YWwtZmEzM2VlNzI4YWQzNzJmMWY0OTIyM2JlNWE3ODFjYzcuanBnXCIsXCIvaW1nL3pvb21pbi5zdmdcIjpcIi9pbWcvem9vbWluLTNkMzVhN2Q3MTk5ODIyNDZkNmFlMzYyMWQ4YzY3OThmLnN2Z1wiLFwiL3N3Zi8uRFNfU3RvcmVcIjpcIi9zd2YvLkRTX1N0b3JlLTE5ZjBjOWMxYTUzZTA5OTRhYWNkZjYzOGM0YTVjNjlhXCIsXCIvY3NzL2ljb21vb24vc2VsZWN0aW9uLmpzb25cIjpcIi9jc3MvaWNvbW9vbi9zZWxlY3Rpb24tOGUwMmY4YzkzNWU5NWZhYzZkMjJlOTM4NTk2NzNlMmIuanNvblwiLFwiL2Nzcy9pY29tb29uL3N0eWxlLmNzc1wiOlwiL2Nzcy9pY29tb29uL3N0eWxlLTFkOGRhYmI0NGMzZTFmMTU4NTMyYzliMTg2N2VkZTgyLmNzc1wiLFwiL2Nzcy9mb250cy9pY29tb29uLmRldi5zdmdcIjpcIi9jc3MvZm9udHMvaWNvbW9vbi5kZXYtMDZjZmQzNDg5YmEyMjMzYTVjZWY3NjBiNDM3Mzk4YzMuc3ZnXCIsXCIvY3NzL2ZvbnRzL2ljb21vb24uZW90XCI6XCIvY3NzL2ZvbnRzL2ljb21vb24tZDc1MWJjZTQ2MGI4ZTdiNWYwYzBjODI4NDliMzY3NGMuZW90XCIsXCIvY3NzL2ZvbnRzL2ljb21vb24uc3ZnXCI6XCIvY3NzL2ZvbnRzL2ljb21vb24tMDdkOTNlMGZjZWI2MWMwYTM1YWFlNzliZGNiN2U3NjAuc3ZnXCIsXCIvY3NzL2ZvbnRzL2ljb21vb24udHRmXCI6XCIvY3NzL2ZvbnRzL2ljb21vb24tZWMzZmI3MDFkZjM1MDNhY2NjOTE3NzJkNTU2NzRjOWMudHRmXCIsXCIvY3NzL2ZvbnRzL2ljb21vb24ud29mZlwiOlwiL2Nzcy9mb250cy9pY29tb29uLTRlNGY2ZjA2NTZhZWI1N2YxMTAyY2FiMGQwOTFmMTA2LndvZmZcIixcIi9jc3MvY2xvdWR6b29tL2FqYXgtbG9hZGVyLmdpZlwiOlwiL2Nzcy9jbG91ZHpvb20vYWpheC1sb2FkZXItYmUxY2VkZTk3Mjg5YzEzOTIwMDQ4ZjIzOGZkMzdiODUuZ2lmXCIsXCIvY3NzL2Nsb3Vkem9vbS9ibGFuay5wbmdcIjpcIi9jc3MvY2xvdWR6b29tL2JsYW5rLTJhYTgzNDM1MjBlZjczM2U5N2QzZDFiYTU3YzkzYmE5LnBuZ1wiLFwiL2Nzcy9jbG91ZHpvb20vY2xvdWR6b29tLmNzc1wiOlwiL2Nzcy9jbG91ZHpvb20vY2xvdWR6b29tLTEwZGU4ZTY3NDYxZjg0YjNiYTZiYmQzZmIxYTJmN2IyLmNzc1wiLFwiL2Nzcy9tYWlsZXIvbWFpbi5zdHlsXCI6XCIvY3NzL21haWxlci9tYWluLWVlMTZhY2I2NGJkMjIwZjU1MjAwYjcyNTgyMTQwNWY0LnN0eWxcIixcIi9jc3Mvc2VsZWN0Mi9zZWxlY3QyLXNwaW5uZXIuZ2lmXCI6XCIvY3NzL3NlbGVjdDIvc2VsZWN0Mi1zcGlubmVyLTdiOTc3NjA3NmQ1ZmNlZWY0OTkzYjU1YzkzODNkZWRkLmdpZlwiLFwiL2Nzcy9zZWxlY3QyL3NlbGVjdDIuY3NzXCI6XCIvY3NzL3NlbGVjdDIvc2VsZWN0Mi0yYjE4MjY1NmM1ZDc3ODAyM2QzYWU4ZTE4NTI5OWIzZS5jc3NcIixcIi9jc3Mvc2VsZWN0Mi9zZWxlY3QyLnBuZ1wiOlwiL2Nzcy9zZWxlY3QyL3NlbGVjdDItMmNhNjFiNzZlMjIwNTM1NzFkZDg2MTFlNWFhYzQ5MDAucG5nXCIsXCIvY3NzL3NlbGVjdDIvc2VsZWN0MngyLnBuZ1wiOlwiL2Nzcy9zZWxlY3QyL3NlbGVjdDJ4Mi00OWUzZjAwNjAxODY2MmY2MGYxZGIyYWVjMGIyY2NhOS5wbmdcIixcIi9jc3Mvc2lsdmlvbW9yZXRvL2Jvb3RzdHJhcC1zZWxlY3QuY3NzXCI6XCIvY3NzL3NpbHZpb21vcmV0by9ib290c3RyYXAtc2VsZWN0LWFlY2Q3MWQxYjcwZjgzOTI1NDhlZjA4ZjFiNmJiMTdkLmNzc1wiLFwiL3N3Zi9zd2ZvYmplY3QvZXhwcmVzc0luc3RhbGwuc3dmXCI6XCIvc3dmL3N3Zm9iamVjdC9leHByZXNzSW5zdGFsbC03YjY1ZmJmYWVjOGIyOTU1MDkwMzg5YWY2MDY0NmU4Yi5zd2ZcIixcIi9zd2Yvd2lkZ2V0cy9zaW5nbGUtdmFyaWFudC5zd2ZcIjpcIi9zd2Yvd2lkZ2V0cy9zaW5nbGUtdmFyaWFudC04YTkyZThmNWQ1YzIyMWVhOTQ3YjFlNmRhMjU5Yjc1My5zd2ZcIixcIi9zd2Yvd2lkZ2V0cy90ZXh0TGF5b3V0XzEuMC4wLjU5NS5zd3pcIjpcIi9zd2Yvd2lkZ2V0cy90ZXh0TGF5b3V0XzEuMC4wLjU5NS0yNDI3ODJhNjZjM2JjZDIzMmY4MTI4ZjVhYmQ5ZTVkNC5zd3pcIixcIi9jc3MvaWNvbW9vbi9mb250cy9zaG9wYmVhbS1zZXQudHRmXCI6XCIvY3NzL2ljb21vb24vZm9udHMvc2hvcGJlYW0tc2V0LTAwNzhlOWRkNWNiNGE1OWI2ODYzZmJlYzhmZjI2Nzk5LnR0ZlwiLFwiL2Nzcy9pY29tb29uL2ZvbnRzL3Nob3BiZWFtLXNldC5lb3RcIjpcIi9jc3MvaWNvbW9vbi9mb250cy9zaG9wYmVhbS1zZXQtNzQyZTMyOWMzMjk1Y2VhNDEzMzM2ZGJjMjIxMDczYWEuZW90XCIsXCIvY3NzL2ljb21vb24vZm9udHMvc2hvcGJlYW0tc2V0LndvZmZcIjpcIi9jc3MvaWNvbW9vbi9mb250cy9zaG9wYmVhbS1zZXQtMDczMmViMjkyOGUxZWU2NzY4MDc2OWQ0ZjUzNmM4ZDIud29mZlwiLFwiL2Nzcy9pY29tb29uL2ZvbnRzL3Nob3BiZWFtLXNldC5zdmdcIjpcIi9jc3MvaWNvbW9vbi9mb250cy9zaG9wYmVhbS1zZXQtN2ZjYzZiMTAzYTM0MzcwZTdiODk5M2E2NzRjODY3MjEuc3ZnXCIsXCIvY3NzL2xhbmRpbmcvZmFuY3lib3gvYmxhbmsuZ2lmXCI6XCIvY3NzL2xhbmRpbmcvZmFuY3lib3gvYmxhbmstMzI1NDcyNjAxNTcxZjMxZTFiZjAwNjc0YzM2OGQzMzUuZ2lmXCIsXCIvY3NzL2xhbmRpbmcvZmFuY3lib3gvZmFuY3lib3hfbG9hZGluZy5naWZcIjpcIi9jc3MvbGFuZGluZy9mYW5jeWJveC9mYW5jeWJveF9sb2FkaW5nLTMyOGNjMGY2Yzc4MjExNDg1MDU4ZDQ2MGU4MGY0ZmE4LmdpZlwiLFwiL2Nzcy9sYW5kaW5nL2ZhbmN5Ym94L2ZhbmN5Ym94X2xvYWRpbmdAMnguZ2lmXCI6XCIvY3NzL2xhbmRpbmcvZmFuY3lib3gvZmFuY3lib3hfbG9hZGluZ0AyeC1mOTI5Mzg2MzlmYTg5NGEwZThkZWQxYzMzNjhhYmU5OC5naWZcIixcIi9jc3MvbGFuZGluZy9mYW5jeWJveC9mYW5jeWJveF9zcHJpdGVAMngucG5nXCI6XCIvY3NzL2xhbmRpbmcvZmFuY3lib3gvZmFuY3lib3hfc3ByaXRlQDJ4LWVkOTk3MGNlMjIyNDI0MjFlNjZmZjE1MGFhOTdmZTVmLnBuZ1wiLFwiL2Nzcy9sYW5kaW5nL2ZhbmN5Ym94L2ZhbmN5Ym94X3Nwcml0ZS5wbmdcIjpcIi9jc3MvbGFuZGluZy9mYW5jeWJveC9mYW5jeWJveF9zcHJpdGUtNzgzZDQwMzFmZTUwYzNkODNjOTYwOTExZTFmYmM3MDUucG5nXCIsXCIvY3NzL2xhbmRpbmcvZm9udHMvUmVhZCBNZS50eHRcIjpcIi9jc3MvbGFuZGluZy9mb250cy9SZWFkIE1lLTE2NGFiZDY3M2QwYzFiYmExNjBjOGNmZmJhNGY0NDVjLnR4dFwiLFwiL2Nzcy9sYW5kaW5nL2ZhbmN5Ym94L2ZhbmN5Ym94X292ZXJsYXkucG5nXCI6XCIvY3NzL2xhbmRpbmcvZmFuY3lib3gvZmFuY3lib3hfb3ZlcmxheS03N2FlYWE1MjcxNWI4OThiNzNjNzRkNjhjNjMwMzMwZS5wbmdcIixcIi9jc3MvbGFuZGluZy9mb250cy9pY29tb29uLmRldi5zdmdcIjpcIi9jc3MvbGFuZGluZy9mb250cy9pY29tb29uLmRldi1jOTM4YTZjNmM1ZTI0ODVmYmM4Y2EyNGVmMDgyY2UyYS5zdmdcIixcIi9jc3MvbGFuZGluZy9mb250cy9pY29tb29uLmVvdFwiOlwiL2Nzcy9sYW5kaW5nL2ZvbnRzL2ljb21vb24tZjFjOTRhODcwMGI2MTM4NzdjZDUyYjdmZDEwZTYwZjAuZW90XCIsXCIvY3NzL2xhbmRpbmcvZm9udHMvaWNvbW9vbi5zdmdcIjpcIi9jc3MvbGFuZGluZy9mb250cy9pY29tb29uLTMxZmE3ZGE2YTk1NTVkMzNjYjhjZTYyMzMzMzQ1OTFmLnN2Z1wiLFwiL2Nzcy9sYW5kaW5nL2ZvbnRzL2ljb21vb24udHRmXCI6XCIvY3NzL2xhbmRpbmcvZm9udHMvaWNvbW9vbi1lMDBhZmQ4OTA4OTA0YTlmYWE5NTI5MzBkZWZmYjYyMS50dGZcIixcIi9jc3MvbGFuZGluZy9mb250cy9pY29tb29uLndvZmZcIjpcIi9jc3MvbGFuZGluZy9mb250cy9pY29tb29uLWQ1NjJmMTk5ZTE0YmUwNTNkNjdmMTFhNTQ4ODlhMGM2LndvZmZcIixcIi9jc3MvbGFuZGluZy9mb250cy9pbmRleC5odG1sXCI6XCIvY3NzL2xhbmRpbmcvZm9udHMvaW5kZXgtNWQ0NWUyMWIyMTQ3M2Q3ZmY3ZDRkODk5MjRiNmJmNWEuaHRtbFwiLFwiL2pzL2xpYi9hZ3J1Ymxldi9hbmd1bGFyTG9jYWxTdG9yYWdlLmpzXCI6XCIvanMvbGliL2FncnVibGV2L2FuZ3VsYXJMb2NhbFN0b3JhZ2UtNDNlMTZlMWRkMTc0ZWZiZjk1NTkyZmVlYmM0ZGZjM2QuanNcIixcIi9qcy9saWIvYm9vdHN0cmFwL2Jvb3RzdHJhcC5qc1wiOlwiL2pzL2xpYi9ib290c3RyYXAvYm9vdHN0cmFwLTE2ZmUxMWVhNGRhYTc2NTliYWJmOGMyYTVhYWE0YWVlLmpzXCIsXCIvanMvbGliL2FuZ3VsYXIvYW5ndWxhci1jb29raWVzLmpzXCI6XCIvanMvbGliL2FuZ3VsYXIvYW5ndWxhci1jb29raWVzLTY1YjViYTZjMWM1OGZkMDU3YTJmOTVlMGUzNmFhZGYyLmpzXCIsXCIvanMvbGliL2FuZ3VsYXIvYW5ndWxhci0xLjIuMy1jdXN0b20uanNcIjpcIi9qcy9saWIvYW5ndWxhci9hbmd1bGFyLTEuMi4zLWN1c3RvbS00ZTYyODZjNDE4ZTU1YjEzMWVhNjlkZGY2YmM1NmM5OC5qc1wiLFwiL2pzL2xpYi9hbmd1bGFyL2FuZ3VsYXItcm91dGUuanNcIjpcIi9qcy9saWIvYW5ndWxhci9hbmd1bGFyLXJvdXRlLTdhMTJjMjNmMWZlMjU5ZDcyYzVkNDFkNmUxMTM3NjVhLmpzXCIsXCIvanMvbGliL2FuZ3VsYXIvYW5ndWxhci1yZXNvdXJjZS5qc1wiOlwiL2pzL2xpYi9hbmd1bGFyL2FuZ3VsYXItcmVzb3VyY2UtNWM3YzY0MTc2MTAyMmEyZjYxNzYyNGY4MDc2YWFkOTkuanNcIixcIi9qcy9saWIvYW5ndWxhci9hbmd1bGFyLmpzXCI6XCIvanMvbGliL2FuZ3VsYXIvYW5ndWxhci03ZjljMTA2M2VmMDcxZTEzNGU2ZjRjZWI3NTk4ZTk3MS5qc1wiLFwiL2pzL2xpYi9hbmd1bGFyL2FuZ3VsYXItcm91dGUubWluLmpzXCI6XCIvanMvbGliL2FuZ3VsYXIvYW5ndWxhci1yb3V0ZS5taW4tMmUyZDk1ODE4OGU4MjNmNjZhYWNlYjlhYzEwY2QzZmQuanNcIixcIi9qcy9saWIvYW5ndWxhci9hbmd1bGFyLm1pbi5qc1wiOlwiL2pzL2xpYi9hbmd1bGFyL2FuZ3VsYXIubWluLWI3ODhjMGRkOWMzNTNkNDkwZWY4OTQzN2ZlN2EzYWVhLmpzXCIsXCIvanMvbGliL2Vhc3lYRE0vTUlULWxpY2Vuc2UudHh0XCI6XCIvanMvbGliL2Vhc3lYRE0vTUlULWxpY2Vuc2UtZjU5MmJkNDgzNTZhYjMwYzkzODE1OTQ1ZTllMjliZTAudHh0XCIsXCIvanMvbGliL2Vhc3lYRE0vZWFzeVhETS5XaWRnZXRzLmpzXCI6XCIvanMvbGliL2Vhc3lYRE0vZWFzeVhETS5XaWRnZXRzLWQ2N2ZjYWZkM2I1YThjMzZlZmNiMDUyY2Q1ODc0MTg3LmpzXCIsXCIvanMvbGliL2FuZ3VsYXIvYW5ndWxhci0xLjIuMy1jdXN0b20ubWluLmpzXCI6XCIvanMvbGliL2FuZ3VsYXIvYW5ndWxhci0xLjIuMy1jdXN0b20ubWluLTI3YzQwOTc0ZDk0YzUxM2QzNDFkZjk0YWY5N2I1YmExLmpzXCIsXCIvanMvbGliL2Vhc3lYRE0vZWFzeVhETS5XaWRnZXRzLmRlYnVnLmpzXCI6XCIvanMvbGliL2Vhc3lYRE0vZWFzeVhETS5XaWRnZXRzLmRlYnVnLWQ2N2ZjYWZkM2I1YThjMzZlZmNiMDUyY2Q1ODc0MTg3LmpzXCIsXCIvanMvbGliL2Vhc3lYRE0vZWFzeVhETS5XaWRnZXRzLm1pbi5qc1wiOlwiL2pzL2xpYi9lYXN5WERNL2Vhc3lYRE0uV2lkZ2V0cy5taW4tZDU2MTcwYTZiZWFhOWMxYWIzNzM1MmUzM2ZkMDI2MmMuanNcIixcIi9qcy9saWIvZWFzeVhETS9lYXN5WERNLmRlYnVnLmpzXCI6XCIvanMvbGliL2Vhc3lYRE0vZWFzeVhETS5kZWJ1Zy00ZDI4NzQwOTk0MWQxZDVhZjdlNjJlOTg4YTM4OTJkMC5qc1wiLFwiL2pzL2xpYi9lYXN5WERNL2Vhc3l4ZG0uc3dmXCI6XCIvanMvbGliL2Vhc3lYRE0vZWFzeXhkbS02YmYxODdiZmRhYjhjZjlkOGYwOWRkNDhiNjRjMmI4NS5zd2ZcIixcIi9qcy9saWIvZWFzeVhETS9lYXN5WERNLm1pbi5qc1wiOlwiL2pzL2xpYi9lYXN5WERNL2Vhc3lYRE0ubWluLWIxNDgwY2ZkOTI1MTA2MmI0ZjZkNWE4YWRmOWY5MDkzLmpzXCIsXCIvanMvbGliL2Vhc3lYRE0vZWFzeVhETS5qc1wiOlwiL2pzL2xpYi9lYXN5WERNL2Vhc3lYRE0tZTNlMGU3NGZjYmRmODUyMjUzZWMxOGFhZTRiNWYxZTcuanNcIixcIi9qcy9saWIvZWFzeVhETS9qc29uMi5qc1wiOlwiL2pzL2xpYi9lYXN5WERNL2pzb24yLTY5NjQ4ZGRhNjVjNjJhMGEzZTgzNmMxMGY1ODI2YmQ2LmpzXCIsXCIvanMvbGliL2Vhc3lYRE0vbmFtZS5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vbmFtZS05OTA2MjAzNTA0MzJmNmM3ZTI4ZjFlMTExY2U1OThjOC5odG1sXCIsXCIvanMvbGliL2plc3NlQ2xpcGJvYXJkL2NvcHkuc3dmXCI6XCIvanMvbGliL2plc3NlQ2xpcGJvYXJkL2NvcHktN2U1ZjZkOTI2MGUyM2M3ZDc4MDRiOTYwN2JlM2FiNjQuc3dmXCIsXCIvanMvbGliL3NlbGVjdDIvc2VsZWN0Mi5qc1wiOlwiL2pzL2xpYi9zZWxlY3QyL3NlbGVjdDItYzVjYmRiY2M4MGI2Mjk2YjZjMzRmY2Q4OWU3MTI1ZDIuanNcIixcIi9qcy9saWIvanF1ZXJ5L2pxdWVyeS0xLjEwLjIuanNcIjpcIi9qcy9saWIvanF1ZXJ5L2pxdWVyeS0xLjEwLjItZWQ4MzgwNWQzMzI3ZjRlYjgyODMxYzE5YTA5NzYzODcuanNcIixcIi9qcy9saWIvanF1ZXJ5L2pxdWVyeS0xLjEwLjIubWluLmpzXCI6XCIvanMvbGliL2pxdWVyeS9qcXVlcnktMS4xMC4yLm1pbi01MzU0NTFlYjM3Y2FjYWVmMjc2ZDU0NmY4Yzk0MDljOS5qc1wiLFwiL2pzL2xpYi9qcXVlcnkvanF1ZXJ5LmF1dG8tbnVtZXJpYy5qc1wiOlwiL2pzL2xpYi9qcXVlcnkvanF1ZXJ5LmF1dG8tbnVtZXJpYy0yNTAyMTU1MWEwZTcwMjA5NDJlYWFjNzNjZDI2MjU4OC5qc1wiLFwiL2pzL2xpYi9qcXVlcnkvanF1ZXJ5Lm5vdWlzbGlkZXIuanNcIjpcIi9qcy9saWIvanF1ZXJ5L2pxdWVyeS5ub3Vpc2xpZGVyLTNmZTE3MmU5ODY0MzU3MjJmYTIxZTg1NjlhYjgwZDc0LmpzXCIsXCIvanMvbGliL2pxdWVyeS9qcXVlcnkubnVtYmVyLmpzXCI6XCIvanMvbGliL2pxdWVyeS9qcXVlcnkubnVtYmVyLTNhOTcxMzczY2E5ZDI1YmFjYmQ3MzVmZmFlYmZlOWUyLmpzXCIsXCIvanMvbGliL3NoaXYvRE9NUGFyc2VyLmpzXCI6XCIvanMvbGliL3NoaXYvRE9NUGFyc2VyLWUyZGQyNzVjZmI1NTdhOGI5MzZkZTMyNGRlZDlhMWIyLmpzXCIsXCIvanMvbGliL3NoaXYvY3VzdG9tRXZlbnRzLmpzXCI6XCIvanMvbGliL3NoaXYvY3VzdG9tRXZlbnRzLThjMmNmNDkxYWUxYTFmYjcyZDkyZmZlOTNkZTk0ZDRjLmpzXCIsXCIvanMvbGliL3NoaXYvZmlsdGVyLmpzXCI6XCIvanMvbGliL3NoaXYvZmlsdGVyLWZlMWVjZGFhY2E4YjczOWRjYjkyNGM3ODIwMmM3YzljLmpzXCIsXCIvanMvbGliL3NoaXYvbWFwLmpzXCI6XCIvanMvbGliL3NoaXYvbWFwLTE2MzJhZDBhMDRiYTNjNGQ2YmI5NzczYTk5OWUwNGI3LmpzXCIsXCIvanMvbGliL3NoaXYvc29tZS5qc1wiOlwiL2pzL2xpYi9zaGl2L3NvbWUtZDRiZmM0NmU2MGUwY2MwNTYxNDI5NTFiYjRlYTliYTAuanNcIixcIi9qcy9saWIvc2hpdi9zdHJpbmcuanNcIjpcIi9qcy9saWIvc2hpdi9zdHJpbmctZWI5NWVhZmE3ZmQ4NjAwMzkxMWRmNjhhOWY0NzFhYjcuanNcIixcIi9qcy9saWIvc2lsdmlvbW9yZXRvL2Jvb3RzdHJhcC1zZWxlY3QuanNcIjpcIi9qcy9saWIvc2lsdmlvbW9yZXRvL2Jvb3RzdHJhcC1zZWxlY3QtNzUzYTBjNDBjN2JhYzRjZWY4NWUzOTE0ZTJkOTg5MzAuanNcIixcIi9qcy9saWIvemVyb2NsaXBib2FyZC9aZXJvQ2xpcGJvYXJkLmpzXCI6XCIvanMvbGliL3plcm9jbGlwYm9hcmQvWmVyb0NsaXBib2FyZC02ZWVkZGQzYjVkMDViYWUyMzZiMDRhOTAxMGJhYmE5NS5qc1wiLFwiL2pzL2xpYi96ZXJvY2xpcGJvYXJkL1plcm9DbGlwYm9hcmQuc3dmXCI6XCIvanMvbGliL3plcm9jbGlwYm9hcmQvWmVyb0NsaXBib2FyZC03YTQ5NDI5ZDZjMWZlYjBjYzY4NGMwMWMzMmI2OGE5Ni5zd2ZcIixcIi9qcy9saWIvZWFzeVhETS90ZXN0cy9lYXN5VGVzdC5jc3NcIjpcIi9qcy9saWIvZWFzeVhETS90ZXN0cy9lYXN5VGVzdC1jZGNmZjQxNjIwNzY3NTIxMmI2MmNjNzI2YjI3ZjAxZi5jc3NcIixcIi9qcy9saWIvZWFzeVhETS90ZXN0cy9pbmRleC5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vdGVzdHMvaW5kZXgtMmYxN2JiZDhlYmI0NWVjMjVjYjM2NmNjYjA4MzM5ZDYuaHRtbFwiLFwiL2pzL2xpYi9lYXN5WERNL3Rlc3RzL2Vhc3lUZXN0LmpzXCI6XCIvanMvbGliL2Vhc3lYRE0vdGVzdHMvZWFzeVRlc3QtNjM2OTc1YTc2ZjYyNWMxMWJmNGNlYzUwYzc1ZGZkNmUuanNcIixcIi9qcy9saWIvZWFzeVhETS90ZXN0cy90ZXN0X25hbWVzcGFjZS5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vdGVzdHMvdGVzdF9uYW1lc3BhY2UtM2YwYWJiODE4OTEzMzdiOGEzZTk0ZTQ1Y2M0Y2MyZmEuaHRtbFwiLFwiL2pzL2xpYi9lYXN5WERNL3Rlc3RzL3Rlc3RfdHJhbnNwb3J0Lmh0bWxcIjpcIi9qcy9saWIvZWFzeVhETS90ZXN0cy90ZXN0X3RyYW5zcG9ydC1kNGM4NjIxOGU3ZDU2MWUyMWNmMWNjYTE1YTQyNjdkNi5odG1sXCIsXCIvanMvbGliL2Vhc3lYRE0vdGVzdHMvdGVzdF9ycGMuaHRtbFwiOlwiL2pzL2xpYi9lYXN5WERNL3Rlc3RzL3Rlc3RfcnBjLWJlNTc4MmVlZDFlMThlMTA0ODFhOGZiZTljNjg0ZGE5Lmh0bWxcIixcIi9qcy9saWIvZWFzeVhETS90ZXN0cy90ZXN0cy5qc1wiOlwiL2pzL2xpYi9lYXN5WERNL3Rlc3RzL3Rlc3RzLTFkZDA1Nzg4Y2Q2MWEwZDRlNzU0NTNhMzEwOTQ2NGRjLmpzXCIsXCIvanMvbGliL2Vhc3lYRE0vdGVzdHMvZWFzeVhETS5kZWJ1Zy5qc1wiOlwiL2pzL2xpYi9lYXN5WERNL3Rlc3RzL2Vhc3lYRE0uZGVidWctNWM4NzM3YWRlYTNkYTFlMDgyYjgwNjUxNDQxMGEzMzguanNcIixcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL2JsYW5rLmh0bWxcIjpcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL2JsYW5rLTM1MWM1OGZiZjgxMWI3M2U4MDU1NjRhMjljMjllY2Q4Lmh0bWxcIixcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL2Jvb2ttYXJrLmh0bWxcIjpcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL2Jvb2ttYXJrLThkNDhhOTYxYzY5NTBiMGY3YTAyZjkzOTdmYWNiZTA0Lmh0bWxcIixcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL2Jvb2ttYXJrLmpzXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS9ib29rbWFyay05YjdhYTc1MmI1ZTViYTA3YTMyMTgwM2ZlZWNkZWZkNi5qc1wiLFwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvZGF0YS5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS9kYXRhLWRhM2I0NzcyMmFkMjhkZGM0MGM5N2VlNDI1Mzc2NzRmLmh0bWxcIixcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL2JyaWRnZS5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS9icmlkZ2UtODhlNzM0ZTEyMTI4YTQ3OWQxMTBmYjMxOTY3MDFjN2EuaHRtbFwiLFwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvZ2xvc3NhcnkuYXNweFwiOlwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvZ2xvc3NhcnktN2M3ZDkwZTAwNjQ2NWE5YzI5MGRiYmNmZjdmNjAzMGIuYXNweFwiLFwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvaW5kZXguaHRtbFwiOlwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvaW5kZXgtZmE4MzkwYTA0M2EzM2QxN2Y3ZjM5NjhiNmYwNTUwOTMuaHRtbFwiLFwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvbWV0aG9kcy5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS9tZXRob2RzLWJhNTRhNTk2OGQxYmJjMGRhZTI5OGYzMjRiZjUwM2ZjLmh0bWxcIixcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL3JlbW90ZS5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS9yZW1vdGUtMzhhZTkwNGVmYzQ1ZTExMDc3OTYwM2Y5NDY0NGU1MzguaHRtbFwiLFwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvcmVtb3RlYXBwLmh0bWxcIjpcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL3JlbW90ZWFwcC0wODNkZmIxZGIwNDZlMjY5MmFmOTM1Y2FjOTEwZTE3Yi5odG1sXCIsXCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS9yZW1vdGVkYXRhLmh0bWxcIjpcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL3JlbW90ZWRhdGEtMzE3MTljZWU0ZjdjMDVhY2U3ZDg2MDg0ZDIxODMyZmUuaHRtbFwiLFwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvcmVtb3RlbWV0aG9kcy5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS9yZW1vdGVtZXRob2RzLWQxNmZiNDQ0MDdlMmVmNWJkNDYwNTM0NzU3N2JkYmYxLmh0bWxcIixcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL3JlbW90ZXJwY2JhY2tlbmQuaHRtbFwiOlwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvcmVtb3RlcnBjYmFja2VuZC05ZjZmYjcxYmNjODRlYmY5M2QxM2RiZDMzYTlkMDFlNC5odG1sXCIsXCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS9yZW1vdGV0cmFuc3BvcnQuaHRtbFwiOlwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvcmVtb3RldHJhbnNwb3J0LWNhOTExOGZkMTExYTA2YjI1ZWUyODZmNjFhMTQ5ZTk1Lmh0bWxcIixcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL3Jlc2l6ZV9pZnJhbWUuaHRtbFwiOlwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvcmVzaXplX2lmcmFtZS02YmYyOGUwMTczOTEyOWQ1NDMwNzBlYzJhOGY5ZDJiNC5odG1sXCIsXCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS9yZXNpemVfaW50ZXJtZWRpYXRlLmh0bWxcIjpcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL3Jlc2l6ZV9pbnRlcm1lZGlhdGUtOGZlYmEwNTI1NmM3YzcyNzRkNzRiNmJkZGNiZGNjZGMuaHRtbFwiLFwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvcmVzaXplZF9pZnJhbWVfMS5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS9yZXNpemVkX2lmcmFtZV8xLThiZmNhNjg5ODMxNTA3MjBhM2YxYjQ3MzliN2U1ZDE2Lmh0bWxcIixcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL3Jlc2l6ZWRfaWZyYW1lXzIuaHRtbFwiOlwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvcmVzaXplZF9pZnJhbWVfMi1hZjllZWI3YmVkZTU5YjFmMzQ4NmExMDcwOWZjOGFkMS5odG1sXCIsXCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS90cmFuc3BvcnQuaHRtbFwiOlwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvdHJhbnNwb3J0LTk2Y2YzYTQ2YjVkNzQxODQxOTM3MmY3MWM5NmZkMWRiLmh0bWxcIixcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL3VwbG9hZC5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS91cGxvYWQtYmY3MjMxNTg1NjNmMTI2MmUwNjg4NjI4N2IzZWYyMGMuaHRtbFwiLFwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvdXBsb2FkX2hhbmRsZXIuYXNweFwiOlwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvdXBsb2FkX2hhbmRsZXItMzBlNzQyOGU3MGVhOTE3NGJhZThhYzAyYTU1ZDYzZmUuYXNweFwiLFwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvdXBsb2FkX3JwYy5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS91cGxvYWRfcnBjLTkxMGFjM2RjNzE5ZDk4NGI3ZmI2MWQ4YjQ1OWE3MjExLmh0bWxcIixcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL3dpZGdldC5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS93aWRnZXQtZTkyNjUxYWRhMjkzZTJhZGMwMWM1NTQ4YWZkYmNjOGMuaHRtbFwiLFwiL2pzL2xpYi9lYXN5WERNL2V4YW1wbGUvd2lkZ2V0cy5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS93aWRnZXRzLWY3ZTYwMjdkNjdjYzgwMWUzODU1ZWM2NjZmMmZiYjEzLmh0bWxcIixcIi9qcy9saWIvZWFzeVhETS9leGFtcGxlL3hoci5odG1sXCI6XCIvanMvbGliL2Vhc3lYRE0vZXhhbXBsZS94aHItZDcyYjkzMzM2ZjZlN2EzZTdkNjUzZWNjODEwMWMxODQuaHRtbFwiLFwiL2pzL2xpYi9lYXN5WERNL2NvcnMvaW5kZXguaHRtbFwiOlwiL2pzL2xpYi9lYXN5WERNL2NvcnMvaW5kZXgtNDM0ZWY0Mzg5NDU1NDljMGQ3YzQwOWFmNjczZDJhMWEuaHRtbFwiLFwiL2pzL3JlZ2lzdGVyLmJ1bmRsZS5qc1wiOlwiL2pzL3JlZ2lzdGVyLmJ1bmRsZS02MmM1NjhhNzQyYTFiZjNkM2U1OTk0NjBlOWVjZGJiNS5qc1wiLFwiL2pzL2xhbmRpbmcuYnVuZGxlLmpzXCI6XCIvanMvbGFuZGluZy5idW5kbGUtOGZjMjEyMDlmZDdlMjg1MGZiM2I2ODhjOTg4OGMwOTguanNcIixcIi9qcy9kYXNoYm9hcmQuYnVuZGxlLmpzXCI6XCIvanMvZGFzaGJvYXJkLmJ1bmRsZS04NzI2NjQ1OGU3MTQxYTdiMWZhZmU3N2ZkMDY3ZWRjOS5qc1wiLFwiL2pzL3dpZGdldC5idW5kbGUuanNcIjpcIi9qcy93aWRnZXQuYnVuZGxlLWI1MGM5Mjg2ZGUyMDA5ZjY2ZWM0MmNhZTczZjQ4YTFhLmpzXCIsXCIvanMvbGlnaHRib3guYnVuZGxlLmpzXCI6XCIvanMvbGlnaHRib3guYnVuZGxlLTEzZWU4NGQzOWYxNmU3MGMyNTNlNGI4ZmM0Mzk2MGRmLmpzXCIsXCIvanMvY2FydC5idW5kbGUuanNcIjpcIi9qcy9jYXJ0LmJ1bmRsZS04MDY1MGFjOTI5YmEzYmNmNzA0M2U5NDhkM2U2ZGZkMS5qc1wiLFwiL2pzL2NoZWNrb3V0LmJ1bmRsZS5qc1wiOlwiL2pzL2NoZWNrb3V0LmJ1bmRsZS1lMWVmMmUyNGE4MmMxZDc2MzcwZWIxODA2MTgxMjdlZC5qc1wiLFwiL2Nzcy9kYXNoYm9hcmQuY3NzXCI6XCIvY3NzL2Rhc2hib2FyZC1jMDhhYjEyOTY0ZDMwZWFhNjgzNmNjOGFhZTI4ZWUwOS5jc3NcIixcIi9jc3Mvd2lkZ2V0LmNzc1wiOlwiL2Nzcy93aWRnZXQtOTAyZTYyNjdmZGEwOTFkNThjMDg5MWYxYThiZWI2MjguY3NzXCIsXCIvY3NzL2xpZ2h0Ym94LmNzc1wiOlwiL2Nzcy9saWdodGJveC00MmMwNWJkZTRiMzVlNzFlM2VmYjg0N2Y5NDhjNjkzMy5jc3NcIixcIi9jc3MvY2FydC5jc3NcIjpcIi9jc3MvY2FydC04ZTQxYmE2MWQyNzUwNTEzZjFiN2ZjZmY1YjBmN2FiMC5jc3NcIixcIi9jc3MvY2hlY2tvdXQuY3NzXCI6XCIvY3NzL2NoZWNrb3V0LWI0YTEzYjBkNzMyODA3ZjdmMTkxMmI2Njk1MDM1ZmUxLmNzc1wiLFwiL2Nzcy9zdHlsZS1ndWlkZS5jc3NcIjpcIi9jc3Mvc3R5bGUtZ3VpZGUtN2Y4Y2MyZjMyZTBmMjgwYTA5NzZkNmNiNTBkY2M0YWUuY3NzXCIsXCIvY3NzL2xhbmRpbmcuY3NzXCI6XCIvY3NzL2xhbmRpbmctYTllOGYwZDY5NmIzMDAwY2E4ZTA2NjM4YjQzZWYxMmMuY3NzXCIsXCIvY3NzL3JlZ2lzdGVyLmNzc1wiOlwiL2Nzcy9yZWdpc3Rlci1iOWNmM2Y2NTZmYzgwZDRmZjViNzVjZWE1ZmUzYzI5Zi5jc3NcIn0sXG4gICAgdXJsOiBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYXNzZXRzW3VybF07XG4gICAgICAgIH1cbn07d2luZG93LmFwcEluZGV4ZXMgPSB7XG4nY2FydCc6IGZ1bmN0aW9uKGxvY2Fscykge1xuICAgIGxvY2FscyA9IGxvY2FscyB8fCB7fTtcbiAgICBsb2NhbHNbJ2Fzc2V0cyddID0gYXNzZXRzO1xuICAgIHJldHVybiAoZnVuY3Rpb24gYW5vbnltb3VzKGxvY2Fscykge1xudmFyIGJ1ZiA9IFtdO1xudmFyIGxvY2Fsc18gPSAobG9jYWxzIHx8IHt9KSxIT1NUID0gbG9jYWxzXy5IT1NULGFzc2V0cyA9IGxvY2Fsc18uYXNzZXRzO2J1Zi5wdXNoKFwiPCFET0NUWVBFIGh0bWw+PGh0bWwgbGFuZz1cXFwiZW5cXFwiPjxoZWFkPjx0aXRsZT5TaG9wYmVhbSBDYXJ0PC90aXRsZT48bWV0YSBodHRwLWVxdWl2PVxcXCJDb250ZW50LVR5cGVcXFwiIGNvbnRlbnQ9XFxcInRleHQvaHRtbDsgY2hhcnNldD11dGYtOFxcXCI+PG1ldGEgbmFtZT1cXFwidmlld3BvcnRcXFwiIGNvbnRlbnQ9XFxcIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcXFwiPlwiKTtcbmlmICh0eXBlb2YoSE9TVCkgPT09ICd1bmRlZmluZWQnKSB7IEhPU1QgPSAnJyB9XG5idWYucHVzaChcIjxsaW5rXCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAncmVsJzooXCJzdHlsZXNoZWV0XCIpLCAnaHJlZic6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9jc3MvY2FydC5jc3MnKSkgKyBcIlwiKSB9LCB7XCJyZWxcIjp0cnVlLFwiaHJlZlwiOnRydWV9KSkgKyBcIj48IS0tW2lmIGx0IElFIDEwXT5cIik7XG5pZiAodHlwZW9mKEhPU1QpID09PSAndW5kZWZpbmVkJykgeyBIT1NUID0gJycgfVxuYnVmLnB1c2goXCI8c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooJycgKyAoSE9TVCkgKyAnJyArIChhc3NldHMudXJsKFwiL2pzL2xpYi9zaGl2L2N1c3RvbUV2ZW50cy5qc1wiKSkgKyAnJykgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PjxzY3JpcHRcIiArIChqYWRlLmF0dHJzKHsgdGVyc2U6IHRydWUsICdzcmMnOignJyArIChIT1NUKSArICcnICsgKGFzc2V0cy51cmwoXCIvanMvbGliL3NoaXYvZmlsdGVyLmpzXCIpKSArICcnKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KCcnICsgKEhPU1QpICsgJycgKyAoYXNzZXRzLnVybChcIi9qcy9saWIvc2hpdi9tYXAuanNcIikpICsgJycpIH0sIHtcInNyY1wiOnRydWV9KSkgKyBcIj48L3NjcmlwdD48c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooJycgKyAoSE9TVCkgKyAnJyArIChhc3NldHMudXJsKFwiL2pzL2xpYi9zaGl2L3NvbWUuanNcIikpICsgJycpIH0sIHtcInNyY1wiOnRydWV9KSkgKyBcIj48L3NjcmlwdD48c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooJycgKyAoSE9TVCkgKyAnJyArIChhc3NldHMudXJsKFwiL2pzL2xpYi9zaGl2L3N0cmluZy5qc1wiKSkgKyAnJykgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PjwhW2VuZGlmXS0tPlwiKTtcbmlmICh0eXBlb2YoSE9TVCkgPT09ICd1bmRlZmluZWQnKSB7IEhPU1QgPSAnJyB9XG5pZiAoIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PSAncHJvZHVjdGlvbicpKVxue1xuYnVmLnB1c2goXCI8c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooXCJcIiArIChIT1NUKSArIFwiXCIgKyAoYXNzZXRzLnVybCgnL2pzL2xpYi9qcXVlcnkvanF1ZXJ5LTEuMTAuMi5taW4uanMnKSkgKyBcIlwiKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9qcy9saWIvYW5ndWxhci9hbmd1bGFyLTEuMi4zLWN1c3RvbS5taW4uanMnKSkgKyBcIlwiKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9qcy9saWIvYW5ndWxhci9hbmd1bGFyLXJvdXRlLm1pbi5qcycpKSArIFwiXCIpIH0sIHtcInNyY1wiOnRydWV9KSkgKyBcIj48L3NjcmlwdD5cIik7XG59XG5lbHNlXG57XG5idWYucHVzaChcIjxzY3JpcHRcIiArIChqYWRlLmF0dHJzKHsgdGVyc2U6IHRydWUsICdzcmMnOihcIlwiICsgKEhPU1QpICsgXCJcIiArIChhc3NldHMudXJsKCcvanMvbGliL2pxdWVyeS9qcXVlcnktMS4xMC4yLmpzJykpICsgXCJcIikgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PjxzY3JpcHRcIiArIChqYWRlLmF0dHJzKHsgdGVyc2U6IHRydWUsICdzcmMnOihcIlwiICsgKEhPU1QpICsgXCJcIiArIChhc3NldHMudXJsKCcvanMvbGliL2FuZ3VsYXIvYW5ndWxhci0xLjIuMy1jdXN0b20uanMnKSkgKyBcIlwiKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9qcy9saWIvYW5ndWxhci9hbmd1bGFyLXJvdXRlLmpzJykpICsgXCJcIikgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PlwiKTtcbn1cbmJ1Zi5wdXNoKFwiPC9oZWFkPjxib2R5IHN0eWxlPVxcXCJiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsgbWFyZ2luOiAwOyBwYWRkaW5nOiAwO1xcXCIgY2xhc3M9XFxcImJvb3RzdHJhcC1idXR0b24tb3ZlcnJpZGVcXFwiPjxkaXYgbmctY29udHJvbGxlcj1cXFwiTWFpbkN0cmxcXFwiIGNsYXNzPVxcXCJmdWxsLWhlaWdodFxcXCI+PGRpdiBjbGFzcz1cXFwicGhvbmVcXFwiPjxidXR0b24gY2xhc3M9XFxcImJ0biBjaGVja291dFxcXCI+PGRpdiBjbGFzcz1cXFwiYmFnLWNvbnRhaW5lclxcXCI+PGRpdiBjbGFzcz1cXFwiaWNvbi1iYWctb3V0bGluZVxcXCI+PGRpdiBjbGFzcz1cXFwiaXRlbS1jb3VudFxcXCI+e3tjYXJ0Lml0ZW1Db3VudH19PC9kaXY+PC9kaXY+PC9kaXY+PGg0PlZpZXcgQ2FydDwvaDQ+PC9idXR0b24+PC9kaXY+PGRpdiBuZy1jbGljaz1cXFwiZ29Ub0NoZWNrb3V0KClcXFwiIGNsYXNzPVxcXCJkZXNrdG9wXFxcIj48ZGl2IGNsYXNzPVxcXCJiYWctY29udGFpbmVyIHozXFxcIj48ZGl2IGNsYXNzPVxcXCJpY29uLWJhZy1vdXRsaW5lXFxcIj48ZGl2IGNsYXNzPVxcXCJpdGVtLWNvdW50XFxcIj57e2NhcnQuaXRlbUNvdW50fX08L2Rpdj48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVxcXCJ6MlxcXCI+PGRpdiBjbGFzcz1cXFwidGl0bGUtYmFyIGl0ZW1zLWluLWNhcnRcXFwiPjxoMyBuZy1jbGFzcz1cXFwie2FjdGl2ZTogY2FydE9wZW59XFxcIiBuZy1wbHVyYWxpemUgY291bnQ9XFxcImNhcnQuaXRlbUNvdW50XFxcIiB3aGVuPVxcXCJ7J29uZSc6ICdJdGVtIGluIHlvdXIgY2FydCcsICdvdGhlcic6ICdJdGVtcyBpbiB5b3VyIGNhcnQnfVxcXCI+PC9oMz48L2Rpdj48L2Rpdj48ZGl2IGNhcnQtaXRlbXMgc2lkZWJhciByZWNlbnQgY2xhc3M9XFxcImNhcnQtaXRlbXMgejAgc2Nyb2xsLXNoYWRvdy1vdXRlciBmdWxsLWhlaWdodFxcXCI+PC9kaXY+PGRpdiBjbGFzcz1cXFwiejEgdmVydGljYWwtYWxpZ24tbWlkZGxlIG5vcnRvbi1jb250YWluZXJcXFwiPjxkaXYgY2xhc3M9XFxcIm5vcnRvblxcXCI+PHNjcmlwdCB0eXBlPVxcXCJ0ZXh0L2phdmFzY3JpcHRcXFwiIHNyYz1cXFwiaHR0cHM6Ly9zZWFsLnZlcmlzaWduLmNvbS9nZXRzZWFsP2hvc3RfbmFtZT13d3cuc2hvcGJlYW0uY29tJmFtcDthbXA7c2l6ZT1YUyZhbXA7YW1wO3VzZV9mbGFzaD1OTyZhbXA7YW1wO3VzZV90cmFuc3BhcmVudD1ZRVMmYW1wO2FtcDtsYW5nPWVuXFxcIj48L3NjcmlwdD48L2Rpdj48ZGl2IGNsYXNzPVxcXCJ0YWdsaW5lLWNvbnRhaW5lclxcXCI+PGg0IGNsYXNzPVxcXCJ1cHBlcmNhc2VcXFwiPnNob3Agd2hlcmUgeW91J3JlIGluc3BpcmVkLiA8L2g0PjxoND5Qb3dlcmVkIGJ5Jm5ic3A7PHNwYW4gY2xhc3M9XFxcImJvbGRcXFwiPlNob3BiZWFtPC9zcGFuPjwvaDQ+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cXFwidGl0bGUtYmFyIGNoZWNrb3V0IHoyXFxcIj48YnV0dG9uIGNsYXNzPVxcXCJidG4gdmlldy1iYWcgejAgYWN0aXZlXFxcIj48aDMgY2xhc3M9XFxcInNhZmFyaS1mb250LXdlaWdodC1vdmVycmlkZVxcXCI+Q2hlY2tvdXQ8L2gzPjwvYnV0dG9uPjwvZGl2PjwvZGl2PjwvZGl2PjxzY3JpcHRcIiArIChqYWRlLmF0dHJzKHsgdGVyc2U6IHRydWUsICdzcmMnOihcIlwiICsgKEhPU1QpICsgXCJcIiArIChhc3NldHMudXJsKCcvanMvY2FydC5idW5kbGUuanMnKSkgKyBcIlwiKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PC9ib2R5PjwvaHRtbD5cIik7O3JldHVybiBidWYuam9pbihcIlwiKTtcbn0pKGxvY2Fscylcbn0sJ2xpZ2h0Ym94JzogZnVuY3Rpb24obG9jYWxzKSB7XG4gICAgbG9jYWxzID0gbG9jYWxzIHx8IHt9O1xuICAgIGxvY2Fsc1snYXNzZXRzJ10gPSBhc3NldHM7XG4gICAgcmV0dXJuIChmdW5jdGlvbiBhbm9ueW1vdXMobG9jYWxzKSB7XG52YXIgYnVmID0gW107XG52YXIgbG9jYWxzXyA9IChsb2NhbHMgfHwge30pLEhPU1QgPSBsb2NhbHNfLkhPU1QsYXNzZXRzID0gbG9jYWxzXy5hc3NldHM7YnVmLnB1c2goXCI8IURPQ1RZUEUgaHRtbD48aHRtbCBsYW5nPVxcXCJlblxcXCI+PGhlYWQ+PHRpdGxlPlNob3BiZWFtIExpZ2h0Ym94PC90aXRsZT48bWV0YSBodHRwLWVxdWl2PVxcXCJDb250ZW50LVR5cGVcXFwiIGNvbnRlbnQ9XFxcInRleHQvaHRtbDsgY2hhcnNldD11dGYtOFxcXCI+PG1ldGEgbmFtZT1cXFwidmlld3BvcnRcXFwiIGNvbnRlbnQ9XFxcIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcXFwiPjxtZXRhIHByb3BlcnR5PVxcXCJvZzp0aXRsZVxcXCIgY29udGVudD1cXFwie3tzZWxlY3RlZFByb2R1Y3QuYnJhbmROYW1lfX0gLSB7e3NlbGVjdGVkUHJvZHVjdC5uYW1lfX1cXFwiPjxtZXRhIHByb3BlcnR5PVxcXCJvZzppbWFnZVxcXCIgY29udGVudD1cXFwie3tpbml0aWFsSW1hZ2UudXJsfX1cXFwiPjxtZXRhIHByb3BlcnR5PVxcXCJvZzpkZXNjcmlwdGlvblxcXCIgY29udGVudD1cXFwie3tzZWxlY3RlZFByb2R1Y3QuZGVzY3JpcHRpb259fVxcXCI+XCIpO1xuaWYgKHR5cGVvZihIT1NUKSA9PT0gJ3VuZGVmaW5lZCcpIHsgSE9TVCA9ICcnIH1cbmJ1Zi5wdXNoKFwiPGxpbmtcIiArIChqYWRlLmF0dHJzKHsgdGVyc2U6IHRydWUsICdyZWwnOihcInN0eWxlc2hlZXRcIiksICdocmVmJzooXCJcIiArIChIT1NUKSArIFwiXCIgKyAoYXNzZXRzLnVybCgnL2Nzcy9saWdodGJveC5jc3MnKSkgKyBcIlwiKSB9LCB7XCJyZWxcIjp0cnVlLFwiaHJlZlwiOnRydWV9KSkgKyBcIj48IS0tW2lmIGx0IElFIDEwXT5cIik7XG5pZiAodHlwZW9mKEhPU1QpID09PSAndW5kZWZpbmVkJykgeyBIT1NUID0gJycgfVxuYnVmLnB1c2goXCI8c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooJycgKyAoSE9TVCkgKyAnJyArIChhc3NldHMudXJsKFwiL2pzL2xpYi9zaGl2L2N1c3RvbUV2ZW50cy5qc1wiKSkgKyAnJykgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PjxzY3JpcHRcIiArIChqYWRlLmF0dHJzKHsgdGVyc2U6IHRydWUsICdzcmMnOignJyArIChIT1NUKSArICcnICsgKGFzc2V0cy51cmwoXCIvanMvbGliL3NoaXYvZmlsdGVyLmpzXCIpKSArICcnKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KCcnICsgKEhPU1QpICsgJycgKyAoYXNzZXRzLnVybChcIi9qcy9saWIvc2hpdi9tYXAuanNcIikpICsgJycpIH0sIHtcInNyY1wiOnRydWV9KSkgKyBcIj48L3NjcmlwdD48c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooJycgKyAoSE9TVCkgKyAnJyArIChhc3NldHMudXJsKFwiL2pzL2xpYi9zaGl2L3NvbWUuanNcIikpICsgJycpIH0sIHtcInNyY1wiOnRydWV9KSkgKyBcIj48L3NjcmlwdD48c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooJycgKyAoSE9TVCkgKyAnJyArIChhc3NldHMudXJsKFwiL2pzL2xpYi9zaGl2L3N0cmluZy5qc1wiKSkgKyAnJykgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PjwhW2VuZGlmXS0tPlwiKTtcbmlmICh0eXBlb2YoSE9TVCkgPT09ICd1bmRlZmluZWQnKSB7IEhPU1QgPSAnJyB9XG5pZiAoIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PSAncHJvZHVjdGlvbicpKVxue1xuYnVmLnB1c2goXCI8c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooXCJcIiArIChIT1NUKSArIFwiXCIgKyAoYXNzZXRzLnVybCgnL2pzL2xpYi9qcXVlcnkvanF1ZXJ5LTEuMTAuMi5taW4uanMnKSkgKyBcIlwiKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9qcy9saWIvYW5ndWxhci9hbmd1bGFyLTEuMi4zLWN1c3RvbS5taW4uanMnKSkgKyBcIlwiKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9qcy9saWIvYW5ndWxhci9hbmd1bGFyLXJvdXRlLm1pbi5qcycpKSArIFwiXCIpIH0sIHtcInNyY1wiOnRydWV9KSkgKyBcIj48L3NjcmlwdD5cIik7XG59XG5lbHNlXG57XG5idWYucHVzaChcIjxzY3JpcHRcIiArIChqYWRlLmF0dHJzKHsgdGVyc2U6IHRydWUsICdzcmMnOihcIlwiICsgKEhPU1QpICsgXCJcIiArIChhc3NldHMudXJsKCcvanMvbGliL2pxdWVyeS9qcXVlcnktMS4xMC4yLmpzJykpICsgXCJcIikgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PjxzY3JpcHRcIiArIChqYWRlLmF0dHJzKHsgdGVyc2U6IHRydWUsICdzcmMnOihcIlwiICsgKEhPU1QpICsgXCJcIiArIChhc3NldHMudXJsKCcvanMvbGliL2FuZ3VsYXIvYW5ndWxhci0xLjIuMy1jdXN0b20uanMnKSkgKyBcIlwiKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9qcy9saWIvYW5ndWxhci9hbmd1bGFyLXJvdXRlLmpzJykpICsgXCJcIikgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PlwiKTtcbn1cbmJ1Zi5wdXNoKFwiPC9oZWFkPjxib2R5IHN0eWxlPVxcXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsgbWFyZ2luOiAwOyBwYWRkaW5nOiAwO1xcXCIgY2xhc3M9XFxcImJvb3RzdHJhcC1idXR0b24tb3ZlcnJpZGVcXFwiPjxkaXYgbmctaW5jbHVkZT1cXFwiJnF1b3Q7L2xpZ2h0Ym94L3ZpZXdzL21haW4uaHRtbCZxdW90O1xcXCI+PC9kaXY+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9qcy9saWdodGJveC5idW5kbGUuanMnKSkgKyBcIlwiKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PC9ib2R5PjwvaHRtbD5cIik7O3JldHVybiBidWYuam9pbihcIlwiKTtcbn0pKGxvY2Fscylcbn0sJ3dpZGdldCc6IGZ1bmN0aW9uKGxvY2Fscykge1xuICAgIGxvY2FscyA9IGxvY2FscyB8fCB7fTtcbiAgICBsb2NhbHNbJ2Fzc2V0cyddID0gYXNzZXRzO1xuICAgIHJldHVybiAoZnVuY3Rpb24gYW5vbnltb3VzKGxvY2Fscykge1xudmFyIGJ1ZiA9IFtdO1xudmFyIGxvY2Fsc18gPSAobG9jYWxzIHx8IHt9KSxIT1NUID0gbG9jYWxzXy5IT1NULGFzc2V0cyA9IGxvY2Fsc18uYXNzZXRzO2J1Zi5wdXNoKFwiPCFET0NUWVBFIGh0bWw+PGh0bWwgbGFuZz1cXFwiZW5cXFwiPjxoZWFkPjx0aXRsZT5TaG9wYmVhbSBXaWRnZXQ8L3RpdGxlPjxtZXRhIGh0dHAtZXF1aXY9XFxcIkNvbnRlbnQtVHlwZVxcXCIgY29udGVudD1cXFwidGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04XFxcIj48bWV0YSBuYW1lPVxcXCJ2aWV3cG9ydFxcXCIgY29udGVudD1cXFwid2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMFxcXCI+PG1ldGEgcHJvcGVydHk9XFxcIm9nOnRpdGxlXFxcIiBjb250ZW50PVxcXCJ7e3NlbGVjdGVkUHJvZHVjdC5icmFuZE5hbWV9fSAtIHt7c2VsZWN0ZWRQcm9kdWN0Lm5hbWV9fVxcXCI+PG1ldGEgcHJvcGVydHk9XFxcIm9nOmltYWdlXFxcIiBjb250ZW50PVxcXCJ7e2luaXRpYWxJbWFnZS51cmx9fVxcXCI+PG1ldGEgcHJvcGVydHk9XFxcIm9nOmRlc2NyaXB0aW9uXFxcIiBjb250ZW50PVxcXCJ7e3NlbGVjdGVkUHJvZHVjdC5kZXNjcmlwdGlvbn19XFxcIj5cIik7XG5pZiAodHlwZW9mKEhPU1QpID09PSAndW5kZWZpbmVkJykgeyBIT1NUID0gJycgfVxuYnVmLnB1c2goXCI8bGlua1wiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3JlbCc6KFwic3R5bGVzaGVldFwiKSwgJ2hyZWYnOihcIlwiICsgKEhPU1QpICsgXCJcIiArIChhc3NldHMudXJsKCcvY3NzL3dpZGdldC5jc3MnKSkgKyBcIlwiKSB9LCB7XCJyZWxcIjp0cnVlLFwiaHJlZlwiOnRydWV9KSkgKyBcIj48IS0tW2lmIGx0IElFIDEwXT5cIik7XG5pZiAodHlwZW9mKEhPU1QpID09PSAndW5kZWZpbmVkJykgeyBIT1NUID0gJycgfVxuYnVmLnB1c2goXCI8c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooJycgKyAoSE9TVCkgKyAnJyArIChhc3NldHMudXJsKFwiL2pzL2xpYi9zaGl2L2N1c3RvbUV2ZW50cy5qc1wiKSkgKyAnJykgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PjxzY3JpcHRcIiArIChqYWRlLmF0dHJzKHsgdGVyc2U6IHRydWUsICdzcmMnOignJyArIChIT1NUKSArICcnICsgKGFzc2V0cy51cmwoXCIvanMvbGliL3NoaXYvZmlsdGVyLmpzXCIpKSArICcnKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KCcnICsgKEhPU1QpICsgJycgKyAoYXNzZXRzLnVybChcIi9qcy9saWIvc2hpdi9tYXAuanNcIikpICsgJycpIH0sIHtcInNyY1wiOnRydWV9KSkgKyBcIj48L3NjcmlwdD48c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooJycgKyAoSE9TVCkgKyAnJyArIChhc3NldHMudXJsKFwiL2pzL2xpYi9zaGl2L3NvbWUuanNcIikpICsgJycpIH0sIHtcInNyY1wiOnRydWV9KSkgKyBcIj48L3NjcmlwdD48c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooJycgKyAoSE9TVCkgKyAnJyArIChhc3NldHMudXJsKFwiL2pzL2xpYi9zaGl2L3N0cmluZy5qc1wiKSkgKyAnJykgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PjwhW2VuZGlmXS0tPlwiKTtcbmlmICh0eXBlb2YoSE9TVCkgPT09ICd1bmRlZmluZWQnKSB7IEhPU1QgPSAnJyB9XG5pZiAoIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PSAncHJvZHVjdGlvbicpKVxue1xuYnVmLnB1c2goXCI8c2NyaXB0XCIgKyAoamFkZS5hdHRycyh7IHRlcnNlOiB0cnVlLCAnc3JjJzooXCJcIiArIChIT1NUKSArIFwiXCIgKyAoYXNzZXRzLnVybCgnL2pzL2xpYi9qcXVlcnkvanF1ZXJ5LTEuMTAuMi5taW4uanMnKSkgKyBcIlwiKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9qcy9saWIvYW5ndWxhci9hbmd1bGFyLTEuMi4zLWN1c3RvbS5taW4uanMnKSkgKyBcIlwiKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9qcy9saWIvYW5ndWxhci9hbmd1bGFyLXJvdXRlLm1pbi5qcycpKSArIFwiXCIpIH0sIHtcInNyY1wiOnRydWV9KSkgKyBcIj48L3NjcmlwdD5cIik7XG59XG5lbHNlXG57XG5idWYucHVzaChcIjxzY3JpcHRcIiArIChqYWRlLmF0dHJzKHsgdGVyc2U6IHRydWUsICdzcmMnOihcIlwiICsgKEhPU1QpICsgXCJcIiArIChhc3NldHMudXJsKCcvanMvbGliL2pxdWVyeS9qcXVlcnktMS4xMC4yLmpzJykpICsgXCJcIikgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PjxzY3JpcHRcIiArIChqYWRlLmF0dHJzKHsgdGVyc2U6IHRydWUsICdzcmMnOihcIlwiICsgKEhPU1QpICsgXCJcIiArIChhc3NldHMudXJsKCcvanMvbGliL2FuZ3VsYXIvYW5ndWxhci0xLjIuMy1jdXN0b20uanMnKSkgKyBcIlwiKSB9LCB7XCJzcmNcIjp0cnVlfSkpICsgXCI+PC9zY3JpcHQ+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9qcy9saWIvYW5ndWxhci9hbmd1bGFyLXJvdXRlLmpzJykpICsgXCJcIikgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PlwiKTtcbn1cbmJ1Zi5wdXNoKFwiPC9oZWFkPjxib2R5IHN0eWxlPVxcXCJoZWlnaHQ6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IGJhY2tncm91bmQ6IHRyYW5zcGFyZW50OyBtYXJnaW46IDA7IHBhZGRpbmc6IDA7XFxcIiBjbGFzcz1cXFwiYm9vdHN0cmFwLWJ1dHRvbi1vdmVycmlkZVxcXCI+PGRpdiBuZy1pbmNsdWRlPVxcXCImcXVvdDsvd2lkZ2V0L3ZpZXdzL21haW4uaHRtbCZxdW90O1xcXCI+PC9kaXY+PHNjcmlwdFwiICsgKGphZGUuYXR0cnMoeyB0ZXJzZTogdHJ1ZSwgJ3NyYyc6KFwiXCIgKyAoSE9TVCkgKyBcIlwiICsgKGFzc2V0cy51cmwoJy9qcy93aWRnZXQuYnVuZGxlLmpzJykpICsgXCJcIikgfSwge1wic3JjXCI6dHJ1ZX0pKSArIFwiPjwvc2NyaXB0PjwvYm9keT48L2h0bWw+XCIpOztyZXR1cm4gYnVmLmpvaW4oXCJcIik7XG59KShsb2NhbHMpXG59fTt9KSgpO1xuO1xuXG7vu78ndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbih3aW5kb3csIHVuZGVmaW5lZCkge1xuICBpZiAoIXdpbmRvdy5TaG9wYmVhbSkge1xuICAgIHZhclxuICAgIC8vTk9URTogd2UncmUgdXNpbmcgdmFsdWVzIGhpZ2hlciB0aGF0IGFyZSBhbGxvd2VkIGJ5IHRoZSBzcGVjIGJ1dCBvbmx5IGJlY2F1c2Ugb3RoZXIgcHBsIGFyZSB0b28uLi5cbiAgICAgIC8qKiBAY29uc3QgKi8gWl8xMCA9ICsyMTQ3NDgzNjQwLFxuICAgICAgLyoqIEBjb25zdCAqLyBaXzkgPSArMjE0NzQ4MzYzMCxcbiAgICAgIC8qKiBAY29uc3QgKi8gWl84ID0gKzIxNDc0ODM2MjAsXG4gICAgICAvKiogQGNvbnN0ICovIFpfNyA9ICsyMTQ3NDgzNjEwLFxuICAgICAgLyoqIEBjb25zdCAqLyBaXzYgPSArMjE0NzQ4MzYwMCxcbiAgICAgIC8qKiBAY29uc3QgKi8gWl81ID0gKzIxNDc0ODM1OTAsXG4gICAgICAvKiogQGNvbnN0ICovIEpRVUVSWV9WRVJTSU9OID0gJzEuMTAuMidcbiAgICAgIDtcblxuICAgIHZhciBxID0gcmVxdWlyZSgnLi4vLi4vLi4vc2hhcmVkL2xpYi9rcmlza293YWwvcScpXG4gICAgICAsIHBtcnBjID0gcmVxdWlyZSgnLi4vLi4vLi4vc2hhcmVkL2xpYi9penV6YWsvcG1ycGMnKVxuICAgICAgLCAkID0gcmVxdWlyZSgnLi9idWlsZCcpXG4gICAgICAsIGRlZmVycmVkQm9keSA9IHEuZGVmZXIoKVxuICAgICAgLCBkZWZlcnJlZExpZ2h0Ym94UmVhZHkgPSBxLmRlZmVyKClcbiAgICAgICwgYm9keVByb21pc2UgPSBkZWZlcnJlZEJvZHkucHJvbWlzZVxuICAgICAgLCBiYXNlID0ge1xuICAgICAgICB0cmFuc2l0aW9uOiAnd2lkdGggNTAwbXMgZWFzZSwgaGVpZ2h0IDUwMG1zIGVhc2UnLFxuICAgICAgICBwb3NpdGlvbiAgOiAnZml4ZWQnLFxuICAgICAgICBib3R0b20gICAgOiAwLFxuICAgICAgICByaWdodCAgICAgOiAwLFxuICAgICAgICBib3JkZXIgICAgOiAwLFxuICAgICAgICBtYXJnaW4gICAgOiAwLFxuICAgICAgICBwYWRkaW5nICAgOiAwLFxuICAgICAgICAnei1pbmRleCcgOiBaXzdcbiAgICAgIH1cbiAgICAgIDtcblxuICAgIHdpbmRvdy5TaG9wYmVhbSA9IHtcbiAgICAgIC8qKiBAY29uc3QgKi8gc3dmT3BlbkxpZ2h0Ym94ICAgICAgOiBmdW5jdGlvbih1dWlkKSB7XG4gICAgICAgIHBtcnBjLmNhbGwoe1xuICAgICAgICAgIGRlc3RpbmF0aW9uICAgICAgICA6ICdwdWJsaXNoJyxcbiAgICAgICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnd2lkZ2V0T3BlbkxpZ2h0Ym94JyArIHV1aWRcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgLyoqIEBjb25zdCAqLyBKUVVFUllfVkVSU0lPTiAgICAgICA6IEpRVUVSWV9WRVJTSU9OLFxuICAgICAgLyoqIEBjb25zdCAqLyBKUVVFUllfSFJFRiAgICAgICAgICA6ICcvL2FqYXguZ29vZ2xlYXBpcy5jb20vYWpheC9saWJzL2pxdWVyeS8nICsgSlFVRVJZX1ZFUlNJT04gKyAnL2pxdWVyeS5taW4uanMnLFxuICAgICAgLyoqIEBjb25zdCAqLyBJTUFHRV9XSURHRVRfU0VMRUNUT1I6ICdpbWdbaWQqPVwic2hvcGJlYW0td2lkZ2V0LWltYWdlLXBsYWNlaG9sZGVyXCJdJyxcbiAgICAgIC8qKiBAY29uc3QgKi8gVEVYVF9XSURHRVRfU0VMRUNUT1IgOiAnYVtpZCo9XCJzaG9wYmVhbS13aWRnZXQtdGV4dC1saW5rXCJdJyxcbiAgICAgIC8qKiBAY29uc3QgKi8gU1dGX0lGUkFNRV9TRUxFQ1RPUiAgOiAnaWZyYW1lLnNob3BiZWFtLWZsYXNoLWZyYW1lJyxcbiAgICAgIC8qKiBAY29uc3QgKi8gU1dGX1dJREdFVF9TRUxFQ1RPUiAgOiAnb2JqZWN0W2lkKj1cInNob3BiZWFtLXdpZGdldC1zd2ZcIl0nLFxuICAgICAgLyoqIEBjb25zdCAqLyBIT1NUICAgICAgICAgICAgICAgICA6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3NjcmlwdC5zaG9wYmVhbS1zY3JpcHQnKS5zcmMubWF0Y2goLyheLiopXFwvanNcXC93aWRnZXQubG9hZGVyLmpzJC8pWzFdLFxuICAgICAgLyoqIEBjb25zdCAqLyBET0NVTUVOVF9ST09UICAgICAgICA6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2hlYWQnKSB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JyksXG4gICAgICAvKiogQGNvbnN0ICovIERPQ1VNRU5UX0hFQUQgICAgICAgIDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaGVhZCcpLFxuICAgICAgLyoqIEBjb25zdCAqLyBET0NVTUVOVF9CT0RZICAgICAgICA6IGJvZHlQcm9taXNlLCAvL2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKSxcbiAgICAgIC8qKiBAY29uc3QgKi8gTElHSFRCT1hfREVGQVVMVF9DU1MgOiB7cG9zaXRpb246ICdmaXhlZCcsIHRvcDogMCwgbGVmdDogMCwgYm90dG9tOiAwLCByaWdodDogMCwgYm9yZGVyOiAwLCBtYXJnaW46IDAsIHBhZGRpbmc6IDAsIHdpZHRoOiAnMTAwJScsIGhlaWdodDogJzEwMCUnLCAnei1pbmRleCc6IFpfOH0sXG4gICAgICAvKiogQGNvbnN0ICovIExJR0hUQk9YX0hJRERFTl9DU1MgIDoge3Zpc2liaWxpdHk6ICdoaWRkZW4nLCBvcGFjaXR5OiAwLCBkaXNwbGF5OiAnbm9uZSd9LFxuICAgICAgLyoqIEBjb25zdCAqLyBXSURHRVRfREVGQVVMVF9DU1MgICA6IHtwb3NpdGlvbjogJ2Fic29sdXRlJywgdG9wOiAwLCBsZWZ0OiAwLCBib3JkZXI6IDAsIG1hcmdpbjogMCwgcGFkZGluZzogMH0sXG4gICAgICAvKiogQGNvbnN0ICovIFdJREdFVF9ISURERU5fQ1NTICAgIDoge3Zpc2liaWxpdHk6ICdoaWRkZW4nLCBvcGFjaXR5OiAwfSxcblxuICAgICAgLyoqIEBjb25zdCAqLyBDQVJUX0RFRkFVTFRfUEhPTkVfQ1NTOiBiYXNlLFxuICAgICAgLyoqIEBjb25zdCAqLyBDQVJUX1ZJU0lCTEVfUEhPTkVfQ1NTOiB7aGVpZ2h0OiAnNDBweCcsIHdpZHRoOiAnMTAwcHgnfSxcbiAgICAgIC8qKiBAY29uc3QgKi8gQ0FSVF9ISURERU5fUEhPTkVfQ1NTIDoge2hlaWdodDogJzBweCcsIHdpZHRoOiAnMTAwcHgnfSxcbiAgICAgIC8qKiBAY29uc3QgKi8gQ0FSVF9DTE9TRURfUEhPTkVfQ1NTIDoge2hlaWdodDogJzQwcHgnLCB3aWR0aDogJzEwMHB4J30sXG5cbiAgICAgIC8qKiBAY29uc3QgKi8gQ0FSVF9ERUZBVUxUX0RFU0tUT1BfQ1NTOiBiYXNlLFxuICAgICAgLyoqIEBjb25zdCAqLyBDQVJUX1ZJU0lCTEVfREVTS1RPUF9DU1M6IHtoZWlnaHQ6ICc2MDBweCcsIHdpZHRoOiAnMzQwcHgnfSxcbiAgICAgIC8qKiBAY29uc3QgKi8gQ0FSVF9ISURERU5fREVTS1RPUF9DU1MgOiB7aGVpZ2h0OiAnNTBweCcsIHdpZHRoOiAnMHB4J30sXG4gICAgICAvKiogQGNvbnN0ICovIENBUlRfQ0xPU0VEX0RFU0tUT1BfQ1NTIDoge2hlaWdodDogJzUwcHgnLCB3aWR0aDogJzE4MHB4J30sXG5cbiAgICAgIC8qKiBAY29uc3QgKi8gQ0hFQ0tPVVRfREVGQVVMVF9DU1MgICAgICAgICA6IHtwb3NpdGlvbjogJ2ZpeGVkJywgYm90dG9tOiAwLCBsZWZ0OiAwLCByaWdodDogMCwgYm9yZGVyOiAwLCBtYXJnaW46IDAsIHBhZGRpbmc6IDAsICd6LWluZGV4JzogWl8xMCwgaGVpZ2h0OiAnMTAwJScsIHdpZHRoOiAnMTAwJSd9LFxuICAgICAgLyoqIEBjb25zdCAqLyBDSEVDS09VVF9WSVNJQkxFX0NTUyAgICAgICAgIDoge3RvcDogMCwgb3BhY2l0eTogMSwgdmlzaWJpbGl0eTogJ3Zpc2libGUnfSwvLywgaGVpZ2h0OiAnMTAwcHgnfSxcbiAgICAgIC8qKiBAY29uc3QgKi8gQ0hFQ0tPVVRfSElEREVOX0NTUyAgICAgICAgICA6IHt0b3A6ICctMTAwJScsIG9wYWNpdHk6IDAsIHZpc2liaWxpdHk6ICdoaWRkZW4nfSwgLy8sIGhlaWdodDogJzEwMHB4J30sXG4gICAgICAvKiogQGNvbnN0ICovIENIRUNLT1VUX0JBQ0tEUk9QX0RFRkFVTFRfQ1NTOiB7J2JhY2tncm91bmQtY29sb3InOiAncmdiKDQ5LCA0OSwgNDkpJywgcG9zaXRpb246ICdmaXhlZCcsIHRvcDogMCwgYm90dG9tOiAwLCBsZWZ0OiAwLCByaWdodDogMCwgYm9yZGVyOiAwLCBtYXJnaW46IDAsIHBhZGRpbmc6IDAsICd6LWluZGV4JzogWl85LCBoZWlnaHQ6ICcxMDAlJywgd2lkdGg6ICcxMDAlJ30sXG4gICAgICAvKiogQGNvbnN0ICovIENIRUNLT1VUX0JBQ0tEUk9QX1ZJU0lCTEVfQ1NTOiB7b3BhY2l0eTogMC42MCwgdmlzaWJpbGl0eTogJ3Zpc2libGUnfSwvLywgaGVpZ2h0OiAnMTAwcHgnfSxcbiAgICAgIC8qKiBAY29uc3QgKi8gQ0hFQ0tPVVRfQkFDS0RST1BfSElEREVOX0NTUyA6IHtvcGFjaXR5OiAwLCB2aXNpYmlsaXR5OiAnaGlkZGVuJ30sIC8vLCBoZWlnaHQ6ICcxMDBweCd9LFxuICAgICAgLyoqIEBjb25zdCAqLyBXSURHRVRfQVRUUlMgICAgICAgICAgICAgICAgIDoge2FsbG93dHJhbnNwYXJlbmN5OiAndHJ1ZSd9LFxuICAgICAgLyoqIEBjb25zdCAqLyBXSURHRVRfVEFHX0lEX0VYQ0xVREVfUkVHRVggIDogLyg/Oi1wbGFjZWhvbGRlcnwtbGlua3wtdW5ib290c3RyYXBwZWQpLyxcbiAgICAgIC8qKiBAY29uc3QgKi8gV0lER0VUX1VVSURfUkVHRVggICAgICAgICAgICA6IC9zaG9wYmVhbS13aWRnZXQtKD86aW1hZ2UtfHRleHQtfHN3Zi0pKC4rKSQvLFxuICAgICAgLyoqIEBjb25zdCAqLyBXSURHRVRfSEFTSF9SRUdFWCAgICAgICAgICAgIDogL3Nob3BiZWFtLW9wZW4td2lkZ2V0LSguKykkLyxcbiAgICAgIC8qKiBAY29uc3QgKi8gQ0xPVURJTkFSWV9CQVNFX1VSTCAgICAgICAgICA6ICdodHRwczovL2Nsb3VkaW5hcnktYS5ha2FtYWloZC5uZXQvc2hvcGJlYW0vaW1hZ2UvZmV0Y2gvJyxcbiAgICAgIC8qKiBAY29uc3QgKi8gVE9QX1dJTkRPVyAgICAgICAgICAgICAgICAgICA6IHdpbmRvdyA9PT0gd2luZG93LnRvcCxcblxuICAgICAgLyoqIEBjb25zdCAqLyBsaWdodGJveFJlYWR5UHJvbWlzZTogZGVmZXJyZWRMaWdodGJveFJlYWR5LnByb21pc2UsXG4gICAgfTtcblxuICAgIHJlcXVpcmUoJy4uLy4uLy4uL3NoYXJlZC9hcHAvc2VydmljZXMvdG9wV2luZG93U2VydmljZScpO1xuXG4gICAgdmFyIEltYWdlV2lkZ2V0ID0gcmVxdWlyZSgnLi9pbWFnZVdpZGdldCcpXG4gICAgICAsIFRleHRXaWRnZXQgPSByZXF1aXJlKCcuL3RleHRXaWRnZXQnKVxuICAgICAgLCBTd2ZXaWRnZXQgPSByZXF1aXJlKCcuL3N3ZldpZGdldCcpXG4gICAgICAsIGxpZ2h0Ym94ID0gcmVxdWlyZSgnLi9saWdodGJveCcpXG4gICAgICAsIGNhcnQgPSByZXF1aXJlKCcuL2NhcnQnKVxuICAgICAgLCBjaGVja291dCA9IHJlcXVpcmUoJy4vY2hlY2tvdXQnKVxuICAgICAgLCBpbWFnZXNMb2FkZWQgPSByZXF1aXJlKCcuLi8uLi8uLi9zaGFyZWQvbGliL2Rlc2FuZHJvL2ltYWdlc2xvYWRlZCcpXG4gICAgICAsIGRvbXJlYWR5ID0gcmVxdWlyZSgnLi4vLi4vLi4vc2hhcmVkL2xpYi9jbXMvZG9tcmVhZHknKVxuICAgICAgLCB3aWRnZXRRdWV1ZSA9IHt9XG5cbiAgICAvL2dsb2JhbCAod2luZG93KSBmdW5jdGlvbnNcbiAgICAgICwgZW5jb2RlVVJJQ29tcG9uZW50ID0gd2luZG93LmVuY29kZVVSSUNvbXBvbmVudFxuICAgICAgLCBfZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoXG4gICAgICA7XG5cbiAgICAvKipcbiAgICAgKiBDUkVBVEUgTElHSFRCT1hcbiAgICAgKi9cbiAgICBsaWdodGJveC5idWlsZCgpO1xuXG5cbiAgICAvKipcbiAgICAgKiBDUkVBVEUgV0lER0VUUyBBTkQgS0lDSy1PRkYgQk9PVFNSVEFQUElOR1xuICAgICAqL1xuICAgIHZhciBjaGVja0ZvckJvZHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG4gICAgICAgIGlmIChib2R5IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgIGNsZWFySW50ZXJ2YWwoYm9keVJlYWR5SW50ZXJ2YWxJZCk7XG4gICAgICAgICAgZGVmZXJyZWRCb2R5LnJlc29sdmUoYm9keSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLCBib290c3RyYXBXaWRnZXRzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vYWxsIGltYWdlcyB3aXRoIGFuIGlkIGJlZ2lubmluZyB3aXRoICdzaG9wYmVhbS13aWRnZXQtaW1hZ2UtJ1xuICAgICAgICB2YXIgaW1hZ2VXaWRnZXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChTaG9wYmVhbS5JTUFHRV9XSURHRVRfU0VMRUNUT1IpXG4gICAgICAgICAgLCB0ZXh0V2lkZ2V0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoU2hvcGJlYW0uVEVYVF9XSURHRVRfU0VMRUNUT1IpXG4gICAgICAgICAgLCBzd2ZXaWRnZXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChTaG9wYmVhbS5TV0ZfV0lER0VUX1NFTEVDVE9SKVxuICAgICAgICAgIDtcblxuICAgICAgICBxdWV1ZVdpZGdldHMoaW1hZ2VXaWRnZXRzLCBmdW5jdGlvbihxdWV1ZU9iaiwgd2lkZ2V0KSB7XG4gICAgICAgICAgaW1hZ2VzTG9hZGVkKHdpZGdldCkub24oJ2RvbmUnLCBmdW5jdGlvbihpbnN0YW5jZSkge1xuICAgICAgICAgICAgcXVldWVPYmoucXVldWVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgdmFyIHdpZGdldEluc3RhbmNlID0gbmV3IEltYWdlV2lkZ2V0KGluc3RhbmNlLmltYWdlc1swXS5pbWcpO1xuICAgICAgICAgICAgd2lkZ2V0SW5zdGFuY2UuYnVpbGQoKTtcbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICBxdWV1ZVdpZGdldHModGV4dFdpZGdldHMsIGZ1bmN0aW9uKHF1ZXVlT2JqLCB3aWRnZXQpIHtcbiAgICAgICAgICBxdWV1ZU9iai5xdWV1ZWQgPSB0cnVlO1xuICAgICAgICAgIG5ldyBUZXh0V2lkZ2V0KHdpZGdldClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcXVldWVXaWRnZXRzKHN3ZldpZGdldHMsIGZ1bmN0aW9uKHF1ZXVlT2JqLCB3aWRnZXQpIHtcbiAgICAgICAgICBxdWV1ZU9iai5xdWV1ZWQgPSB0cnVlO1xuICAgICAgICAgIG5ldyBTd2ZXaWRnZXQod2lkZ2V0KVxuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBxdWV1ZVdpZGdldHMod2lkZ2V0cywgZm4pIHtcbiAgICAgICAgICBfZm9yRWFjaC5jYWxsKHdpZGdldHMsIGZ1bmN0aW9uKHdpZGdldCkge1xuICAgICAgICAgICAgaWYgKCF3aWRnZXRRdWV1ZVt3aWRnZXQuaWRdKSB7XG4gICAgICAgICAgICAgIHZhciBxdWV1ZU9iaiA9IHdpZGdldFF1ZXVlW3dpZGdldC5pZF0gPSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0OiB3aWRnZXQsIHF1ZXVlZDogZmFsc2VcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgZm4ocXVldWVPYmosIHdpZGdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICB2YXIgZG9tUmVhZHlJbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoYm9vdHN0cmFwV2lkZ2V0cywgMjUwKVxuICAgICAgLCBib2R5UmVhZHlJbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoY2hlY2tGb3JCb2R5LCAyNTApO1xuXG4gICAgZG9tcmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICBib290c3RyYXBXaWRnZXRzKCk7XG4gICAgICBjbGVhckludGVydmFsKGRvbVJlYWR5SW50ZXJ2YWxJZCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDUkVBVEUgQ0FSVFxuICAgICAqL1xuICAgIGNhcnQuYnVpbGQoKTtcblxuICAgIC8qKlxuICAgICAqIENSRUFURSBDSEVDS09VVFxuICAgICAqL1xuICAgIGNoZWNrb3V0LmJ1aWxkKCk7XG5cblxuICAgIHBtcnBjLnJlZ2lzdGVyKHtcbiAgICAgIHB1YmxpY1Byb2NlZHVyZU5hbWU6ICdsaWdodGJveFJlYWR5JyxcbiAgICAgIHByb2NlZHVyZSAgICAgICAgICA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZWZlcnJlZExpZ2h0Ym94UmVhZHkucmVzb2x2ZSgpO1xuICAgICAgICAgIH0pXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG5cbiAgfVxufSkod2luZG93KTsiLCLvu78vKipcbiAqIExJR0hUQk9YIEJVSUxERVJcbiAqL1xuXG52YXIgJCA9IHJlcXVpcmUoJy4vYnVpbGQnKVxuICAsIHBtcnBjID0gcmVxdWlyZSgnLi4vLi4vLi4vc2hhcmVkL2xpYi9penV6YWsvcG1ycGMnKVxuICAsIHpvb20gPSByZXF1aXJlKCcuL3pvb20nKVxuICA7XG5cbmV4cG9ydHMuYnVpbGQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKFNob3BiZWFtLlRPUF9XSU5ET1cpIHtcbiAgICB2YXIgJGxpZ2h0Ym94ID0gJCgnaWZyYW1lJylcbiAgICAgICAgLmNzcyhcbiAgICAgICAgICBTaG9wYmVhbS5MSUdIVEJPWF9ERUZBVUxUX0NTU1xuICAgICAgICApLy8uYXR0cih7fSlcbiAgICAgICwgJGxpZ2h0Ym94Q29udGFpbmVyID0gJCgnZGl2JylcbiAgICAgICAgLmNzcygkLmV4dGVuZChbXG4gICAgICAgICAgU2hvcGJlYW0uTElHSFRCT1hfREVGQVVMVF9DU1MsXG4gICAgICAgICAgU2hvcGJlYW0uTElHSFRCT1hfSElEREVOX0NTU1xuICAgICAgICBdKSlcbiAgICAgICAgLmF0dHIoe2lkOiAnc2hvcGJlYW0tbGlnaHRib3gnfSlcbiAgICAgICAgLmFwcGVuZCgkbGlnaHRib3gpXG4gICAgICAsIGxpZ2h0Ym94RG9jdW1lbnRcbiAgICAgIDtcblxuICAgIFNob3BiZWFtLkRPQ1VNRU5UX0JPRFkudGhlbihmdW5jdGlvbihib2R5KSB7XG4gICAgICAkbGlnaHRib3hDb250YWluZXIuYXBwZW5kVG8oYm9keSk7XG4gICAgICBsaWdodGJveERvY3VtZW50ID0gJGxpZ2h0Ym94LmVsZW1lbnQuY29udGVudFdpbmRvdy5kb2N1bWVudDtcblxuICAgICAgbGlnaHRib3hEb2N1bWVudC5vcGVuKCk7XG4gICAgICBsaWdodGJveERvY3VtZW50LndyaXRlKGFwcEluZGV4ZXMubGlnaHRib3goU2hvcGJlYW0pKTtcbiAgICAgIGxpZ2h0Ym94RG9jdW1lbnQuY2xvc2UoKTtcbiAgICB9KTtcblxuXG4gICAgcG1ycGMucmVnaXN0ZXIoe1xuICAgICAgcHVibGljUHJvY2VkdXJlTmFtZTogJ3Nob3dMaWdodGJveCcsXG4gICAgICBwcm9jZWR1cmUgICAgICAgICAgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB6b29tLmRpc2FibGUoKTtcbiAgICAgICAgICAkbGlnaHRib3hDb250YWluZXJcbiAgICAgICAgICAgIC5jc3Moe2Rpc3BsYXk6ICdibG9jayd9KTtcblxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkbGlnaHRib3hDb250YWluZXIuZmFkZUluKCc1MDBtcycpXG4gICAgICAgICAgfSwgMTAwKVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHBtcnBjLnJlZ2lzdGVyKHtcbiAgICAgIHB1YmxpY1Byb2NlZHVyZU5hbWU6ICdoaWRlTGlnaHRib3gnLFxuICAgICAgcHJvY2VkdXJlICAgICAgICAgIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgem9vbS5yZXNldCgpO1xuICAgICAgICAgICRsaWdodGJveENvbnRhaW5lci5mYWRlT3V0KCc1MDBtcycpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgJGxpZ2h0Ym94Q29udGFpbmVyLmNzcyh7ZGlzcGxheTogJ25vbmUnfSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcbiIsIi8qKlxuICogU1dGIFdJREdFVCBDTEFTU1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gU3dmV2lkZ2V0O1xuXG52YXIgJCA9IHJlcXVpcmUoJy4vYnVpbGQnKVxuICAsIHEgPSByZXF1aXJlKCcuLi8uLi8uLi9zaGFyZWQvbGliL2tyaXNrb3dhbC9xJylcbiAgLCBwbXJwYyA9IHJlcXVpcmUoJy4uLy4uLy4uL3NoYXJlZC9saWIvaXp1emFrL3BtcnBjJylcbiAgLCB0b3BXaW5kb3dTZXJ2aWNlID0gcmVxdWlyZSgnLi4vLi4vLi4vc2hhcmVkL2FwcC9zZXJ2aWNlcy90b3BXaW5kb3dTZXJ2aWNlJylcbiAgLCBhbmFseXRpY3NTZXJ2aWNlID0gcmVxdWlyZSgnLi4vLi4vLi4vc2hhcmVkL2FwcC9zZXJ2aWNlcy9hbmFseXRpY3NTZXJ2aWNlJylcbiAgLCBXaWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldCcpXG4vLyAgLCBzd2ZvYmplY3QgPSByZXF1aXJlKCcuLi8uLi8uLi9zaGFyZWQvbGliL3N3Zm9iamVjdC9zd2ZvYmplY3QnKVxuICA7XG5cbmZ1bmN0aW9uIFN3ZldpZGdldChvYmplY3QpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIC8vdGhlIGlkIGF0dHJpYnV0ZSB0aGF0IHdpbGwgYmUgc2V0IG9uIHRoZSAkd2lkZ2V0IGlmcmFtZSBlbGVtZW50XG4gICAgLCB3aWRnZXRUYWdJZCA9IG9iamVjdC5pZC5yZXBsYWNlKFNob3BiZWFtLldJREdFVF9UQUdfSURfRVhDTFVERV9SRUdFWCwgJycpXG4gIC8vdGhlIHV1aWQtb25seSBvZiB0aGlzIHdpZGdldDsgdXNlZCBmb3IgdW5pcXVlbmVzcyBiZXR3ZWVuIG11bHRpcGxlIHdpZGdldHNcbiAgICAsIHdpZGdldFV1aWQgPSB3aWRnZXRUYWdJZC5tYXRjaChTaG9wYmVhbS5XSURHRVRfVVVJRF9SRUdFWClbMV1cbiAgLy9wcm9kdWN0cyByZXNvdXJlY2UgdXJsIHdpdGggcXVlcnktc3RyaW5nIHBhcmFtcyBmb3IgdGhpcyBwYXJ0aWN1bGFyIHdpZGdldFxuICAgICwgZGF0YVVybFxuICAgICwgZGF0YUltYWdlU3JjXG4gICAgO1xuXG4gIGlmIChvYmplY3QuZGF0YXNldCkge1xuICAgIGRhdGFVcmwgPSBTaG9wYmVhbS5IT1NUICsgb2JqZWN0LmRhdGFzZXQuc2hvcGJlYW1Vcmw7XG4gICAgZGF0YUltYWdlU3JjID0gb2JqZWN0LmRhdGFzZXQuaW1hZ2VTcmM7XG4gIH0gZWxzZSB7XG4gICAgZGF0YVVybCA9IFNob3BiZWFtLkhPU1QgKyBvYmplY3QuYXR0cmlidXRlc1snZGF0YS1zaG9wYmVhbS11cmwnXS52YWx1ZVxuICAgIGRhdGFJbWFnZVNyYyA9IG9iamVjdC5hdHRyaWJ1dGVzWydpbWFnZVNyYyddLnZhbHVlO1xuICB9XG5cbiAgdGhpcy5kYXRhVXJsID0gZGF0YVVybDtcblxuICAvL2NyZWF0ZSBkZWZlcnJlZCBhbmQgcHJvbWlzZSBmb3IgcHJvZHVjdHMgcmVzb3VyY2UgcmVxdWVzdC5cbiAgLy8gIGFueXRoaW5nIHRoYXQgZGVwZW5kcyBvbiBwcm9kdWN0cyBkYXRhIHRvIGJlIGxvYWRlZCB3aWxsIC50aGVuIG9uIEpTT05Qcm9taXNlXG4gIHZhciBkZWZlcnJlZEpTT04gPSBxLmRlZmVyKClcbiAgICAsIEpTT05Qcm9taXNlID0gZGVmZXJyZWRKU09OLnByb21pc2VcbiAgICAsIGRhdGFDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgd2lkZ2V0SWQgICAgICAgICAgOiB3aWRnZXRVdWlkLFxuICAgICAgICAgIHByb2R1Y3RzVXJsICAgICAgIDogZGF0YVVybCxcbiAgICAgICAgICBpbml0aWFsSW1hZ2VTb3VyY2U6IGRhdGFJbWFnZVNyY1xuICAgICAgICB9LFxuICAgICAgICBkYXRhID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlVGV4dCk7XG4gICAgICBkZWZlcnJlZEpTT04ucmVzb2x2ZSh7ZGF0YTogZGF0YSwgb3B0aW9uczogb3B0aW9uc30pO1xuICAgIH1cbiAgICA7XG5cbiAgJChvYmplY3QpLmF0dHIoe2lkOiB3aWRnZXRUYWdJZH0pO1xuXG4gIC8vcHJlLWxvYWQgcHJvZHVjdHMgcmVzb3VyY2UgSlNPTlxuICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICByZXF1ZXN0Lm9ubG9hZCA9IGRhdGFDYWxsYmFjaztcbiAgcmVxdWVzdC5vcGVuKCdnZXQnLCBkYXRhVXJsLCB0cnVlKTtcbiAgcmVxdWVzdC5zZW5kKCk7XG5cbiAgdGhpcy51dWlkID0gd2lkZ2V0VXVpZDtcbiAgdGhpcy5KU09OUHJvbWlzZSA9IEpTT05Qcm9taXNlO1xuXG4gIHZhciBvcGVuTGlnaHRib3ggPSBmdW5jdGlvbigpIHtcbiAgICBKU09OUHJvbWlzZS50aGVuKHNlbGYuYnVpbGRDb25maWcoZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICBpZiAoIWNvbmZpZy5vdXRPZlN0b2NrKSB7XG4gICAgICAgIHBtcnBjLmNhbGwoe1xuICAgICAgICAgIGRlc3RpbmF0aW9uICAgICAgICA6ICdwdWJsaXNoJyxcbiAgICAgICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnb3BlbkxpZ2h0Ym94JyxcbiAgICAgICAgICBwYXJhbXMgICAgICAgICAgICAgOiBbY29uZmlnLCBzZWxmXVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pKVxuICB9O1xuXG4gIHBtcnBjLnJlZ2lzdGVyKHtcbiAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnd2lkZ2V0T3BlbkxpZ2h0Ym94JyArIFN0cmluZyh0aGlzLnV1aWQpLFxuICAgIHByb2NlZHVyZSAgICAgICAgICA6IGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgb3BlbkxpZ2h0Ym94KCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy9Jbmhlcml0IGZyb20gV2lkZ2V0IENsYXNzXG4gIFdpZGdldC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gIC8vYCNidWlsZENvbmZpZ2AgaXMgZGVmaW5lZCBieSBzdXBlciBzbyB0aGlzIG11c3QgZm9sbG93IGBXaWRnZXQuYXBwbHkoLi4uKWBcbi8vICBzd2ZvYmplY3QucmVnaXN0ZXJPYmplY3Qod2lkZ2V0VGFnSWQsIFwiMTEuOFwiLCBcIi9zd2Yvc3dmb2JqZWN0L2V4cHJlc3NJbnN0YWxsLnN3ZlwiLCBmdW5jdGlvbigpIHtcbiAgSlNPTlByb21pc2UudGhlbihzZWxmLmJ1aWxkQ29uZmlnKGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIC8vVE9ETzogZmlndXJlIG91dCBpZiB3ZSByZWFsbHkgbmVlZCB0aGlzIG9yIG5vdCB2dnZ2XG4gICAgdmFyIHN3ZjtcblxuICAgIHN3ZiA9IG9iamVjdDtcbi8vICAgICAgaWYgKC9JRS8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbi8vICAgICAgICAvL1RPRE86IGFjdHVhbGx5IGxvb2sgYXQgdGhpcyBpbiBJRTogbWF5IG5vdCBiZSB0aGlzIGVsZW1lbnQsIG1heSBpbnN0ZWFkIGJlIGEgY2hpbGQgZW1iZWQgb3Igc29tZXRoaW5nIVxuLy8gICAgICAgIHN3ZiA9IG9iamVjdDtcbi8vICAgICAgfSBlbHNlIHtcbi8vICAgICAgICBzd2YgPSBvYmplY3QucXVlcnlTZWxlY3Rvcignb2JqZWN0W2RhdGEqPVwiLnN3ZlwiXScpO1xuLy8gICAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHN3Zi5zZXRXaWRnZXREYXRhKEpTT04uc3RyaW5naWZ5KGNvbmZpZykpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS53YXJuKCdub24temVybyBleGl0IGZyb20gc3dmLnNldFdpZGdldERhdGEhIScpO1xuICAgIH1cbiAgfSkpO1xuLy8gIH0pO1xufVxuIiwi77u/LyoqXG4gKiBURVhUIFdJREdFVCBDTEFTU1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gVGV4dFdpZGdldDtcblxudmFyICQgPSByZXF1aXJlKCcuL2J1aWxkJylcbiAgLCBxID0gcmVxdWlyZSgnLi4vLi4vLi4vc2hhcmVkL2xpYi9rcmlza293YWwvcScpXG4gICwgcG1ycGMgPSByZXF1aXJlKCcuLi8uLi8uLi9zaGFyZWQvbGliL2l6dXphay9wbXJwYycpXG4gICwgdG9wV2luZG93U2VydmljZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3NoYXJlZC9hcHAvc2VydmljZXMvdG9wV2luZG93U2VydmljZScpXG4gICwgYW5hbHl0aWNzU2VydmljZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3NoYXJlZC9hcHAvc2VydmljZXMvYW5hbHl0aWNzU2VydmljZScpXG4gICwgV2lkZ2V0ID0gcmVxdWlyZSgnLi93aWRnZXQnKVxuICA7XG5cbmZ1bmN0aW9uIFRleHRXaWRnZXQobGluaykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgLy90aGUgaWQgYXR0cmlidXRlIHRoYXQgd2lsbCBiZSBzZXQgb24gdGhlICR3aWRnZXQgaWZyYW1lIGVsZW1lbnRcbiAgICAsIHdpZGdldFRhZ0lkID0gbGluay5pZC5yZXBsYWNlKFNob3BiZWFtLldJREdFVF9UQUdfSURfRVhDTFVERV9SRUdFWCwgJycpXG4gIC8vdGhlIHV1aWQtb25seSBvZiB0aGlzIHdpZGdldDsgdXNlZCBmb3IgdW5pcXVlbmVzcyBiZXR3ZWVuIG11bHRpcGxlIHdpZGdldHNcbiAgICAsIHdpZGdldFV1aWQgPSB3aWRnZXRUYWdJZC5tYXRjaChTaG9wYmVhbS5XSURHRVRfVVVJRF9SRUdFWClbMV1cbiAgLy9wcm9kdWN0cyByZXNvdXJlY2UgdXJsIHdpdGggcXVlcnktc3RyaW5nIHBhcmFtcyBmb3IgdGhpcyBwYXJ0aWN1bGFyIHdpZGdldFxuICAgICwgZGF0YVVybFxuICAgIDtcblxuICBpZiAobGluay5kYXRhc2V0KSB7XG4gICAgZGF0YVVybCA9IFNob3BiZWFtLkhPU1QgKyBsaW5rLmRhdGFzZXQuc2hvcGJlYW1VcmxcbiAgfSBlbHNlIHtcbiAgICBkYXRhVXJsID0gU2hvcGJlYW0uSE9TVCArIGxpbmsuYXR0cmlidXRlc1snZGF0YS1zaG9wYmVhbS11cmwnXS52YWx1ZVxuICB9XG4gIFxuICB0aGlzLmRhdGFVcmwgPSBkYXRhVXJsO1xuXG4gIC8vY3JlYXRlIGRlZmVycmVkIGFuZCBwcm9taXNlIGZvciBwcm9kdWN0cyByZXNvdXJjZSByZXF1ZXN0LlxuICAvLyAgYW55dGhpbmcgdGhhdCBkZXBlbmRzIG9uIHByb2R1Y3RzIGRhdGEgdG8gYmUgbG9hZGVkIHdpbGwgLnRoZW4gb24gSlNPTlByb21pc2VcbiAgdmFyIGRlZmVycmVkSlNPTiA9IHEuZGVmZXIoKVxuICAgICwgSlNPTlByb21pc2UgPSBkZWZlcnJlZEpTT04ucHJvbWlzZVxuICAgICwgZGF0YUNhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICB3aWRnZXRJZCAgIDogd2lkZ2V0VXVpZCxcbiAgICAgICAgICBwcm9kdWN0c1VybDogZGF0YVVybFxuICAgICAgICB9LFxuICAgICAgICBkYXRhID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlVGV4dCk7XG4gICAgICBkZWZlcnJlZEpTT04ucmVzb2x2ZSh7ZGF0YTogZGF0YSwgb3B0aW9uczogb3B0aW9uc30pO1xuICAgIH1cbiAgICA7XG5cbiAgJChsaW5rKS5hdHRyKHtpZDogd2lkZ2V0VGFnSWR9KTtcblxuICAvL3ByZS1sb2FkIHByb2R1Y3RzIHJlc291cmNlIEpTT05cbiAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgcmVxdWVzdC5vbmxvYWQgPSBkYXRhQ2FsbGJhY2s7XG4gIHJlcXVlc3Qub3BlbignZ2V0JywgZGF0YVVybCwgdHJ1ZSk7XG4gIHJlcXVlc3Quc2VuZCgpO1xuXG4gIHRoaXMudXVpZCA9IHdpZGdldFV1aWQ7XG4gIHRoaXMuSlNPTlByb21pc2UgPSBKU09OUHJvbWlzZTtcblxuICBwbXJwYy5yZWdpc3Rlcih7XG4gICAgcHVibGljUHJvY2VkdXJlTmFtZTogJ3dpZGdldE9wZW5MaWdodGJveCcgKyBTdHJpbmcodGhpcy51dWlkKSxcbiAgICBwcm9jZWR1cmUgICAgICAgICAgOiBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIEpTT05Qcm9taXNlLnRoZW4oc2VsZi5idWlsZENvbmZpZyhmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgICBwbXJwYy5jYWxsKHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uICAgICAgICA6ICdwdWJsaXNoJyxcbiAgICAgICAgICAgIHB1YmxpY1Byb2NlZHVyZU5hbWU6ICdvcGVuTGlnaHRib3gnLFxuICAgICAgICAgICAgcGFyYW1zICAgICAgICAgICAgIDogW2NvbmZpZywgc2VsZl1cbiAgICAgICAgICB9KVxuICAgICAgICB9KSlcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvL0luaGVyaXQgZnJvbSBXaWRnZXQgQ2xhc3NcbiAgV2lkZ2V0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgLy9gI2J1aWxkQ29uZmlnYCBpcyBkZWZpbmVkIGJ5IHN1cGVyIHNvIHRoaXMgbXVzdCBmb2xsb3cgYFdpZGdldC5hcHBseSguLi4pYFxuICBKU09OUHJvbWlzZS50aGVuKHRoaXMuYnVpbGRDb25maWcoZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgIGFjdGlvbiAgICAgIDogJ3RleHQtd2lkZ2V0LW1vdXNlb3ZlcicsXG4gICAgICAgIHdpZGdldFV1aWQgIDogc2VsZi51dWlkLFxuICAgICAgICBhcGlLZXkgICAgICA6IHNlbGYuYXBpS2V5LFxuICAgICAgICBkYXRhVXJsICAgICA6IHNlbGYuZGF0YVVybFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgYW5hbHl0aWNzU2VydmljZS5wb3N0KGRhdGEpO1xuICAgIH0pO1xuICAgIFxuICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmICghY29uZmlnLm91dE9mU3RvY2spIHtcbiAgICAgICAgdG9wV2luZG93U2VydmljZS5oYXNoKCdzaG9wYmVhbS1vcGVuLXdpZGdldC0nICsgd2lkZ2V0VXVpZCk7XG4gICAgICAgIHBtcnBjLmNhbGwoe1xuICAgICAgICAgIGRlc3RpbmF0aW9uICAgICAgICA6ICdwdWJsaXNoJyxcbiAgICAgICAgICBwdWJsaWNQcm9jZWR1cmVOYW1lOiAnb3BlbkxpZ2h0Ym94JyxcbiAgICAgICAgICBwYXJhbXMgICAgICAgICAgICAgOiBbY29uZmlnLCBzZWxmXVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pXG4gIH0pKTtcbn1cbiIsIu+7vy8qKlxuICogV0lER0VUIENMQVNTXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBXaWRnZXQ7XG5cbnZhciAkID0gcmVxdWlyZSgnLi9idWlsZCcpXG4gICwgcG1ycGMgPSByZXF1aXJlKCcuLi8uLi8uLi9zaGFyZWQvbGliL2l6dXphay9wbXJwYycpXG4gICwgdG9wV2luZG93U2VydmljZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3NoYXJlZC9hcHAvc2VydmljZXMvdG9wV2luZG93U2VydmljZScpXG4gICwgYW5hbHl0aWNzU2VydmljZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3NoYXJlZC9hcHAvc2VydmljZXMvYW5hbHl0aWNzU2VydmljZScpXG4gIDtcblxuZnVuY3Rpb24gV2lkZ2V0KCkge1xuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIHJvdXRlUGFyYW1zID0gbWFwUGFyYW1zKHNlbGYuZGF0YVVybCk7XG5cbiAgLy9OT1RFOiBvbGQgZW1iZWRzIHVzZSBgYXBpa2V5YCBpbnN0ZWFkIG9mIGBhcGlLZXlgIC0gdGhpcyBpcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkhXG4gIHJvdXRlUGFyYW1zLmFwaUtleSA9IHJvdXRlUGFyYW1zLmFwaUtleSB8fCByb3V0ZVBhcmFtcy5hcGlrZXk7XG5cbiAgdGhpcy5hcGlLZXkgPSByb3V0ZVBhcmFtcy5hcGlLZXk7XG5cbiAgdmFyIGRhdGEgPSB7XG4gICAgYWN0aW9uICAgIDogJ3dpZGdldC1sb2FkJyxcbiAgICB3aWRnZXRVdWlkOiBzZWxmLnV1aWQsXG4gICAgYXBpS2V5ICAgIDogc2VsZi5hcGlLZXksXG4gICAgZGF0YVVybCAgIDogc2VsZi5kYXRhVXJsXG4gIH07XG5cbiAgYW5hbHl0aWNzU2VydmljZS5wb3N0KGRhdGEpO1xuXG4gIHRoaXMub3BlbkxpZ2h0Ym94ID0gZnVuY3Rpb24odXVpZCkge1xuICAgIHBtcnBjLmNhbGwoe1xuICAgICAgZGVzdGluYXRpb24gICAgICAgIDogJ3B1Ymxpc2gnLFxuICAgICAgcHVibGljUHJvY2VkdXJlTmFtZTogJ3dpZGdldE9wZW5MaWdodGJveCcgKyBTdHJpbmcodXVpZClcbiAgICB9KVxuICB9O1xuXG4gIHRvcFdpbmRvd1NlcnZpY2UuaGFzaCgpLnRoZW4oZnVuY3Rpb24oaGFzaCkge1xuICAgIGlmIChoYXNoICYmIGhhc2gubWF0Y2goU2hvcGJlYW0uV0lER0VUX0hBU0hfUkVHRVgpWzFdID09PSBzZWxmLnV1aWQpIHtcbiAgICAgIFNob3BiZWFtLmxpZ2h0Ym94UmVhZHlQcm9taXNlLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYub3BlbkxpZ2h0Ym94KHNlbGYudXVpZCk7XG4gICAgICB9KVxuICAgIH1cbiAgfSk7XG5cbiAgdGhpcy5idWlsZENvbmZpZyA9IGZ1bmN0aW9uKHdpZGdldENvbmZpZ0NhbGxiYWNrKSB7XG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzb2x1dGlvbiBPYmplY3QgcGFzc2VkIHRvIGBkZWZlcnJlZEpTT04ucmVzb2x2ZWBcbiAgICAgKiAgICBpLmUuIHtkYXRhOiA8eGhyIHJlc3BvbnNlIGRhdGE+LCBvcHRpb25zOiA8b3B0aW9ucyBhcyBkZWZpbmVkIGluIGBkYXRhQ2FsbGJhY2tgPn1cbiAgICAgKi9cbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzb2x1dGlvbikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIGRhdGEgPSByZXNvbHV0aW9uLmRhdGFcbiAgICAgICAgICAsIG9wdGlvbnMgPSByZXNvbHV0aW9uLm9wdGlvbnNcbiAgICAgICAgICA7XG5cbiAgICAgICAgaWYgKHJvdXRlUGFyYW1zLmdvb2dsZV9jb252ZXJzaW9uX2lkKSB7XG4gICAgICAgICAgb3B0aW9ucy5yZW1hcmtldGluZyA9IHtcbiAgICAgICAgICAgIGNvbnZlcnNpb25JZDogcm91dGVQYXJhbXMuZ29vZ2xlX2NvbnZlcnNpb25faWQsXG4gICAgICAgICAgICBjYW1wYWlnbiAgICA6IHJvdXRlUGFyYW1zLmNhbXBhaWduXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9HZXQgYW4gYW5ndWxhci0kcm91dGVQYXJhbXMtbGlrZSBvYmplY3QgLSBtYXAgb2YgcXVlcnktc3RyaW5ncyBhbmQgdGhlaXIgdmFsdWVzXG4gICAgICAgIHZhciBpbWFnZVNvdXJjZSA9IG9wdGlvbnMuaW5pdGlhbEltYWdlU291cmNlXG4gICAgICAgICAgLCBpbml0aWFsUHJvZHVjdCA9IGRhdGFbMF1cbiAgICAgICAgICAsIGluaXRpYWxWYXJpYW50XG4gICAgICAgICAgLCBpbml0aWFsSW1hZ2VPYmpcbiAgICAgICAgICAsIGVtYmVkSW1hZ2VcbiAgICAgICAgICAsIGNvbG9yc1xuICAgICAgICAgIDtcblxuICAgICAgICAvL01ha2Ugc3VyZSB0aGVyZSdzIGF0IGxlYXN0IG9uZSBwcm9kdWN0XG4gICAgICAgIGlmIChpbml0aWFsUHJvZHVjdCkge1xuICAgICAgICAgIC8vSWYgdGhlIGVtYmVkZGVkIHZhcmlhbnQgaXMgaW4gc3RvY2ssIHNldCBpdCB0byBpbml0aWFsVmFyaWFudCxcbiAgICAgICAgICAvLyAgb3RoZXJ3aXNlLCB1c2UgdGhlIGZpcnN0IGluLXN0b2NrIHZhcmlhbnQuXG4gICAgICAgICAgaW5pdGlhbFZhcmlhbnQgPSBpbml0aWFsUHJvZHVjdC52YXJpYW50cy5maWx0ZXIoZnVuY3Rpb24odmFyaWFudCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhcmlhbnQuaWQgPT09IHdpbmRvdy5wYXJzZUludChyb3V0ZVBhcmFtcy5pZCwgMTApXG4gICAgICAgICAgfSlbMF0gfHwgaW5pdGlhbFByb2R1Y3QudmFyaWFudHNbMF07XG5cbiAgICAgICAgICAvL2luaXRpYWxJbWFnZU9iaiBleGFtcGxlOlxuICAgICAgICAgIC8vICB7aWQ6IDxpbWFnZS1pZD4sIHVybDogJzxpbWFnZS11cmw+J31cbiAgICAgICAgICBpbml0aWFsSW1hZ2VPYmogPSBpbml0aWFsVmFyaWFudC5pbWFnZXNbKHJvdXRlUGFyYW1zLmltYWdlIC0gMSkgfHwgMF07XG5cbiAgICAgICAgICAvL0NvbG9ycyBleGFtcGxlOlxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIFtcbiAgICAgICAgICAgKiAgIHtcbiAgICAgICAgICAgKiAgICAgbmFtZSAgICA6ICc8dW5pcXVlLWNvbG9yLW5hbWUtMT4nLFxuICAgICAgICAgICAqICAgICBpbWFnZVVybDogJzxmaXJzdC12YXJpYW50LWltYWdlLW9mLWNvbG9yLXVybD4nLFxuICAgICAgICAgICAqICAgICB2YXJpYW50czogW1xuICAgICAgICAgICAqICAgICAgIHs8dmFyaWFudD59WywgLi4uXVxuICAgICAgICAgICAqICAgICBdXG4gICAgICAgICAgICogICB9WywgLi4uXVxuICAgICAgICAgICAqIF1cbiAgICAgICAgICAgKi9cbiAgICAgICAgICBjb2xvcnMgPSAkLmZpbHRlcigndW5pcXVlJykoaW5pdGlhbFByb2R1Y3QudmFyaWFudHMsICdjb2xvcicpLm1hcChmdW5jdGlvbih2YXJpYW50KSB7XG4gICAgICAgICAgICB2YXIgdW5pcXVlbHlDb2xvcmVkVmFyaWFudHMgPSAkLmZpbHRlcignZmlsdGVyJykoaW5pdGlhbFByb2R1Y3QudmFyaWFudHMsIHtjb2xvcjogdmFyaWFudC5jb2xvcn0pO1xuICAgICAgICAgICAgcmV0dXJuIHtuYW1lOiB2YXJpYW50LmNvbG9yLCBpbWFnZVVybDogdmFyaWFudC5pbWFnZXNbMF0udXJsLCB2YXJpYW50czogdW5pcXVlbHlDb2xvcmVkVmFyaWFudHN9O1xuICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy9UaGUgYXJyYXkgb2YgcHJvZHVjdHMgaXMgZW1wdHkuIFRoaXMgZWl0aGVyIG1lYW5zIHRoYXQgdGhlIHByb2R1Y3QgaXMgb3V0IG9mXG4gICAgICAgICAgLy8gIHN0b2NrIG9yIGl0IGRvZXMgbm90IGV4aXN0OyB3ZSBhc3N1bWUgaXQncyBvdXQgb2Ygc3RvY2suXG4gICAgICAgICAgLy9UaGUgZm9sbG93aW5nIHNldHMgdXAgc29tZSBzYWZlIHZhbHVlcyB0byBiZSBwYXNzZWQgaW50byB0aGUgd2lkZ2V0IHNvIGl0IHNob3dzXG4gICAgICAgICAgLy8gIGFzIG91dCBvZiBzdG9jayBhbmQgZG9lc24ndCBoYXZlIGFueSBlcnJvcnNcbiAgICAgICAgICBpbml0aWFsUHJvZHVjdCA9IHtcbiAgICAgICAgICAgIGJyYW5kTmFtZTogJ0N1cnJlbnRseSBPdXQgb2YgU3RvY2snLFxuICAgICAgICAgICAgbmFtZSAgICAgOiAnKGFsbCBjb2xvcnMgJiBzaXplcyknXG4gICAgICAgICAgfTtcbiAgICAgICAgICBpbml0aWFsSW1hZ2VPYmogPSB7fTtcbiAgICAgICAgICBpZiAoaW1hZ2VTb3VyY2UpIGluaXRpYWxJbWFnZU9iai51cmwgPSBpbWFnZVNvdXJjZTtcbiAgICAgICAgfVxuICAgICAgICBlbWJlZEltYWdlID0ge3VybDogaW1hZ2VTb3VyY2V9O1xuXG4gICAgICAgIC8vQ2FsbCB3aWRnZXQgYXBwJ3MgY2FsbGJhY2ssIHBhc3NpbmcgY29uZmlnIG9iamVjdCBpbnRvIGFuZ3VsYXIgYXBwXG4gICAgICAgIHdpZGdldENvbmZpZ0NhbGxiYWNrKHtcbiAgICAgICAgICBvdXRPZlN0b2NrICAgIDogIWRhdGFbMF0sXG4gICAgICAgICAgaW5pdGlhbFByb2R1Y3Q6IGluaXRpYWxQcm9kdWN0LFxuICAgICAgICAgIGluaXRpYWxWYXJpYW50OiBpbml0aWFsVmFyaWFudCxcbiAgICAgICAgICBpbml0aWFsSW1hZ2UgIDogaW5pdGlhbEltYWdlT2JqLFxuICAgICAgICAgIGVtYmVkSW1hZ2UgICAgOiBlbWJlZEltYWdlLFxuICAgICAgICAgIGNvbG9ycyAgICAgICAgOiBjb2xvcnMsXG4gICAgICAgICAgYXBpS2V5ICAgICAgICA6IHJvdXRlUGFyYW1zLmFwaWtleSB8fCByb3V0ZVBhcmFtcy5hcGlLZXksXG4gICAgICAgICAgb3B0aW9ucyAgICAgICA6IG9wdGlvbnNcbiAgICAgICAgfSlcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmxvZygnZXJyb3Igd2hpbGUgYnVpbGRpbmcgd2lkZ2V0IGNvbmZpZzogJywgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUdXJuIGEgcmVzb3VyY2UgdXJsJ3MgcXVlcnkgc3RyaW5nIHBhcmFtcyBpbnRvIGEgbWFwIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5U3RyaW5nIFRoZSB1cmwvdXJsLXBhcnQgd2hpY2ggY29udGFpbnMgdGhlIHF1ZXJ5IHN0cmluZ1xuICogQHJldHVybiB7b2JqZWN0fSBHaXZlbjogYC92MS9wcm9kdWN0cz9pZD0xMjM0JmltYWdlPTQmYXBpa2V5PWJsYWhgLFxuICogICAgcmV0dXJuczogYHtpZDogMTIzNCwgaW1hZ2U6IDQsIGFwaWtleTogJ2JsYWgnfWBcbiAqL1xuZnVuY3Rpb24gbWFwUGFyYW1zKHF1ZXJ5U3RyaW5nKSB7XG4gIHF1ZXJ5U3RyaW5nID0gcXVlcnlTdHJpbmcuc3BsaXQoJz8nKVsxXTtcbiAgdmFyIHBhaXJzID0gcXVlcnlTdHJpbmcuc3BsaXQoJyYnKVxuICAgICwgcGFyYW1zID0ge307XG5cbiAgcGFpcnMuZm9yRWFjaChmdW5jdGlvbihwYWlyKSB7XG4gICAgcGFpciA9IHBhaXIuc3BsaXQoJz0nKTtcbiAgICBwYXJhbXNbcGFpclswXV0gPSBwYWlyWzFdO1xuICB9KTtcblxuICByZXR1cm4gcGFyYW1zO1xufVxuIiwi77u/LypcbiAqIFBSRVZFTlQgWk9PTUlORyBPTiBNT0JJTEVcbiAqL1xuXG5cbihmdW5jdGlvbigpIHtcbiAgLy8tLSBJRTEwIFBPTFlGSUxMXG4gIGlmICghRWxlbWVudC5wcm90b3R5cGUucmVtb3ZlKSB7XG4gICAgRWxlbWVudC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgfTtcbiAgfVxuICAvLy0tIEVORCBQT0xZRklMTFxuXG5cbiAgdmFyIGJ1aWxkID0gcmVxdWlyZSgnLi9idWlsZCcpXG4gICAgLCBiYWNrZHJvcFN0eWxlID0gXCJAbWVkaWEobWF4LXdpZHRoOiA2NDBweCkge1wiICtcbiAgICAgIFwiLm1vYmlsZUNoZWNrb3V0QmFja2Ryb3Age1wiICtcbiAgICAgIFwicG9zaXRpb246IGFic29sdXRlOyB0b3A6IC0xMDAlOyBsZWZ0OiAtMTAwJTsgaGVpZ2h0OiAzMDAlOyB3aWR0aDogMzAwJTsgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XCIgK1xuICAgICAgXCJ9XCIgK1xuICAgICAgXCJ9XCJcbiAgICAsIGJhY2tkcm9wU3R5bGVUYWcgPSBidWlsZCgnc3R5bGUnKS5hdHRyKHt0eXBlOiAndGV4dC9jc3MnfSkuZWxlbWVudFxuICAgICwgbm9ab29tTWV0YVRhZyA9IGJ1aWxkKCdtZXRhJykuYXR0cih7bmFtZTogJ3ZpZXdwb3J0JywgY29udGVudDogJ3dpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjAsIG1heGltdW0tc2NhbGU9MS4wLCBtaW5pbXVtLXNjYWxlPTEuMCwgdXNlci1zY2FsYWJsZT1ubyd9KS5lbGVtZW50XG4gICAgLCBtb2JpbGVDaGVja291dEJhY2tkcm9wID0gYnVpbGQoJ2RpdicpLmVsZW1lbnRcbiAgICAsIG9yaWdpbmFsTWV0YVRhZ1xuICAgIDtcblxuICBiYWNrZHJvcFN0eWxlVGFnLmlubmVyVGV4dCA9IGJhY2tkcm9wU3R5bGU7XG4gIFNob3BiZWFtLkRPQ1VNRU5UX0hFQUQuYXBwZW5kQ2hpbGQoYmFja2Ryb3BTdHlsZVRhZyk7XG4gIG1vYmlsZUNoZWNrb3V0QmFja2Ryb3AuY2xhc3NMaXN0LmFkZCgnbW9iaWxlQ2hlY2tvdXRCYWNrZHJvcCcpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgbm9ab29tTWV0YVRhZy5yZW1vdmUoKTtcbiAgICAgIG1vYmlsZUNoZWNrb3V0QmFja2Ryb3AucmVtb3ZlKCk7XG4gICAgICBpZiAob3JpZ2luYWxNZXRhVGFnKSB7XG4gICAgICAgIFNob3BiZWFtLkRPQ1VNRU5UX0hFQUQuYXBwZW5kQ2hpbGQob3JpZ2luYWxNZXRhVGFnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICBvcmlnaW5hbE1ldGFUYWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9XCJ2aWV3cG9ydFwiXScpO1xuICAgICAgaWYgKG9yaWdpbmFsTWV0YVRhZykge1xuICAgICAgICBvcmlnaW5hbE1ldGFUYWcucmVtb3ZlKCk7XG4gICAgICB9XG4gICAgICBTaG9wYmVhbS5ET0NVTUVOVF9IRUFELmFwcGVuZENoaWxkKG5vWm9vbU1ldGFUYWcpO1xuICAgICAgU2hvcGJlYW0uRE9DVU1FTlRfQk9EWS50aGVuKGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChtb2JpbGVDaGVja291dEJhY2tkcm9wKVxuICAgICAgfSlcbiAgICB9XG4gIH07XG59KCkpO1xuIl19
;