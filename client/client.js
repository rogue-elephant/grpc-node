var grpc = require("grpc");

var globals = require("../server/globals");
var greets = require("../server/protos/greet_pb");
var greetService = require("../server/protos/greet_grpc_pb");

var calculator = require("../server/protos/calculator_pb");
var calculatorService = require("../server/protos/calculator_grpc_pb");

function callGreetService() {
  var client = new greetService.GreetServiceClient(
    globals.serverUrl,
    grpc.credentials.createInsecure()
  );

  var request = new greets.GreetRequest();
  var greeting = new greets.Greeting();
  greeting.setFirstName("Tom");
  greeting.setLastName("Randell");

  request.setGreeting(greeting);

  client.greet(request, (error, response) => {
    if (error) console.error(error);
    else console.log("Greeting response: ", response.getResult());
  });
}

function callGreetManyTimesService() {
  var client = new greetService.GreetServiceClient(
    globals.serverUrl,
    grpc.credentials.createInsecure()
  );

  var request = new greets.GreetManyTimesRequest();
  var greeting = new greets.Greeting();
  greeting.setFirstName("Tom");
  greeting.setLastName("Randell");

  request.setGreeting(greeting);

  var call = client.greetManyTimes(request, () => {});

  call.on("data", (response) => {
    console.log("Greeting streaming response: ", response.getResult());
  });

  call.on("status", (status) => {
    console.log("Greeting streaming status: ", status.details);
  });

  call.on("error", (error) => {
    console.log("Greeting streaming error: ", error.details);
  });

  call.on("end", () => {
    console.log("Greeting streaming closed");
  });
}

function callCalculatorService() {
  var client = new calculatorService.CalculatorServiceClient(
    globals.serverUrl,
    grpc.credentials.createInsecure()
  );

  var request = new calculator.SumRequest();

  request.setAugend(3);
  request.setAddend(10);

  client.sum(request, (error, response) => {
    if (error) console.error(error);
    else console.log("Sum response: ", response.getResult());
  });
}

function callNthFibonacciService() {
  var client = new calculatorService.CalculatorServiceClient(
    globals.serverUrl,
    grpc.credentials.createInsecure()
  );

  var request = new calculator.NthFibonacciRequest();
  var n = 12;
  request.setN(n);

  console.log("Sending n value: ", n);

  var call = client.nthFibonacci(request, () => {});

  call.on("data", (response) => {
    console.log(
      ("nthFibonacci streaming response: F" + response.getIndex()).replace(
        /\d/g,
        (m) => "₀₁₂₃₄₅₆₇₈₉"[m]
      ),
      "=",
      response.getResult()
    );
  });

  call.on("status", (status) => {
    console.log("nthFibonacci streaming status: ", status.details);
  });

  call.on("error", (error) => {
    console.log("nthFibonacci streaming error: ", error.details);
  });

  call.on("end", () => {
    console.log("nthFibonacci streaming closed");
  });
}

function main() {
  //   callGreetService();
  //   callCalculatorService();
  //   callGreetManyTimesService();
  callNthFibonacciService();
}
main();
