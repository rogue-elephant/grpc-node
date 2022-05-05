var grpc = require("grpc");
var globals = require("./globals");
var greets = require("./protos/greet_pb");
var greetService = require("./protos/greet_grpc_pb");

var calculator = require("./protos/calculator_pb");
var calculatorService = require("./protos/calculator_grpc_pb");

function greet(call, callback) {
  var greeting = new greets.GreetResponse();

  greeting.setResult(
    "Hello " +
      call.request.getGreeting().getFirstName() +
      " " +
      call.request.getGreeting().getLastName()
  );

  callback(null, greeting);
}

function greetManyTimes(call, callback) {
  var firstName = call.request.getGreeting().getFirstName();

  let count = 0,
    timer = setInterval(function () {
      var greetManyTimesResponse = new greets.GreetManyTimesResponse();
      greetManyTimesResponse.setResult(firstName + " " + count);

      // setup streaming
      call.write(greetManyTimesResponse);

      if (++count > 9) {
        clearInterval(timer);
        call.end();
      }
    }, 1000);
}

function sum(call, callback) {
  var response = new calculator.SumResponse();

  response.setResult(call.request.getAugend() + call.request.getAddend());

  callback(null, response);
}

function nthFibonacci(call, callback) {
  var n = call.request.getN();

  function fibonacciRecursive(n) {
    return n < 2 ? 1 : fibonacciRecursive(n - 2) + fibonacciRecursive(n - 1);
  }

  console.log("Received fibonacci n: ", n);

  let index = 0,
    timer = setInterval(function () {
      var indexFibonacciValue = fibonacciRecursive(index);
      var response = new calculator.NthFibonacciResponse();
      response.setIndex(index + 1);
      response.setResult(indexFibonacciValue);
      call.write(response);

      if (++index === n) {
        clearInterval(timer);
        call.end();
      }
    }, 1000);
}

function main() {
  var server = new grpc.Server();

  server.addService(greetService.GreetServiceService, {
    greet,
    greetManyTimes,
  });
  server.addService(calculatorService.CalculatorServiceService, {
    sum,
    nthFibonacci,
  });

  server.bind(globals.serverUrl, grpc.ServerCredentials.createInsecure());

  server.start();

  console.log("Server running on port " + globals.serverUrl);
}
main();
