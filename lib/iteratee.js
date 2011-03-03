Function.prototype.partial = function (){
  var that = this;
  var thoseArgs = Array.prototype.slice.call(arguments, 0);
  return function(){
    var comArgs = thoseArgs.concat(Array.prototype.slice.call(arguments, 0));
    return that.apply(this,comArgs);
  };
};

function Input (isMore, data) {
  this.isEOF = function () {
    return !isMore;
  }
  this.isMore = function () {
    return isMore;
  }
  this.data = function () {
    return data;
  }

  this.toString = function() {
    return "<Input>";
  };
};

Input.EOF = function () { return new Input (false) };
Input.More = function (data) { return new Input(true, data) };

exports.Input = Input

  function Iteratee (isEnough, cont, input, leftover) {
    this.isEnough = function () {
      return isEnough;
    };
    this.isPartial = function () {
      return !isEnough;
    }
    this.continuation = function () {
      return cont;
    };
    this.input = function () {
      return input;
    };
    this.leftover = function () {
      return leftover;
    };
    this.run = function (chunk) {
      if (cont instanceof Function) {
        return cont(chunk);
      } else {
        console.log(cont + " is not a function.");
      }
    };
    this.toString = function() {
      return "<Iteratee>";
    };

  };
Iteratee.Enough = function (input, leftover) {
  return new Iteratee(true, undefined, input, leftover);
};
Iteratee.Partial = function (fn) {
  return new Iteratee(false, fn);
};

exports.Iteratee = Iteratee;

function StreamEnumerator (streamlike) {
  var leftover;
  var self = this;

  var endListeners = streamlike.listeners("end");

  function callEndListeners () {
    for (var i = 0; i < endListeners.length; i++) {
      endListeners[i].call(streamlike);
    }
  }

  streamlike.removeAllListeners("data");
  streamlike.removeAllListeners("end");

  this.run = function run (application, next) {
    if (leftover) application = application.run(Input.More(leftover));
    if (application.isPartial()) {
      streamlike.on("end", function () {
        callEndListeners();
        streamlike.removeAllListeners("data");
        streamlike.removeAllListeners("end");
        var call = application.run(Input.EOF());
        if (call.isEnough()) {
          leftover = call.leftover();
          next(call.input(), self);
        } else {
          self.run(call, next);
        }
      });
      streamlike.on("data", function (data) {
        var call = application.run(Input.More(data));
        streamlike.removeAllListeners("data");
        streamlike.removeAllListeners("end");
        if (call.isEnough()) {
          leftover = call.leftover();
          next(call.input(), self);
        } else {
          self.run(call, next);
        }
      });
    } else {
      leftover = application.leftover();
      next(application.input(), self);
    }
  }
};
exports.StreamEnumerator = StreamEnumerator;

////////////////////////////////////////////////////////////////////////

var Buffer = require("buffer").Buffer;

function readTillChar (chr) {
  function aux(queue, chunk) {
    var chstr = chunk.data().toString();
    if (chstr.indexOf(chr) != -1) {
      var a = chstr.slice(0, chstr.indexOf(chr));
      var b = chstr.slice(chstr.indexOf(chr)+1);
      return Iteratee.Enough(queue + a, new Buffer(b));
    } else {
      return Iteratee.Partial(aux.partial(queue + chstr));
    }
  }
  return Iteratee.Partial(aux.partial(""));
}

exports.readTillChar = readTillChar;


