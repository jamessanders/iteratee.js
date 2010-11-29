# Example

    // will read till it has consumed the character given.
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

    // Uses the above stream reader....
                                                                    
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
                                                                                                 
