var iter = require("./iteratee");

var stdin = process.openStdin();
var stream = new iter.StreamIterator(stdin);

function app () {
  console.log("Please enter a number: ");
  stream.run(iter.readTillChar("\n"), function getN (input){ 
    var total = parseInt(input);
    if (total) {
      console.log("You gave me: " + input + " I will read that many lines.");
      aux([],0);
    } else {
      console.log("You must enter a number!");
      stream.run(iter.readTillChar("\n"), getN);
    }
    function aux(queue, n) {
      stream.run(iter.readTillChar("\n"), function(input, stream) {
        if (n < total-1) {
          aux(queue.concat([input]), n+1);
        } else {
          queue = queue.concat([input]);
          console.log("You Entered: ");
          for (var i = 0; i < queue.length; i++){
            console.log((i + 1) + ". " + queue[i]);
          }
          console.log("Done");
          console.log("Now enter your first, middle and last name (press enter after each).");
          stream.run(iter.readTillChar("\n"), function(first) {
            stream.run(iter.readTillChar("\n"), function(middle) {
              stream.run(iter.readTillChar("\n"), function(last) {
                console.log("First: " + first + "\nMidding: " + middle + "\nLast: " + last);
                console.log("Starting Over");
                app();
              });
            });
          });
        }
      });
    }  
  });
}
app();
