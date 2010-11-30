Function.prototype.curry = function (){
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


function StreamEnumerator (streamlike) {
  var leftover;
  var self = this;
  this.run = function run (application, next) {
    if (leftover) application = application.run(Input.More(leftover));
    if (application.isPartial()) {
      streamlike.on("end", function () {
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
        var call = application.run(Input.More(data.toString("utf8")));
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


function readTillChar (chr) {
  function aux(queue, chunk) {
    if (chunk.data().indexOf(chr) != -1) {
      var a = chunk.data().slice(0, chunk.data().indexOf(chr));
      var b = chunk.data().slice(chunk.data().indexOf(chr)+1);
      return Iteratee.Enough(queue + a, b);
    } else {
      return Iteratee.Partial(aux.curry(queue + chunk.data()));
    }
  }
  return Iteratee.Partial(aux.curry(""));
}
exports.readTillChar = readTillChar;
