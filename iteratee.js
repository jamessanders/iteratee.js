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


function Application (isEnough, cont, input, leftover) {
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
    return "<Application>";
  };

};
Application.Enough = function (input, leftover) {
  return new Application(true, undefined, input, leftover);
};
Application.Partial = function (fn) {
  return new Application(false, fn);
};


function StreamIterator (streamlike) {
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

function readTillChar (chr) {
  function aux(queue, chunk) {
    if (chunk.data().indexOf(chr) != -1) {
      var a = chunk.data().slice(0, chunk.data().indexOf(chr));
      var b = chunk.data().slice(chunk.data().indexOf(chr)+1);
      return Application.Enough(queue + a, b);
    } else {
      return Application.Partial(aux.curry(queue + chunk.data()));
    }
  }
  return Application.Partial(aux.curry(""));
}

var stdin = process.openStdin();
var stream = new StreamIterator(stdin);

console.log("Please enter a number: ");
stream.run(readTillChar("\n"), function getN (input, stream){ 
  var total = parseInt(input);
  if (total) {
    console.log("You gave me: " + input + " I will read that many lines.");
    aux(0);
  } else {
    console.log("You must enter a number!");
    stream.run(readTillChar("\n"), getN);
  }
  function aux(n) {
    stream.run(readTillChar("\n"), function(input, stream) {
      console.log((n + 1) + ". " + input);
      if (n < total-1) {
        aux(n+1);
      } else {
        console.log("Done");
        console.log("Now enter your first, middle and last name (press enter after each).");
        stream.run(readTillChar("\n"), function(first) {
          stream.run(readTillChar("\n"), function(middle) {
            stream.run(readTillChar("\n"), function(last) {
              console.log("First: " + first + "\nMidding: " + middle + "\nLast: " + last);
              stdin.destroy();
            });
          });
        });
      }
    });
  }  
});
