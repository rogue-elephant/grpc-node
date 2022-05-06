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

function longGreet(call, callback) {
  call.on("data", (request) => {
    var fullName =
      request.getGreeting().getFirstName() +
      " " +
      request.getGreeting().getLastName();

    console.log("Hello", fullName);
  });

  call.on("error", (error) => {
    console.error(error);
  });

  call.on("end", () => {
    var response = new greets.LongGreetResponse();
    response.setResult("Long Greet Client Streaming ended");

    callback(null, response);
  });
}

function computeAverage(call, callback) {
  var valuesArray = [];
  call.on("data", (request) => {
    var value = request.getValue();
    valuesArray.push(value);

    console.log("Incoming value:", value, ". Values array:", valuesArray);
  });

  call.on("error", (error) => {
    console.error(error);
  });

  call.on("end", () => {
    var numberOfValues = valuesArray.length;
    var result =
      valuesArray.reduce((acc, cur) => acc + cur, 0) / numberOfValues;
    console.log("Compute average result:", result);
    var response = new calculator.ComputeAverageResponse();
    response.setAverage(result);
    response.setNumberOfValues(numberOfValues);
    response.setValuesList(valuesArray);

    callback(null, response);
  });
}
async function sleep(interval = 1000) {
  return new Promise((resolve) => setTimeout(() => resolve(), interval));
}
async function greetEveryone(call, callback) {
  call.on("data", (response) => {
    var fullName =
      response.getGreeting().getFirstName() +
      " " +
      response.getGreeting().getLastName();

    console.log("Hello", fullName);
  });

  call.on("error", (error) => {
    console.error(error);
  });

  call.on("end", () => {
    console.log("End of greet everyone stream");
  });

  for (let index = 0; index < 10; index++) {
    var response = new greets.GreetEveryoneResponse();
    response.setResult("Johnny No." + index);

    call.write(response);
    await sleep();
  }

  call.end();
}

async function findMaximum(call, callback) {
  var values = [];
  var currentMaximum = 0;
  call.on("data", (response) => {
    var value = response.getValue();
    values.push(value);

    currentMaximum = value > currentMaximum ? value : currentMaximum;

    console.log("Value received", value);

    var response = new calculator.FindMaximumResponse();
    response.setMaximum(currentMaximum);
    response.setNumberOfValues(values.length);
    response.setValuesList(values);

    call.write(response);
  });

  call.on("error", (error) => {
    console.error(error);
  });

  call.on("end", () => {
    var response = new calculator.FindMaximumResponse();
    response.setMaximum(currentMaximum);
    response.setNumberOfValues(values.length);
    response.setValuesList(values);

    call.write(response);

    console.log("End of findMaximum stream");
    call.end();
  });
}

function squareRoot(call, callback) {
  var number = call.request.getNumber();

  if (number >= 0) {
    var numberRoot = Math.sqrt(number);
    var response = new calculator.SquareRootResponse();
    response.setNumberRoot(numberRoot);

    callback(null, response);
  } else {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "Number " + number + " is less than zero.",
    });
  }
}

function main() {
  var server = new grpc.Server();

  server.addService(greetService.GreetServiceService, {
    greet,
    greetManyTimes,
    longGreet,
    greetEveryone,
  });
  server.addService(calculatorService.CalculatorServiceService, {
    sum,
    nthFibonacci,
    computeAverage,
    findMaximum,
    squareRoot,
  });

  server.bind(globals.serverUrl, grpc.ServerCredentials.createInsecure());

  server.start();

  console.log("Server running on port " + globals.serverUrl);
}
main();
