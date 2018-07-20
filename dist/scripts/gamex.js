(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

module.exports = {}; // FIXME: Point this to dist

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _src = require('./src');

Object.keys(_src).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _src[key];
    }
  });
});

},{"./src":6}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * An AnimationJob is used with the animator controller to update and re-draw something each frame.
 *
 * @abstract
 */
var AnimationJob = function () {
  /**
   * @param {Function} [onComplete] A callback to be called when this AnimationJob is finished.
   */
  function AnimationJob(onComplete) {
    _classCallCheck(this, AnimationJob);

    // AnimationJob is an abstract class. It should not be instantiated directly.
    if (new.target === AnimationJob) {
      throw new TypeError('Cannot construct AnimationJob instances directly');
    }

    this._startTime = 0;
    this._isComplete = true;
    this._onComplete = onComplete;
  }

  /**
   * Indicates whether this AnimationJob is complete.
   *
   * @return {boolean}
   */


  _createClass(AnimationJob, [{
    key: 'start',


    /**
     * Sets this AnimationJob as started.
     *
     * @param {DOMHighResTimeStamp} startTime
     */
    value: function start(startTime) {
      this._startTime = startTime;
      this._isComplete = false;
    }

    /**
     * Updates the animation progress of this AnimationJob to match the given time.
     *
     * This is called from the overall animation loop.
     *
     * @param {DOMHighResTimeStamp} currentTime
     * @param {DOMHighResTimeStamp} deltaTime
     * @abstract
     */

  }, {
    key: 'update',
    value: function update(currentTime, deltaTime) {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }

    /**
     * Draws the current state of this AnimationJob.
     *
     * This is called from the overall animation loop.
     *
     * @abstract
     */

  }, {
    key: 'draw',
    value: function draw() {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }

    /**
     * Handles any necessary state for this AnimationJob being finished.
     *
     * @param {boolean} isCancelled
     */

  }, {
    key: 'finish',
    value: function finish(isCancelled) {
      console.log(this.constructor.name + ' ' + (isCancelled ? 'cancelled' : 'completed'));

      this._isComplete = true;

      if (this._onComplete) {
        this._onComplete();
      }
    }
  }, {
    key: 'isComplete',
    get: function get() {
      return this._isComplete;
    }
  }]);

  return AnimationJob;
}();

exports.AnimationJob = AnimationJob;

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.animator = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _frameLatencyProfiler = require('./frame-latency-profiler');

var _persistentAnimationJob = require('./persistent-animation-job');

var _transientAnimationJob = require('./transient-animation-job');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _DELTA_TIME_UPPER_THRESHOLD = 200;
var _FRAME_DURATION_WARNING_THRESHOLD = 1000 / 30;
var _FRAME_LATENCY_LOG_PERIOD = 5000;
var _LATENCY_LOG_LABEL = 'Animation frame period';

/**
 * This class handles the animation loop.
 *
 * This class's responsibilities include:
 * - updating modules for the current frame,
 * - drawing renderables for the current frame,
 * - starting and stopping transient animation jobs,
 * - capping time step durations at a max threshold.
 */

var Animator = function () {
  function Animator() {
    _classCallCheck(this, Animator);

    this._jobs = [];
    this._previousTime = null;
    this._isPaused = true;
    this._requestAnimationFrameId = null;
    this._totalUnpausedRunTime = 0;
    this._lastUnpauseTime = null;
    this._latencyProfiler = new _frameLatencyProfiler.FrameLatencyProfiler(_FRAME_LATENCY_LOG_PERIOD, _FRAME_DURATION_WARNING_THRESHOLD, _LATENCY_LOG_LABEL);
  }

  /**
   * Starts the given AnimationJob.
   *
   * @param {AnimationJob} job
   */


  _createClass(Animator, [{
    key: 'startJob',
    value: function startJob(job) {
      // Is this a restart?
      if (!job.isComplete) {
        console.debug('Restarting AnimationJob: ' + job.constructor.name);

        if (job instanceof _persistentAnimationJob.PersistentAnimationJob) {
          job.reset();
        } else {
          job.finish(true);
          job.start(window.performance.now());
        }
      } else {
        console.debug('Starting AnimationJob: ' + job.constructor.name);

        job.start(this._previousTime);
        this._jobs.push(job);
      }

      this._startAnimationLoop();
    }

    /**
     * Cancels the given AnimationJob.
     *
     * @param {AnimationJob} job
     */

  }, {
    key: 'cancelJob',
    value: function cancelJob(job) {
      console.debug('Cancelling AnimationJob: ' + job.constructor.name);
      job.finish(true);
    }

    /**
     * Cancels all running AnimationJobs.
     */

  }, {
    key: 'cancelAll',
    value: function cancelAll() {
      while (this._jobs.length) {
        this.cancelJob(this._jobs[0]);
      }
    }

    /** @returns {DOMHighResTimeStamp} */

  }, {
    key: 'pause',
    value: function pause() {
      this._stopAnimationLoop();
      console.debug('Animator paused');
    }
  }, {
    key: 'unpause',
    value: function unpause() {
      this._startAnimationLoop();
      console.debug('Animator unpaused');
    }

    /**
     * This is the animation loop that drives all of the animation.
     *
     * @param {DOMHighResTimeStamp} currentTime
     * @private
     */

  }, {
    key: '_animationLoop',
    value: function _animationLoop(currentTime) {
      var _this = this;

      // When pausing and restarting, it's possible for the previous time to be slightly inconsistent
      // with the animationFrame time.
      if (currentTime < this._previousTime) {
        this._previousTime = currentTime - 1;
      }

      var deltaTime = currentTime - this._previousTime;
      this._previousTime = currentTime;

      this._latencyProfiler.recordFrameLatency(deltaTime);

      // Large delays between frames can cause lead to instability in the system, so this caps them to
      // a max threshold.
      deltaTime = deltaTime > _DELTA_TIME_UPPER_THRESHOLD ? _DELTA_TIME_UPPER_THRESHOLD : deltaTime;

      if (!this._isPaused) {
        this._requestAnimationFrameId = window.requestAnimationFrame(function (currentTime) {
          return _this._animationLoop(currentTime);
        });
        this._updateJobs(currentTime, deltaTime);
        this._drawJobs();
      }
    }

    /**
     * Updates all of the active AnimationJobs.
     *
     * @param {DOMHighResTimeStamp} currentTime
     * @param {DOMHighResTimeStamp} deltaTime
     * @private
     */

  }, {
    key: '_updateJobs',
    value: function _updateJobs(currentTime, deltaTime) {
      for (var i = 0, count = this._jobs.length; i < count; i++) {
        var job = this._jobs[i];

        // Remove jobs from the list after they are complete.
        if (job.isComplete) {
          this._removeJob(job, i);
          i--;
          count--;
          continue;
        }

        // Check whether the job is transient and has reached its end.
        if (job instanceof _transientAnimationJob.TransientAnimationJob && job.endTime < currentTime) {
          job.finish(false);
        } else {
          job.update(currentTime, deltaTime);
        }
      }
    }

    /**
     * Removes the given job from the collection of active, animating jobs.
     *
     * @param {AnimationJob} job
     * @param {number} [index=-1]
     * @private
     */

  }, {
    key: '_removeJob',
    value: function _removeJob(job) {
      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;

      console.debug('Removing AnimationJob: ' + job.constructor.name);

      if (index >= 0) {
        this._jobs.splice(index, 1);
      } else {
        var count = this._jobs.length;
        for (index = 0; index < count; index++) {
          if (this._jobs[index] === job) {
            this._jobs.splice(index, 1);
            break;
          }
        }
      }

      // Stop the animation loop when there are no more jobs to animate.
      if (this._jobs.length === 0) {
        this._stopAnimationLoop();
      }
    }

    /**
     * Draws all of the active AnimationJobs.
     *
     * @private
     */

  }, {
    key: '_drawJobs',
    value: function _drawJobs() {
      for (var i = 0, count = this._jobs.length; i < count; i++) {
        this._jobs[i].draw();
      }
    }

    /**
     * Starts the animation loop if it is not already running.
     *
     * This method is idempotent.
     *
     * @private
     */

  }, {
    key: '_startAnimationLoop',
    value: function _startAnimationLoop() {
      var _this2 = this;

      if (this._isPaused) {
        this._lastUnpauseTime = window.performance.now();
      }
      this._isPaused = false;

      // Only actually start the loop if it isn't already running and the page has focus.
      if (!this._requestAnimationFrameId && !document.hidden) {
        this._latencyProfiler.start();
        this._previousTime = window.performance.now();
        this._requestAnimationFrameId = window.requestAnimationFrame(function (time) {
          return _this2._animationLoop(time);
        });
      }
    }

    /**
     * Stops the animation loop.
     *
     * @private
     */

  }, {
    key: '_stopAnimationLoop',
    value: function _stopAnimationLoop() {
      if (!this._isPaused) {
        this._totalUnpausedRunTime += this._timeSinceLastPaused;
      }
      this._isPaused = true;
      window.cancelAnimationFrame(this._requestAnimationFrameId);
      this._requestAnimationFrameId = null;
      this._latencyProfiler.stop();
    }

    /**
     * Creates a promise that will resolve on the next animation loop.
     *
     * @returns {Promise}
     */

  }, {
    key: 'resolveOnNextFrame',
    value: function resolveOnNextFrame() {
      return new Promise(window.requestAnimationFrame);
    }

    /**
     * Gets the total amount of time the animator has been running while not paused.
     *
     * @returns {DOMHighResTimeStamp}
     */

  }, {
    key: 'currentTime',
    get: function get() {
      return this._previousTime;
    }

    /** @returns {boolean} */

  }, {
    key: 'isPaused',
    get: function get() {
      return this._isPaused;
    }
  }, {
    key: 'totalRunTime',
    get: function get() {
      return this._isPaused ? this._totalUnpausedRunTime : this._totalUnpausedRunTime + this._timeSinceLastPaused;
    }

    /**
     * @returns {DOMHighResTimeStamp}
     */

  }, {
    key: '_timeSinceLastPaused',
    get: function get() {
      return window.performance.now() - this._lastUnpauseTime;
    }
  }]);

  return Animator;
}();

var animator = new Animator();

exports.animator = animator;

/**
 * @typedef {number} DOMHighResTimeStamp A number of milliseconds, accurate to one thousandth of a
 * millisecond.
 */

},{"./frame-latency-profiler":5,"./persistent-animation-job":7,"./transient-animation-job":8}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * This class keeps track of avg/min/max frame latencies over the last logging time period and
 * periodically logs these values.
 */
var FrameLatencyProfiler = function () {
  /**
   * @param {number} logPeriod The period at which to print latency log messages. In milliseconds.
   * @param {number} latencyWarningThreshold If the average latency exceeds this threshold, then the
   * log message is shown as a warning. In milliseconds.
   * @param {string} logLabel A label to show for each latency log message.
   */
  function FrameLatencyProfiler(logPeriod, latencyWarningThreshold, logLabel) {
    _classCallCheck(this, FrameLatencyProfiler);

    this._logPeriod = logPeriod;
    this._latencyWarningThreshold = latencyWarningThreshold;
    this._logLabel = logLabel;

    this._frameCount = null;
    this._maxFrameLatency = null;
    this._minFrameLatency = null;
    this._avgFrameLatency = null;

    this._intervalId = null;
  }

  _createClass(FrameLatencyProfiler, [{
    key: "start",
    value: function start() {
      var _this = this;

      this.stop();
      this.reset();

      this._intervalId = setInterval(function () {
        _this.logFrameLatency();
        _this.reset();
      }, this._logPeriod);
    }
  }, {
    key: "stop",
    value: function stop() {
      clearInterval(this._intervalId);
    }
  }, {
    key: "reset",
    value: function reset() {
      this._frameCount = 0;
      this._maxFrameLatency = Number.MIN_VALUE;
      this._minFrameLatency = Number.MAX_VALUE;
      this._avgFrameLatency = 0;
    }

    /**
     * Keeps track of a running average, min value, and max value for the frame latencies.
     *
     * @param {DOMHighResTimeStamp} frameLatency
     */

  }, {
    key: "recordFrameLatency",
    value: function recordFrameLatency(frameLatency) {
      this._frameCount++;
      this._maxFrameLatency = this._maxFrameLatency < frameLatency ? frameLatency : this._maxFrameLatency;
      this._minFrameLatency = this._minFrameLatency > frameLatency ? frameLatency : this._minFrameLatency;
      this._avgFrameLatency = this._avgFrameLatency + (frameLatency - this._avgFrameLatency) / this._frameCount;
    }
  }, {
    key: "logFrameLatency",
    value: function logFrameLatency() {
      if (this._frameCount > 0) {
        var message = this._logLabel + ":  AVG=" + this._avgFrameLatency.toFixed(3) + "  " + ("(MAX=" + this._maxFrameLatency.toFixed(3) + "; MIN=" + this._minFrameLatency.toFixed(3) + ")");
        if (this._maxFrameLatency >= this._latencyWarningThreshold) {
          console.warn(message);
        } else {
          console.debug(message);
        }
      }
    }
  }]);

  return FrameLatencyProfiler;
}();

exports.FrameLatencyProfiler = FrameLatencyProfiler;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _animationJob = require('./animation-job');

Object.keys(_animationJob).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _animationJob[key];
    }
  });
});

var _animator = require('./animator');

Object.keys(_animator).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _animator[key];
    }
  });
});

var _frameLatencyProfiler = require('./frame-latency-profiler');

Object.keys(_frameLatencyProfiler).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _frameLatencyProfiler[key];
    }
  });
});

var _persistentAnimationJob = require('./persistent-animation-job');

Object.keys(_persistentAnimationJob).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _persistentAnimationJob[key];
    }
  });
});

var _transientAnimationJob = require('./transient-animation-job');

Object.keys(_transientAnimationJob).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _transientAnimationJob[key];
    }
  });
});

},{"./animation-job":3,"./animator":4,"./frame-latency-profiler":5,"./persistent-animation-job":7,"./transient-animation-job":8}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PersistentAnimationJob = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _animationJob = require('./animation-job');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A PersistentAnimationJob recurs or has an indefinite duration.
 *
 * @abstract
 */
var PersistentAnimationJob = function (_AnimationJob) {
  _inherits(PersistentAnimationJob, _AnimationJob);

  /**
   * @param {Function} [onComplete] A callback to be called when this AnimationJob is finished.
   */
  function PersistentAnimationJob(onComplete) {
    _classCallCheck(this, PersistentAnimationJob);

    // PersistentAnimationJob is an abstract class. It should not be instantiated directly.
    var _this = _possibleConstructorReturn(this, (PersistentAnimationJob.__proto__ || Object.getPrototypeOf(PersistentAnimationJob)).call(this, onComplete));

    if (new.target === PersistentAnimationJob) {
      throw new TypeError('Cannot construct PersistentAnimationJob instances directly');
    }
    return _this;
  }

  /**
   * @abstract
   */


  _createClass(PersistentAnimationJob, [{
    key: 'reset',
    value: function reset() {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }
  }]);

  return PersistentAnimationJob;
}(_animationJob.AnimationJob);

exports.PersistentAnimationJob = PersistentAnimationJob;

},{"./animation-job":3}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TransientAnimationJob = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util2 = require('./util');

var _animationJob = require('./animation-job');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A TransientAnimationJob is temporary and has a definite beginning and end.
 *
 * @abstract
 */
var TransientAnimationJob = function (_AnimationJob) {
  _inherits(TransientAnimationJob, _AnimationJob);

  /**
   * @param {number} duration
   * @param {number} delay
   * @param {Function|String} easingFunction
   * @param {Function} [onComplete] A callback to be called when this AnimationJob is finished.
   */
  function TransientAnimationJob(duration, delay, easingFunction, onComplete) {
    _classCallCheck(this, TransientAnimationJob);

    // TransientAnimationJob is an abstract class. It should not be instantiated directly.
    var _this = _possibleConstructorReturn(this, (TransientAnimationJob.__proto__ || Object.getPrototypeOf(TransientAnimationJob)).call(this, onComplete));

    if (new.target === TransientAnimationJob) {
      throw new TypeError('Cannot construct TransientAnimationJob instances directly');
    }

    _this._duration = duration;
    _this._delay = delay;
    _this._easingFunction = typeof easingFunction === 'function' ? easingFunction : _util2._util.easingFunctions[easingFunction];
    return _this;
  }

  /**
   * @returns {number}
   */


  _createClass(TransientAnimationJob, [{
    key: 'endTime',
    get: function get() {
      return this._startTime + this._duration + this._delay;
    }
  }]);

  return TransientAnimationJob;
}(_animationJob.AnimationJob);

exports.TransientAnimationJob = TransientAnimationJob;

},{"./animation-job":3,"./util":9}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * This module defines a collection of static utility functions.
 */

// A collection of different types of easing functions.
var easingFunctions = {
  linear: function linear(t) {
    return t;
  },
  easeInQuad: function easeInQuad(t) {
    return t * t;
  },
  easeOutQuad: function easeOutQuad(t) {
    return t * (2 - t);
  },
  easeInOutQuad: function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  easeInCubic: function easeInCubic(t) {
    return t * t * t;
  },
  easeOutCubic: function easeOutCubic(t) {
    return 1 + --t * t * t;
  },
  easeInOutCubic: function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  },
  easeInQuart: function easeInQuart(t) {
    return t * t * t * t;
  },
  easeOutQuart: function easeOutQuart(t) {
    return 1 - --t * t * t * t;
  },
  easeInOutQuart: function easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  },
  easeInQuint: function easeInQuint(t) {
    return t * t * t * t * t;
  },
  easeOutQuint: function easeOutQuint(t) {
    return 1 + --t * t * t * t * t;
  },
  easeInOutQuint: function easeInOutQuint(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
  }
};

var _util = {
  easingFunctions: easingFunctions
};

exports._util = _util;

},{}],10:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lslAnimatex = require('lsl-animatex');

Object.keys(_lslAnimatex).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _lslAnimatex[key];
    }
  });
});

var _grafx = require('grafx');

Object.keys(_grafx).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _grafx[key];
    }
  });
});

var _lslPhysx = require('lsl-physx');

Object.keys(_lslPhysx).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _lslPhysx[key];
    }
  });
});

var _collidablePhysicsModelController = require('./src/collidable-physics-model-controller');

Object.keys(_collidablePhysicsModelController).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _collidablePhysicsModelController[key];
    }
  });
});

var _configController = require('./src/config-controller');

Object.keys(_configController).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _configController[key];
    }
  });
});

var _gameController = require('./src/game-controller');

Object.keys(_gameController).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _gameController[key];
    }
  });
});

var _gameScene = require('./src/game-scene');

Object.keys(_gameScene).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _gameScene[key];
    }
  });
});

var _inputController = require('./src/input-controller');

Object.keys(_inputController).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _inputController[key];
    }
  });
});

var _physicsModelController = require('./src/physics-model-controller');

Object.keys(_physicsModelController).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _physicsModelController[key];
    }
  });
});

var _springFollowCamera = require('./src/spring-follow-camera');

Object.keys(_springFollowCamera).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _springFollowCamera[key];
    }
  });
});

var _wall = require('./wall');

Object.keys(_wall).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _wall[key];
    }
  });
});

},{"./src/collidable-physics-model-controller":12,"./src/config-controller":13,"./src/game-controller":14,"./src/game-scene":15,"./src/input-controller":16,"./src/physics-model-controller":17,"./src/spring-follow-camera":18,"./wall":19,"grafx":1,"lsl-animatex":2,"lsl-physx":10}],12:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CollidablePhysicsModelController = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _physicsModelController = require('./physics-model-controller');

var _lslPhysx = require('lsl-physx');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * This class represents a collidable physics-based model-controller.
 *
 * @abstract
 */
var CollidablePhysicsModelController = function (_PhysicsModelControll) {
  _inherits(CollidablePhysicsModelController, _PhysicsModelControll);

  /**
   * @param {ModelController|ModelControllerConfig} modelControllerOrParams
   * @param {CollidablePhysicsJob|DynamicsConfig} physicsJobOrDynamicsParams
   * @param {RenderableShapeConfig} [shapeParams]
   * @param {Array.<ForceApplier>} forceAppliers
   */
  function CollidablePhysicsModelController(modelControllerOrParams, physicsJobOrDynamicsParams, shapeParams, forceAppliers) {
    _classCallCheck(this, CollidablePhysicsModelController);

    var _this = _possibleConstructorReturn(this, (CollidablePhysicsModelController.__proto__ || Object.getPrototypeOf(CollidablePhysicsModelController)).call(this, modelControllerOrParams, physicsJobOrDynamicsParams, shapeParams, forceAppliers));

    if (physicsJobOrDynamicsParams instanceof _lslPhysx.CollidablePhysicsJob) {
      _this.physicsJob = physicsJobOrDynamicsParams;
    } else {
      var state = new _lslPhysx.PhysicsState(physicsJobOrDynamicsParams);
      _this.physicsJob = new _lslPhysx.CollidablePhysicsJob(shapeParams, state, forceAppliers, _this, function (collision) {
        return _this.handleCollision(collision);
      });
    }

    // CollidablePhysicsModelController is an abstract class. It should not be instantiated directly.
    if (new.target === CollidablePhysicsModelController) {
      throw new TypeError('Cannot construct CollidablePhysicsModelController instances directly');
    }
    return _this;
  }

  /**
   * This callback is triggered in response to a collision.
   *
   * @param {Collision} collision
   * @returns {boolean} True if this needs the standard collision restitution to proceed.
   * @abstract
   */

  _createClass(CollidablePhysicsModelController, [{
    key: 'handleCollision',
    value: function handleCollision(collision) {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }
  }]);

  return CollidablePhysicsModelController;
}(_physicsModelController.PhysicsModelController);

exports.CollidablePhysicsModelController = CollidablePhysicsModelController;

/**
 * @typedef {RenderableShapeConfig&CollidableShapeConfig} RenderableAndCollidableShapeConfig
 */

},{"./physics-model-controller":17,"lsl-physx":10}],13:[function(require,module,exports){
'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configController = undefined;

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _grafx = require('grafx');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _SMALL_SCREEN_WIDTH_THRESHOLD = 800;

/**
 * This top-level ConfigController class wraps the dat.GUI library and provides higher-level
 * configuration functionality.
 *
 * ## Configuring Parameters
 *
 * Consumers of this module will need to specify configuration parameters with a certain form. For
 * each property on a config object, an item will be created in the corresponding dat.GUI folder.
 * The type and specifics of the menu item depends on the value assigned to the config property:
 *
 * - Toggle item:
 *   - Created if the config property is a boolean.
 * - Trigger item:
 *   - Created if the config property is a function.
 * - Slider item:
 *   - Created if the config property is an object with 'min', 'max', and 'start' properties.
 *   - When the config object is parsed, this initial config object will be removed and replaced
 *     with only the current actual value.
 *   - The intervals of the slider are automatically determined by the dat.GUI library and depend on
 *     the type of the 'min'/'max'/'value' properties (int vs float). See the dat.GUI documentation
 *     for more info.
 * - Color item:
 *   - Created if the config property is an object with 'h'/'s'/'l' properties.
 *   - When the config object is parsed, this initial config object will be replaced with a new
 *     object that has 'h'/'s'/'v' properties and an 'hsl' property, which is an object containing
 *     'h'/'s'/'l' properties and a 'colorString' property that contains a valid color string to
 *     assign to a CSS property.
 *   - All 'h'/'s'/'l' and 'h'/'s'/'v' values should be in the range of [0,1].
 * - Text item:
 *   - Created if the config property is a String.
 */

var ConfigController = function () {
  function ConfigController() {
    _classCallCheck(this, ConfigController);

    this._datGuiWidth = 300;
    this._gui = null;
  }

  /**
   * Sets up the dat.GUI controller.
   */

  _createClass(ConfigController, [{
    key: 'initialize',
    value: function initialize() {
      var _this = this;

      // Create the dat.GUI menu.
      this._createGuiIfNotCreated(true);
      this._gui.width = this._datGuiWidth;

      // Automatically close the menu on smaller screens.
      // TODO: Check that the menu is closed initially (with no resize event) if the page loads at too small a width.
      var debouncedResize = (0, _grafx.debounce)(function () {
        return _this._onResize();
      }, 300);
      window.addEventListener('resize', debouncedResize, false);
    }

    /**
     * Clears the dat.GUI menu.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this._gui.destroy();
    }

    /**
     * @param {boolean} isGuiVisible
     * @private
     */

  }, {
    key: '_createGuiIfNotCreated',
    value: function _createGuiIfNotCreated(isGuiVisible) {
      if (this._gui) {
        if (isGuiVisible) {
          this._gui.domElement.style.display = 'block';
        }
      } else {
        this._gui = new dat.GUI();
        if (!isGuiVisible) {
          this._gui.domElement.style.display = 'none';
        }
      }
    }

    /**
     * Creates a folder with the given configuration underneath the given parent folder.
     *
     * @param {MenuFolderConfig} folderConfig
     * @param {dat.gui.GUI} [parentFolder] If not given, the folder is created at the top level.
     * @param {Object} [onChangeListeners] A map from labels to on-change handlers.
     */

  }, {
    key: 'createFolder',
    value: function createFolder(folderConfig, parentFolder, onChangeListeners) {
      this._createGuiIfNotCreated(false);

      parentFolder = parentFolder || this._gui;

      // TODO: Copy the original config and store it somehow on the dat.GUI menu item? This is important for resetting configs later (from the other controller).
      var folder = parentFolder.addFolder(folderConfig.label);

      folderConfig.folder = folder;

      this._createItems(folderConfig);

      // Add listeners from the config file.
      this._addOnChangeListeners(folderConfig, folderConfig.onChangeListeners, true);

      // Add listeners from the caller of this method.
      this._addOnChangeListeners(folderConfig, onChangeListeners, false);

      if (folderConfig.isOpen) {
        folder.open();
      }

      // Recursively create descendant folders.
      if (folderConfig.childFolders) {
        this.createFolders(folderConfig.childFolders, folder);
      }
    }

    /**
     * @param {Array.<MenuFolderConfig>} folderConfigs
     * @param {dat.gui.GUI} parentFolder
     */

  }, {
    key: 'createFolders',
    value: function createFolders(folderConfigs, parentFolder) {
      var _this2 = this;

      folderConfigs.forEach(function (folderConfig) {
        return _this2.createFolder(folderConfig, parentFolder);
      });
    }

    /**
     * @param {MenuFolderConfig} folderConfig
     * @param {string} label
     * @param {Function} callback
     */

  }, {
    key: 'addOnChangeListener',
    value: function addOnChangeListener(folderConfig, label, callback) {
      if (folderConfig.items[label]) {
        folderConfig.items[label].onChangeListeners.push(callback);
      } else {
        console.warn('Attempting to add on-change listener for a non-existent config', label, folderConfig);
      }
    }
  }, {
    key: 'hideMenu',
    value: function hideMenu() {
      console.info('Hide Menu clicked');
      document.querySelector('body > .dg').style.display = 'none';
    }

    /**
     * NOTE: This is not idempotent. This modifies the original folderConfig.config object.
     *
     * @param {MenuFolderConfig} folderConfig
     * @private
     */

  }, {
    key: '_createItems',
    value: function _createItems(folderConfig) {
      var _this3 = this;

      folderConfig.items = {};

      Object.keys(folderConfig.config).forEach(function (itemConfigKey) {
        // Do not expose internal configurations to the user.
        if (itemConfigKey.substr(0, 1) === '_') return;

        var itemConfig = folderConfig.config[itemConfigKey];

        // Determine which method to use to create the menu item.
        var pair = (0, _grafx.find)([[ConfigController.isToggleItem, ConfigController._createToggleItem], [ConfigController.isTriggerItem, ConfigController._createTriggerItem], [ConfigController.isSliderItem, ConfigController._createSliderItem], [ConfigController.isNumberItem, ConfigController._createNumberItem], [ConfigController.isHslColorItem, ConfigController._createHslColorItem], [ConfigController.isTextItem, ConfigController._createTextItem], [ConfigController.isStringSelectorItem, ConfigController._createStringSelectorItem], [ConfigController.isVec3NumberItem, ConfigController._createVec3NumberItems], [ConfigController.isVec3SliderItem, ConfigController._createVec3SliderItems]], function (pair) {
          return pair[0](itemConfig);
        });
        if (!pair) {
          console.warn('Unrecognized config type', itemConfig);
          return;
        }
        var menuItemCreator = pair[1];

        // Create the actual dat.GUI menu item and save a reference to it.
        var menuItemData = menuItemCreator.call(_this3, folderConfig.config, itemConfigKey, itemConfig, folderConfig.folder);
        if (menuItemData instanceof Array) {
          var parentMenuItemData = { onChangeListeners: [] };

          // Record the individual sub-items.
          menuItemData.forEach(function (data) {
            folderConfig.items[data.label] = data;

            // Hook up the (parent item's) onChange listeners.
            data.menuItem.onChange(function () {
              data.onChangeListeners.forEach(function (callback) {
                return callback();
              });
              parentMenuItemData.onChangeListeners.forEach(function (callback) {
                return callback();
              });
            });
          });

          // Record the parent item.
          folderConfig.items[itemConfigKey] = parentMenuItemData;
        } else {
          folderConfig.items[itemConfigKey] = menuItemData;

          // Hook up the onChange listeners.
          menuItemData.menuItem.onChange(function () {
            return menuItemData.onChangeListeners.forEach(function (callback) {
              return callback();
            });
          });
        }
      });
    }

    /**
     * @param {MenuFolderConfig} folderConfig
     * @param {Object} onChangeListeners A map from labels to on-change event handlers.
     * @param {boolean} makeInitialCallToListeners
     * @private
     */

  }, {
    key: '_addOnChangeListeners',
    value: function _addOnChangeListeners(folderConfig, onChangeListeners, makeInitialCallToListeners) {
      if (onChangeListeners) {
        Object.keys(onChangeListeners).forEach(function (key) {
          var onChangeHandler = onChangeListeners[key];
          configController.addOnChangeListener(folderConfig, key, onChangeHandler);
          if (makeInitialCallToListeners) {
            onChangeHandler();
          }
        });
      }
    }

    /**
     * Close the menu on smaller screens.
     */

  }, {
    key: '_onResize',
    value: function _onResize() {
      var _this4 = this;

      setTimeout(function () {
        if ((0, _grafx.getViewportSize)() < _SMALL_SCREEN_WIDTH_THRESHOLD) {
          _this4._gui.close();
        }
      }, 10);
    }

    /**
     * @param {Object} configObject
     * @param {string} label
     * @param {ToggleMenuItemConfig} itemConfig
     * @param {dat.gui.GUI} folder
     * @returns {MenuItemData}
     * @private
     */

  }], [{
    key: '_createToggleItem',
    value: function _createToggleItem(configObject, label, itemConfig, folder) {
      return {
        menuItem: folder.add(configObject, label),
        onChangeListeners: []
      };
    }

    /**
     * @param {Object} configObject
     * @param {string} label
     * @param {TriggerMenuItemConfig} itemConfig
     * @param {dat.gui.GUI} folder
     * @returns {MenuItemData}
     * @private
     */

  }, {
    key: '_createTriggerItem',
    value: function _createTriggerItem(configObject, label, itemConfig, folder) {
      return {
        menuItem: folder.add(configObject, label),
        onChangeListeners: []
      };
    }

    /**
     * @param {Object} configObject
     * @param {string} label
     * @param {SliderMenuItemConfig} itemConfig
     * @param {dat.gui.GUI} folder
     * @returns {MenuItemData}
     * @private
     */

  }, {
    key: '_createSliderItem',
    value: function _createSliderItem(configObject, label, itemConfig, folder) {
      // Replace the original itemConfig on the configObject with the actual starting value.
      configObject[label] = itemConfig.start;

      var listeners = (0, _grafx.isInt)(itemConfig.min) && (0, _grafx.isInt)(itemConfig.max) ? [ConfigController._truncateToInt.bind(null, configObject, label)] : [];

      // Create the menu item.
      return {
        menuItem: folder.add(configObject, label, itemConfig.min, itemConfig.max),
        onChangeListeners: listeners
      };
    }

    /**
     * @param {Object} configObject
     * @param {string} label
     * @param {NumberMenuItemConfig} itemConfig
     * @param {dat.gui.GUI} folder
     * @returns {MenuItemData}
     * @private
     */

  }, {
    key: '_createNumberItem',
    value: function _createNumberItem(configObject, label, itemConfig, folder) {
      // Create the menu item.
      return {
        menuItem: folder.add(configObject, label),
        onChangeListeners: []
      };
    }

    /**
     * This is used to force int sliders to only produce ints.
     *
     * This shouldn't be needed, but dat.GUI doesn't seem to be behaving consistently.
     *
     * @param configObject
     * @param label
     * @private
     */

  }, {
    key: '_truncateToInt',
    value: function _truncateToInt(configObject, label) {
      configObject[label] = parseInt(configObject[label]);
    }

    /**
     * @param {Object} configObject
     * @param {string} label
     * @param {HslColorMenuItemConfig} itemConfig
     * @param {dat.gui.GUI} folder
     * @returns {MenuItemData}
     * @private
     */

  }, {
    key: '_createHslColorItem',
    value: function _createHslColorItem(configObject, label, itemConfig, folder) {
      // Create the property that the menu item will use.
      itemConfig = (0, _grafx.hslToHsv)(itemConfig);
      configObject[label] = itemConfig;

      // Set up a listener that will keep derived HSL values in sync with the native HSV values used
      // by the dat.GUI menu item.
      var calculateHslValues = function calculateHslValues() {
        var hsl = (0, _grafx.hsvToHsl)(configObject[label]);
        var rgb = (0, _grafx.hslToRgb)(hsl);
        itemConfig.hsl = hsl;
        itemConfig.rgb = rgb;
        itemConfig.rgbVec = vec3.fromValues(rgb.r, rgb.g, rgb.b);
        itemConfig.hsl.colorString = (0, _grafx.createHslColorString)(hsl);
      };
      calculateHslValues();

      // Create the menu item.
      return {
        menuItem: folder.addColor(configObject, label),
        onChangeListeners: [calculateHslValues]
      };
    }

    /**
     * @param {Object} configObject
     * @param {string} label
     * @param {TextMenuItemConfig} itemConfig
     * @param {dat.gui.GUI} folder
     * @returns {MenuItemData}
     * @private
     */

  }, {
    key: '_createTextItem',
    value: function _createTextItem(configObject, label, itemConfig, folder) {
      return {
        menuItem: folder.add(configObject, label),
        onChangeListeners: []
      };
    }

    /**
     * @param {Object} configObject
     * @param {string} label
     * @param {Vec3NumberMenuItemConfig} itemConfig
     * @param {dat.gui.GUI} folder
     * @returns {Array.<MenuItemData>}
     * @private
     */

  }, {
    key: '_createVec3NumberItems',
    value: function _createVec3NumberItems(configObject, label, itemConfig, folder) {
      var xLabel = label + 'X';
      var yLabel = label + 'Y';
      var zLabel = label + 'Z';

      // Set up a listener that will keep the derived vec3 in sync with its individual coordinates.
      var _updateVec3 = function _updateVec3() {
        return vec3.set(itemConfig, configObject[xLabel], configObject[yLabel], configObject[zLabel]);
      };

      return [[0, xLabel], [1, yLabel], [2, zLabel]].map(function (indexAndLabel) {
        var index = indexAndLabel[0];
        var label = indexAndLabel[1];

        // Create the individual vec3 coordinate property and initial value.
        configObject[label] = itemConfig[index];

        // Create the individual vec3 coordinate menu item.
        return {
          menuItem: folder.add(configObject, label),
          onChangeListeners: [_updateVec3],
          label: label
        };
      });
    }

    /**
     * @param {Object} configObject
     * @param {string} label
     * @param {Vec3SliderMenuItemConfig} itemConfig
     * @param {dat.gui.GUI} folder
     * @returns {Array.<MenuItemData>}
     * @private
     */

  }, {
    key: '_createVec3SliderItems',
    value: function _createVec3SliderItems(configObject, label, itemConfig, folder) {
      // Replace the original itemConfig on the configObject with the actual starting value.
      configObject[label] = itemConfig.start;

      var xLabel = label + 'X';
      var yLabel = label + 'Y';
      var zLabel = label + 'Z';

      // Set up a listener that will keep the derived vec3 in sync with its individual coordinates.
      var _updateVec3 = function _updateVec3() {
        return vec3.set(configObject[label], configObject[xLabel], configObject[yLabel], configObject[zLabel]);
      };

      return [[0, xLabel], [1, yLabel], [2, zLabel]].map(function (indexAndLabel) {
        var index = indexAndLabel[0];
        var label = indexAndLabel[1];
        var start = itemConfig.start[index];
        var min = itemConfig.min[index];
        var max = itemConfig.max[index];

        // Create the individual vec3 coordinate property and initial value.
        configObject[label] = start;

        // Create the individual vec3 coordinate menu item.
        return {
          menuItem: folder.add(configObject, label, min, max),
          onChangeListeners: [_updateVec3],
          label: label
        };
      });
    }

    /**
     * @param {Object} configObject
     * @param {string} label
     * @param {StringSelectorMenuItemConfig} itemConfig
     * @param {dat.gui.GUI} folder
     * @returns {MenuItemData}
     * @private
     */

  }, {
    key: '_createStringSelectorItem',
    value: function _createStringSelectorItem(configObject, label, itemConfig, folder) {
      // Replace the original itemConfig on the configObject with the actual starting value.
      configObject[label] = itemConfig.start;

      return {
        menuItem: folder.add(configObject, label, itemConfig.options),
        onChangeListeners: []
      };
    }

    /**
     * @param {MenuItemConfig} itemConfig
     * @returns {boolean}
     */

  }, {
    key: 'isToggleItem',
    value: function isToggleItem(itemConfig) {
      return typeof itemConfig === 'boolean';
    }

    /**
     * @param {MenuItemConfig} itemConfig
     * @returns {boolean}
     */

  }, {
    key: 'isTriggerItem',
    value: function isTriggerItem(itemConfig) {
      return typeof itemConfig === 'function';
    }

    /**
     * @param {MenuItemConfig} itemConfig
     * @returns {boolean}
     */

  }, {
    key: 'isSliderItem',
    value: function isSliderItem(itemConfig) {
      return (typeof itemConfig === 'undefined' ? 'undefined' : _typeof(itemConfig)) === 'object' && typeof itemConfig.start === 'number' && typeof itemConfig.min === 'number' && typeof itemConfig.max === 'number';
    }

    /**
     * @param {MenuItemConfig} itemConfig
     * @returns {boolean}
     */

  }, {
    key: 'isNumberItem',
    value: function isNumberItem(itemConfig) {
      return typeof itemConfig === 'number';
    }

    /**
     * @param {MenuItemConfig} itemConfig
     * @returns {boolean}
     */

  }, {
    key: 'isHslColorItem',
    value: function isHslColorItem(itemConfig) {
      return (typeof itemConfig === 'undefined' ? 'undefined' : _typeof(itemConfig)) === 'object' && typeof itemConfig.h === 'number' && typeof itemConfig.s === 'number' && typeof itemConfig.l === 'number';
    }

    /**
     * @param {MenuItemConfig} itemConfig
     * @returns {boolean}
     */

  }, {
    key: 'isTextItem',
    value: function isTextItem(itemConfig) {
      return typeof itemConfig === 'string';
    }

    /**
     * @param {MenuItemConfig} itemConfig
     * @returns {boolean}
     */

  }, {
    key: 'isStringSelectorItem',
    value: function isStringSelectorItem(itemConfig) {
      return (typeof itemConfig === 'undefined' ? 'undefined' : _typeof(itemConfig)) === 'object' && typeof itemConfig.start === 'string' && itemConfig.options instanceof Array;
    }

    /**
     * @param {MenuItemConfig} itemConfig
     * @returns {boolean}
     */

  }, {
    key: 'isVec3NumberItem',
    value: function isVec3NumberItem(itemConfig) {
      return (itemConfig instanceof Float32Array || itemConfig instanceof Array) && itemConfig.length === 3;
    }

    /**
     * @param {MenuItemConfig} itemConfig
     * @returns {boolean}
     */

  }, {
    key: 'isVec3SliderItem',
    value: function isVec3SliderItem(itemConfig) {
      return (typeof itemConfig === 'undefined' ? 'undefined' : _typeof(itemConfig)) === 'object' && ConfigController.isVec3NumberItem(itemConfig.start) && ConfigController.isVec3NumberItem(itemConfig.min) && ConfigController.isVec3NumberItem(itemConfig.max);
    }
  }]);

  return ConfigController;
}();

var configController = new ConfigController();

exports.configController = configController;

/**
 * @typedef {Object} MenuItemData
 * @property {dat.gui.controller} menuItem The actual dat.GUI menu item.
 * @property {Array.<Function>} onChangeListeners onChange listeners for the menu item.
 * @property {string} [label] The label used for the menu item.
 */

/**
 * @typedef {Object} MenuFolderConfig
 * @property {string} label
 * @property {Object} config A map from labels to MenuItemConfigs. Any config item whose label
 * starts with '_' will be treated as internal and will not be exposed to the user.
 * @property {boolean} [isOpen=false]
 * @property {Object} [onChangeListeners] A map from labels to on-change event handlers.
 * @property {Array.<MenuFolderConfig>} [childFolders]
 * @property {Object} [items] A map from labels to MenuItemDatas.
 * @property {dat.gui.GUI} [folder] Created and added by the ConfigController after registering the
 * folder.
 */

/**
 * @typedef {ToggleMenuItemConfig|TriggerMenuItemConfig|SliderMenuItemConfig|NumberMenuItemConfig|HslColorMenuItemConfig|TextMenuItemConfig|StringSelectorMenuItemConfig|Vec3NumberMenuItemConfig|Vec3SliderMenuItemConfig} MenuItemConfig
 */

/**
 * @typedef {boolean} ToggleMenuItemConfig
 */

/**
 * @typedef {Function} TriggerMenuItemConfig
 */

/**
 * @typedef {Object} SliderMenuItemConfig
 * @property {number} start
 * @property {number} min
 * @property {number} max
 */

/**
 * @typedef {number} NumberMenuItemConfig
 */

/**
 * @typedef {Object} HslColorMenuItemConfig
 * @property {number} h A value from 0 to 1.
 * @property {number} s A value from 0 to 1.
 * @property {number} l A value from 0 to 1.
 */

/**
 * @typedef {string} TextMenuItemConfig
 */

/**
 * @typedef {Object} StringSelectorMenuItemConfig
 * @property {string} start
 * @property {Array.<String>} options
 */

/**
 * @typedef {vec3} Vec3NumberMenuItemConfig
 */

/**
 * @typedef {Object} Vec3SliderMenuItemConfig
 * @property {vec3} start
 * @property {vec3} min
 * @property {vec3} max
 */

},{"grafx":1}],14:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GameController = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;var desc = Object.getOwnPropertyDescriptor(object, property);if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;if (getter === undefined) {
      return undefined;
    }return getter.call(receiver);
  }
};

var _lslAnimatex = require('lsl-animatex');

var _grafx = require('grafx');

var _configController = require('./config-controller');

var _inputController = require('./input-controller');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * This top-level Controller class initializes and runs the rest of the app.
 */
var GameController = function (_GrafxController) {
  _inherits(GameController, _GrafxController);

  function GameController() {
    _classCallCheck(this, GameController);

    var _this = _possibleConstructorReturn(this, (GameController.__proto__ || Object.getPrototypeOf(GameController)).call(this));

    _this.isGameOver = true;
    _this._inputCtrl = null;
    return _this;
  }

  /**
   * Initializes the app. After this completes successfully, call run to actually start the app.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {Array.<ProgramWrapperConfig>} programConfigs Configurations for program wrappers that
   * should be pre-cached before starting the rest of the app.
   * @param {Array.<String>} texturePaths Texture images that should be pre-cached before
   * starting the rest of the app.
   * @param {Function.<Scene>} SceneImpl A class that extends GameScene.
   * @returns {Promise}
   */

  _createClass(GameController, [{
    key: 'initialize',
    value: function initialize(canvas, programConfigs, texturePaths, SceneImpl) {
      this._canvas = canvas;

      _configController.configController.initialize();
      this._setUpInput();

      return _get(GameController.prototype.__proto__ || Object.getPrototypeOf(GameController.prototype), 'initialize', this).call(this, canvas, programConfigs, texturePaths, SceneImpl);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this._inputCtrl.destroy();
    }

    /**
     * Runs the app. This should be called after initialize.
     *
     * A few things happen if this is run in dev mode:
     * - The draw and update steps of each frame are wrapped in a try/catch block.
     * - This method returns a Promise that rejects if an error is throw during any update or draw
     *   step and resolves when this controller has finished (currently never)
     */

  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      (0, _grafx.handlePageFocusChange)(function (hasFocus) {
        return _this2._onPageFocusChange(hasFocus);
      });
      _get(GameController.prototype.__proto__ || Object.getPrototypeOf(GameController.prototype), 'run', this).call(this);
    }
  }, {
    key: 'pause',
    value: function pause() {
      _lslAnimatex.animator.pause();
    }
  }, {
    key: 'unpause',
    value: function unpause() {
      _lslAnimatex.animator.unpause();
    }

    /**
     * @returns {boolean}
     */

  }, {
    key: '_onPageFocusChange',

    /**
     * @param {boolean} hasFocus
     * @private
     */
    value: function _onPageFocusChange(hasFocus) {
      if (!hasFocus) {
        this.pause();
      }
    }

    /**
     * @private
     */

  }, {
    key: '_setUpInput',
    value: function _setUpInput() {
      this._inputCtrl = new _inputController.InputController();
      this._inputCtrl.preventDefaultBrowserBehaviorForKey('SPACE');
    }

    /**
     * Initializes the scene.
     *
     * @param {Function.<Scene>} SceneImpl A class that extends GameScene.
     * @returns {Promise}
     * @protected
     */

  }, {
    key: '_setUpScene',
    value: function _setUpScene(SceneImpl) {
      var _this3 = this;

      this._scene = new SceneImpl({
        gl: this._gl,
        getViewMatrix: function getViewMatrix() {
          return _this3._getViewMatrix();
        },
        getProjectionMatrix: function getProjectionMatrix() {
          return _this3._getProjectionMatrix();
        }
      }, this, this._inputCtrl);
      return this._scene.getIsReady().then(function () {
        _this3._scene.reset();
        _this3._updateAspectRatio(); // TODO: This should NOT happen here or using the glUtil globals.
      });
    }
  }, {
    key: 'isPaused',
    get: function get() {
      return _lslAnimatex.animator.isPaused;
    }
  }]);

  return GameController;
}(_grafx.GrafxController);

exports.GameController = GameController;

},{"./config-controller":13,"./input-controller":16,"grafx":1,"lsl-animatex":2}],15:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GameScene = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;var desc = Object.getOwnPropertyDescriptor(object, property);if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;if (getter === undefined) {
      return undefined;
    }return getter.call(receiver);
  }
};

var _grafx = require('grafx');

var _lslPhysx = require('lsl-physx');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * This class handles the overall scene.
 *
 * @abstract
 */
var GameScene = function (_Scene) {
  _inherits(GameScene, _Scene);

  /**
   * @param {ModelGroupControllerConfig} modelControllerParams
   * @param {GameController} gameCtrl
   * @param {InputController} inputCtrl
   * @param {number} renderDistance
   */
  function GameScene(modelControllerParams, gameCtrl, inputCtrl, renderDistance) {
    _classCallCheck(this, GameScene);

    // GameScene is an abstract class. It should not be instantiated directly.
    var _this = _possibleConstructorReturn(this, (GameScene.__proto__ || Object.getPrototypeOf(GameScene)).call(this, modelControllerParams));

    if (new.target === GameScene) {
      throw new TypeError('Cannot construct GameScene instances directly');
    }

    _this._gameCtrl = gameCtrl;
    _this._inputCtrl = inputCtrl;
    _this._renderDistance = renderDistance;
    _this._bounds = _lslPhysx.Aabb.createAsUniformAroundCenter(vec3.fromValues(0, 0, 0), _this._renderDistance);
    return _this;
  }

  _createClass(GameScene, [{
    key: 'reset',
    value: function reset() {
      this.centerOfVolume = vec3.fromValues(0, 0, 0);
      _get(GameScene.prototype.__proto__ || Object.getPrototypeOf(GameScene.prototype), 'reset', this).call(this);
    }

    /** @returns {Aabb} */

  }, {
    key: 'bounds',
    get: function get() {
      return this._bounds;
    }
    /** @returns {vec3} */

  }, {
    key: 'centerOfVolume',
    get: function get() {
      return this._bounds.centerOfVolume;
    }
    /** @param {vec3} value */

    , set: function set(value) {
      this._bounds.setAsUniformAroundCenter(value, this._renderDistance);
    }
  }]);

  return GameScene;
}(_grafx.Scene);

exports.GameScene = GameScene;

},{"grafx":1,"lsl-physx":10}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InputController = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _grafx = require('grafx');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

// TODO: Figure out how to capture: tab, space, escape, enter; prevent their default behaviors when
// listeners have been registered for them.

/**
 * This class handles user input.
 */
var InputController = function () {
  function InputController() {
    var _this = this;

    _classCallCheck(this, InputController);

    this._keyDownListeners = {};
    this._keyUpListeners = {};
    this._currentlyPressedKeys = {};
    this._keysToPreventDefaultBrowserBehaviorFor = {};

    this._mainKeyDownListener = function (event) {
      return _this._handleKeyDown(event);
    };
    this._mainKeyUpListener = function (event) {
      return _this._handleKeyUp(event);
    };
    this._mainKeyPressListener = function (event) {
      return _this._handleKeyPress(event);
    };

    window.addEventListener('keydown', this._mainKeyDownListener, false);
    window.addEventListener('keyup', this._mainKeyUpListener, false);
    window.addEventListener('keypress', this._mainKeyPressListener, false);
  }

  _createClass(InputController, [{
    key: 'destroy',
    value: function destroy() {
      window.removeEventListener('keydown', this._mainKeyDownListener);
      window.removeEventListener('keyup', this._mainKeyUpListener);
      window.removeEventListener('keypress', this._mainKeyPressListener);
    }

    /**
     * Registers a callback to be called whenever the given key is pressed.
     *
     * @param {string} key
     * @param {Function} callback
     */

  }, {
    key: 'addKeyDownListener',
    value: function addKeyDownListener(key, callback) {
      var listenersForKey = this._keyDownListeners[_grafx.keyCodes[key]];

      // Make sure the listener list is initialized for this key.
      if (!listenersForKey) {
        listenersForKey = new Set();
        this._keyDownListeners[_grafx.keyCodes[key]] = listenersForKey;
      }

      listenersForKey.add(callback);
    }

    /**
     * Registers a callback to be called whenever the given key is lifted.
     *
     * @param {string} key
     * @param {Function} callback
     */

  }, {
    key: 'addKeyUpListener',
    value: function addKeyUpListener(key, callback) {
      var listenersForKey = this._keyUpListeners[_grafx.keyCodes[key]];

      // Make sure the listener list is initialized for this key.
      if (!listenersForKey) {
        listenersForKey = new Set();
        this._keyUpListeners[_grafx.keyCodes[key]] = listenersForKey;
      }

      listenersForKey.add(callback);
    }

    /**
     * Un-registers a callback to be called whenever the given key is pressed.
     *
     * @param {string} key
     * @param {Function} callback
     */

  }, {
    key: 'removeKeyDownListener',
    value: function removeKeyDownListener(key, callback) {
      this._keyDownListeners[_grafx.keyCodes[key]].delete(callback);
    }

    /**
     * Un-registers a callback to be called whenever the given key is lifted.
     *
     * @param {string} key
     * @param {Function} callback
     */

  }, {
    key: 'removeKeyUpListener',
    value: function removeKeyUpListener(key, callback) {
      this._keyUpListeners[_grafx.keyCodes[key]].delete(callback);
    }

    /**
     * Registers the given key to prevent the default browser behavior when it is pressed.
     *
     * @param {string} key
     */

  }, {
    key: 'preventDefaultBrowserBehaviorForKey',
    value: function preventDefaultBrowserBehaviorForKey(key) {
      this._keysToPreventDefaultBrowserBehaviorFor[_grafx.keyCodes[key]] = true;
    }

    /**
     * Un-registers the given key to prevent the default browser behavior when it is pressed.
     *
     * @param {string} key
     */

  }, {
    key: 'allowDefaultBrowserBehaviorForKey',
    value: function allowDefaultBrowserBehaviorForKey(key) {
      delete this._keysToPreventDefaultBrowserBehaviorFor[_grafx.keyCodes[key]];
    }

    /**
     * Determines whether the given key is currently pressed down.
     *
     * @param {string} key
     * @returns {boolean}
     */

  }, {
    key: 'isKeyCurrentlyPressed',
    value: function isKeyCurrentlyPressed(key) {
      return !!this._currentlyPressedKeys[_grafx.keyCodes[key]];
    }

    /**
     * Saves the given key as being pressed.
     *
     * @param {KeyboardEvent} event
     * @private
     */

  }, {
    key: '_handleKeyDown',
    value: function _handleKeyDown(event) {
      // If this key was already being pressed down, then do nothing (when a key is held down, many
      // keydown events are actually triggered).
      if (this._currentlyPressedKeys[event.keyCode]) {
        return;
      }

      // Mark this key as being pressed down.
      this._currentlyPressedKeys[event.keyCode] = true;

      // Call any registered key-down listeners for this key.
      var listeners = this._keyDownListeners[event.keyCode];
      if (listeners) {
        listeners.forEach(function (listener) {
          return listener();
        });
      }
    }

    /**
     * Calls all key-up listeners that have been registered for the given key.
     *
     * @param {KeyboardEvent} event
     * @private
     */

  }, {
    key: '_handleKeyUp',
    value: function _handleKeyUp(event) {
      // Mark this key as no longer being pressed down.
      delete this._currentlyPressedKeys[event.keyCode];

      // Call any registered key-up listeners for this key.
      var listeners = this._keyUpListeners[event.keyCode];
      if (listeners) {
        listeners.forEach(function (listener) {
          return listener();
        });
      }
    }

    /**
     * Prevents the default browser behavior for keys that have been registered to prevent.
     *
     * @param {KeyboardEvent} event
     * @private
     */

  }, {
    key: '_handleKeyPress',
    value: function _handleKeyPress(event) {
      if (this._keysToPreventDefaultBrowserBehaviorFor[event.keyCode]) {
        event.preventDefault();
      }
    }
  }]);

  return InputController;
}();

exports.InputController = InputController;

},{"grafx":1}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PhysicsModelController = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _grafx = require('grafx');

var _lslPhysx = require('lsl-physx');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * This class represents a non-collidable physics-based model-controller.
 *
 * It uses composition to control an instance of a ModelController along with a corresponding
 * instance of a PhysicsJob.
 *
 * @implements {ModelControllerInterface}
 * @abstract
 */
var PhysicsModelController = function () {
  /**
   * @param {ModelController|ModelControllerConfig} modelControllerOrParams
   * @param {PhysicsJob|DynamicsConfig} physicsJobOrDynamicsParams
   * @param {RenderableShapeConfig} [shapeParams]
   * @param {Array.<ForceApplier>} [forceAppliers]
   */
  function PhysicsModelController(modelControllerOrParams, physicsJobOrDynamicsParams, shapeParams, forceAppliers) {
    var _this = this;

    _classCallCheck(this, PhysicsModelController);

    // PhysicsModelController is an abstract class. It should not be instantiated directly.
    if (new.target === PhysicsModelController) {
      throw new TypeError('Cannot construct PhysicsModelController instances directly');
    }

    this.modelCtrl = modelControllerOrParams instanceof _grafx.ModelController ? modelControllerOrParams : new _grafx.StandardModelController(modelControllerOrParams, shapeParams);

    if (physicsJobOrDynamicsParams instanceof _lslPhysx.PhysicsJob) {
      this.physicsJob = physicsJobOrDynamicsParams;
    } else {
      var state = new _lslPhysx.PhysicsState(physicsJobOrDynamicsParams);
      this.physicsJob = new _lslPhysx.PhysicsJob(forceAppliers, state);
    }

    this._originalPosition = vec3.clone(this.physicsJob.currentState.position);

    this._patchModelController({
      /**
       * Patches the ModelController's updateTransforms method in order to keep it's local-transform
       * matrix in-sync with the PhysicsJob's position and orientation.
       */
      updateTransforms: function updateTransforms(superVersion) {
        // Update the ModelController's local-transform matrix according to the PhysicsJob's
        // current position and orientation.
        mat4.fromRotationTranslationScale(_this.modelCtrl._localTransform, _this.renderOrientation, _this.renderPosition, _this.modelCtrl.scale);
        superVersion();
      }
    });

    if (_grafx.isInDevMode) {
      var controllerName = this.constructor.name.replace('Controller', '');
      console.debug(controllerName + ' created @ ' + (0, _grafx.vec3ToString)(this.position));
    }
  }

  /**
   * Patches the given methods on the underlying ModelController.
   *
   * The patched methods are passed the original or "super" version of the method as the first
   * argument; the normal method arguments are provided after.
   *
   * @protected
   */

  _createClass(PhysicsModelController, [{
    key: '_patchModelController',
    value: function _patchModelController(patches) {
      var _this2 = this;

      Object.keys(patches).forEach(function (methodName) {
        var newMethod = patches[methodName];
        var superVersion = _this2.modelCtrl[methodName].bind(_this2.modelCtrl);
        _this2.modelCtrl[methodName] = newMethod.bind(_this2.modelCtrl, superVersion);
      });
    }

    /**
     * Registers this controller's PhysicsJob(s) with the physics engine.
     */

  }, {
    key: 'reset',
    value: function reset() {
      this.modelCtrl.reset();
      this.physicsJob.position = this._originalPosition;
      this.physicsJob.finish();
      this.physicsJob.start();
    }

    /**
     * Unregisters this controller's PhysicsJob(s) with the physics engine.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.modelCtrl.destroy();
      this.physicsJob.finish();
      if (_grafx.isInDevMode) {
        var controllerName = this.constructor.name.replace('Controller', '');
        console.debug(controllerName + ' destroyed @ ' + (0, _grafx.vec3ToString)(this.position));
      }
    }

    /** @param {vec3} value */

  }, {
    key: 'getIsReady',

    /**
     * Returns a promise that resolves when this model controller is ready for the app to run.
     *
     * @returns {Promise}
     */
    value: function getIsReady() {
      return this.modelCtrl.getIsReady();
    }
    /**
     * Gets the model transform matrix, in local coordinates.
     *
     * @returns {mat4}
     */

  }, {
    key: 'updateSelfAndChildren',

    /**
     * Calls update, updateTransforms, and updateChildren.
     *
     * @param {DOMHighResTimeStamp} currentTime
     * @param {DOMHighResTimeStamp} deltaTime
     */
    value: function updateSelfAndChildren(currentTime, deltaTime) {
      this.modelCtrl.updateSelfAndChildren(currentTime, deltaTime);
    }
  }, {
    key: 'position',
    set: function set(value) {
      this.physicsJob.position = value;
    }
    /** @returns {vec3} */

    , get: function get() {
      return this.physicsJob.currentState.position;
    }
    /** @returns {quat} */

  }, {
    key: 'orientation',
    get: function get() {
      return this.physicsJob.currentState.orientation;
    }
    // FIXME: Can I remove this?
    /** @returns {vec3} */

  }, {
    key: 'velocity',
    get: function get() {
      return this.physicsJob.currentState.velocity;
    }

    /** @returns {vec3} */

  }, {
    key: 'renderPosition',
    get: function get() {
      return this.physicsJob.renderState.position;
    }
    /** @returns {quat} */

  }, {
    key: 'renderOrientation',
    get: function get() {
      return this.physicsJob.renderState.orientation;
    }
    // FIXME: Can I remove this?
    /** @returns {vec3} */

  }, {
    key: 'renderVelocity',
    get: function get() {
      return this.physicsJob.renderState.velocity;
    }

    /**
     * @returns {DefaultModel}
     * @protected
     */

  }, {
    key: '_model',
    get: function get() {
      return this.modelCtrl._model;
    }
    /**
     * @returns {vec3}
     */

  }, {
    key: 'scale',
    get: function get() {
      return this.modelCtrl.scale;
    }
  }, {
    key: 'localTransform',
    get: function get() {
      return this.modelCtrl.localTransform;
    }
    /**
     * Gets the model transform matrix, in world coordinates.
     *
     * @returns {mat4}
     */

  }, {
    key: 'worldTransform',
    get: function get() {
      return this.modelCtrl.worldTransform;
    }
  }]);

  return PhysicsModelController;
}();

exports.PhysicsModelController = PhysicsModelController;

},{"grafx":1,"lsl-physx":10}],18:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SpringFollowCamera = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;var desc = Object.getOwnPropertyDescriptor(object, property);if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;if (getter === undefined) {
      return undefined;
    }return getter.call(receiver);
  }
};

var _grafx = require('grafx');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

// TODO: Ideally, this would use the built-in physics engine; however, we I tried integrating it
// before, I noticed some instability when moving at high speeds. This probably had something to do
// with accessing different versions of the target position (previousState vs currentState vs
// renderState)for force/position calculations

/**
 * This class defines a spring-based follow camera.
 *
 * This camera is positioned at a relative, flexible distance and rotation from the observed target
 * and follows the target's position and orientation with a spring force tying the camera to the
 * desired position.
 *
 * A follow camera rotates in all three dimensions; it does not have a fixed roll.
 */
var SpringFollowCamera = function (_FollowCamera) {
  _inherits(SpringFollowCamera, _FollowCamera);

  /**
   * If oldCamera is given, then the state of the new camera will be initialized to match that of
   * the old camera. This enables a smooth transition when changing cameras.
   *
   * @param {CameraTarget} cameraTarget
   * @param {FollowCameraConfig} followCameraParams
   * @param {CameraConfig} cameraParams
   * @param {Camera} [oldCamera]
   */
  function SpringFollowCamera(cameraTarget, followCameraParams, cameraParams, oldCamera) {
    _classCallCheck(this, SpringFollowCamera);

    // These could have been set in _matchOldCamera.
    var _this = _possibleConstructorReturn(this, (SpringFollowCamera.__proto__ || Object.getPrototypeOf(SpringFollowCamera)).call(this, cameraTarget, followCameraParams, cameraParams, oldCamera));

    _this._velocity = _this._velocity || vec3.create();
    _this._acceleration = _this._acceleration || vec3.create();
    return _this;
  }

  _createClass(SpringFollowCamera, [{
    key: 'reset',
    value: function reset() {
      _get(SpringFollowCamera.prototype.__proto__ || Object.getPrototypeOf(SpringFollowCamera.prototype), 'reset', this).call(this);
      vec3.copy(this._position, this._followCameraParams._intendedTranslationFromTarget);
    }

    /**
     * @param {DOMHighResTimeStamp} currentTime
     * @param {DOMHighResTimeStamp} deltaTime
     */

  }, {
    key: 'update',
    value: function update(currentTime, deltaTime) {
      this._updateAccelerationVelocityAndPosition(deltaTime);
      this._updateOrientation();
    }

    /**
     * @param {DOMHighResTimeStamp} deltaTime
     * @private
     */

  }, {
    key: '_updateAccelerationVelocityAndPosition',
    value: function _updateAccelerationVelocityAndPosition(deltaTime) {
      this._updateAcceleration();
      this._updatePosition(deltaTime);
      this._updateVelocity(deltaTime);
    }

    /**
     * Update the camera's acceleration using Hooke's law and drag.
     *
     * @private
     */

  }, {
    key: '_updateAcceleration',
    value: function _updateAcceleration() {
      this._applySpringAcceleration();
      this._applySpringDamping();
    }

    /**
     * Update the camera's acceleration using Hooke's law.
     *
     * acceleration = displacement * coefficient
     *
     * @private
     */

  }, {
    key: '_applySpringAcceleration',
    value: function _applySpringAcceleration() {
      var displacement = vec3.create();
      vec3.subtract(displacement, this._getIntendedPosition(), this._position);
      vec3.scale(this._acceleration, displacement, this._followCameraParams.springCoefficient);
    }

    /**
     * @private
     */

  }, {
    key: '_applySpringDamping',
    value: function _applySpringDamping() {
      var damping = vec3.create();
      vec3.scale(damping, this._velocity, -this._followCameraParams.dampingCoefficient);
      vec3.add(this._acceleration, this._acceleration, damping);
    }

    /**
     * Update the camera's velocity according to its current acceleration.
     *
     * @param {DOMHighResTimeStamp} deltaTime
     * @private
     */

  }, {
    key: '_updateVelocity',
    value: function _updateVelocity(deltaTime) {
      vec3.scaleAndAdd(this._velocity, this._velocity, this._acceleration, deltaTime);
    }

    /**
     * Update the camera's position according to its current velocity.
     *
     * @param {DOMHighResTimeStamp} deltaTime
     * @private
     */

  }, {
    key: '_updatePosition',
    value: function _updatePosition(deltaTime) {
      vec3.scaleAndAdd(this._position, this._position, this._velocity, deltaTime);
    }

    /**
     * @param {Camera} oldCamera
     * @protected
     */

  }, {
    key: '_matchOldCamera',
    value: function _matchOldCamera(oldCamera) {
      _get(SpringFollowCamera.prototype.__proto__ || Object.getPrototypeOf(SpringFollowCamera.prototype), '_matchOldCamera', this).call(this, oldCamera);
      if (oldCamera instanceof SpringFollowCamera) {
        this._velocity = this._velocity || vec3.create();
        this._acceleration = this._acceleration || vec3.create();
        vec3.copy(this._velocity, oldCamera._velocity);
        vec3.copy(this._acceleration, oldCamera._acceleration);
      }
    }
  }]);

  return SpringFollowCamera;
}(_grafx.FollowCamera);

exports.SpringFollowCamera = SpringFollowCamera;

},{"grafx":1}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _wallCollidable = require('./src/wall-collidable');

Object.keys(_wallCollidable).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _wallCollidable[key];
    }
  });
});

var _wallController = require('./src/wall-controller');

Object.keys(_wallController).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _wallController[key];
    }
  });
});

},{"./src/wall-collidable":20,"./src/wall-controller":21}],20:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Wall = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _lslPhysx = require('lsl-physx');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * This class represents a wall or floor.
 *
 * This is just a convenience class that extends Aabb.
 */
var Wall = function (_Aabb) {
  _inherits(Wall, _Aabb);

  /**
   * - If the x parameter is given, then a wall will be constructed along the y-z plane with its
   * surface at the x coordinate. The y and z parameters are handled similarly.
   * - Only one of the x/y/z parameters should be specified.
   * - If isOpenOnPositiveSide is true, then the wall will be open toward the positive direction.
   *
   * @param {WallParams} wallParams
   */
  function Wall(wallParams) {
    _classCallCheck(this, Wall);

    var minX = void 0;
    var minY = void 0;
    var minZ = void 0;
    var maxX = void 0;
    var maxY = void 0;
    var maxZ = void 0;

    var x = wallParams.x,
        y = wallParams.y,
        z = wallParams.z,
        isOpenOnPositiveSide = wallParams.isOpenOnPositiveSide,
        thickness = wallParams.thickness,
        halfSideLength = wallParams.halfSideLength;

    thickness = thickness || 80000;
    halfSideLength = halfSideLength || 80000;

    if (typeof x === 'number') {
      if (isOpenOnPositiveSide) {
        minX = x - thickness;
        maxX = x;
      } else {
        minX = x;
        maxX = x + thickness;
      }
      minY = -halfSideLength;
      minZ = -halfSideLength;
      maxY = halfSideLength;
      maxZ = halfSideLength;
    } else if (typeof y === 'number') {
      if (isOpenOnPositiveSide) {
        minY = y - thickness;
        maxY = y;
      } else {
        minY = y;
        maxY = y + thickness;
      }
      minX = -halfSideLength;
      minZ = -halfSideLength;
      maxX = halfSideLength;
      maxZ = halfSideLength;
    } else {
      if (isOpenOnPositiveSide) {
        minZ = z - thickness;
        maxZ = z;
      } else {
        minZ = z;
        maxZ = z + thickness;
      }
      minX = -halfSideLength;
      minY = -halfSideLength;
      maxX = halfSideLength;
      maxY = halfSideLength;
    }

    return _possibleConstructorReturn(this, (Wall.__proto__ || Object.getPrototypeOf(Wall)).call(this, minX, minY, minZ, maxX, maxY, maxZ, true));
  }

  /**
   * @returns {vec3}
   * @override
   */

  _createClass(Wall, [{
    key: 'scale',
    get: function get() {
      // Reuse the same object when this is called multiple times.
      this._scale = this._scale || vec3.create();
      vec3.set(this._scale, this.rangeX, this.rangeY, this.rangeZ);
      return this._scale;
    }
  }]);

  return Wall;
}(_lslPhysx.Aabb);

exports.Wall = Wall;

},{"lsl-physx":10}],21:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WallController = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;var desc = Object.getOwnPropertyDescriptor(object, property);if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;if (getter === undefined) {
      return undefined;
    }return getter.call(receiver);
  }
};

var _grafx = require('grafx');

var _lslPhysx = require('lsl-physx');

var _wallCollidable = require('./wall-collidable');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * This class defines a wall-controller.
 */
var WallController = function (_StandardModelControl) {
  _inherits(WallController, _StandardModelControl);

  /**
   * @param {ModelControllerConfig} modelControllerParams
   * @param {WallParams} wallParams
   */
  function WallController(modelControllerParams, wallParams) {
    _classCallCheck(this, WallController);

    var shapeParams = {
      shapeId: 'CUBE',
      isUsingSphericalNormals: wallParams.useSmoothShading,
      textureSpan: wallParams.textureSpan
    };

    var _this = _possibleConstructorReturn(this, (WallController.__proto__ || Object.getPrototypeOf(WallController)).call(this, modelControllerParams, shapeParams));

    _this._collidable = new _wallCollidable.Wall(wallParams);
    _lslPhysx.collidableStore.registerCollidable(_this._collidable);
    return _this;
  }

  _createClass(WallController, [{
    key: 'reset',
    value: function reset() {
      // Re-size and re-position the wall.
      mat4.fromTranslation(this._localTransform, this._collidable.centerOfVolume);
      mat4.scale(this._localTransform, this._localTransform, this._collidable.scale);

      _get(WallController.prototype.__proto__ || Object.getPrototypeOf(WallController.prototype), 'reset', this).call(this);
    }

    /**
     * Called when this is done being used, and is being destroyed from memory.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      _get(WallController.prototype.__proto__ || Object.getPrototypeOf(WallController.prototype), 'destroy', this).call(this);
      _lslPhysx.collidableStore.unregisterCollidable(this._collidable);
    }

    /**
     * @param {DOMHighResTimeStamp} currentTime
     * @param {DOMHighResTimeStamp} deltaTime
     * @protected
     */

  }, {
    key: 'update',
    value: function update(currentTime, deltaTime) {}
  }]);

  return WallController;
}(_grafx.StandardModelController);

exports.WallController = WallController;

/**
 * @typedef {Object} WallParams
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {boolean} isOpenOnPositiveSide
 * @property {number} thickness
 * @property {number} halfSideLength
 * @property {boolean} useSmoothShading
 * @property {TextureSpan} textureSpan
 */

},{"./wall-collidable":20,"grafx":1,"lsl-physx":10}]},{},[11])

//# sourceMappingURL=gamex.js.map
