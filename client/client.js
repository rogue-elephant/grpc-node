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

function callLongGreeting() {
  var client = new greetService.GreetServiceClient(
    globals.serverUrl,
    grpc.credentials.createInsecure()
  );

  var request = new greets.LongGreetRequest();

  var call = client.longGreet(request, (error, response) => {
    if (!error) {
      console.log("Server Response:", response.getResult());
    } else console.error(error);
  });

  let count = 0,
    timer = setInterval(() => {
      var request = new greets.LongGreetRequest();
      var greeting = new greets.Greeting();
      greeting.setFirstName("Johnny");
      greeting.setLastName("No. " + count);
      request.setGreeting(greeting);

      console.log(
        "Sending message",
        ++count,
        greeting.getFirstName(),
        greeting.getLastName()
      );

      call.write(request);

      if (count > 5) {
        clearInterval(timer);
        call.end();
      }
    }, 1000);
}

function callComputeAverage() {
  var client = new calculatorService.CalculatorServiceClient(
    globals.serverUrl,
    grpc.credentials.createInsecure()
  );

  var request = new calculator.ComputeAverageRequest();

  var call = client.computeAverage(request, (error, response) => {
    if (!error) {
      console.log(
        "Server Response, avg:",
        response.getAverage(),
        ". Total no. values:",
        response.getNumberOfValues(),
        ". Values:",
        response.getValuesList()
      );
    } else console.error(error);
  });

  let count = 0,
    timer = setInterval(() => {
      var request = new calculator.ComputeAverageRequest();
      request.setValue(count * 3);

      console.log("Sending message", ++count, request.getValue());

      call.write(request);

      if (count > 5) {
        clearInterval(timer);
        call.end();
      }
    }, 1000);
}

async function sleep(interval = 1000) {
  return new Promise((resolve) => setTimeout(() => resolve(), interval));
}

async function callGreetEveryone() {
  var client = new greetService.GreetServiceClient(
    globals.serverUrl,
    grpc.credentials.createInsecure()
  );

  var call = client.greetEveryone(request, (error, response) => {});

  call.on("data", (response) => {
    console.log("Response:", response.getResult());
  });

  call.on("error", (error) => console.error);

  call.on("end", () => console.log("end of stream"));

  for (let index = 0; index < 10; index++) {
    var greeting = new greets.Greeting();
    greeting.setFirstName("Johan");
    greeting.setLastName("No." + index);

    var request = new greets.GreetEveryoneRequest();
    request.setGreeting(greeting);

    call.write(request);

    await sleep();
  }

  call.end();
}

async function callFindMaximum() {
  var client = new calculatorService.CalculatorServiceClient(
    globals.serverUrl,
    grpc.credentials.createInsecure()
  );

  var call = client.findMaximum(request, (error, response) => {});

  call.on("data", (response) => {
    console.log(
      "Response => maximum:",
      response.getMaximum(),
      ". Number of values:",
      response.getNumberOfValues(),
      ". Values:",
      response.getValuesList()
    );
  });

  call.on("error", (error) => console.error);

  call.on("end", () => console.log("end of stream"));

  for (let index = 0; index < 10; index++) {
    var request = new calculator.FindMaximumRequest();
    request.setValue(index * Math.floor(Math.random() * 5));

    console.log("Sending value:", request.getValue());
    call.write(request);

    await sleep();
  }

  call.end();
}

function callSquareRoot() {
  var client = new calculatorService.CalculatorServiceClient(
    globals.serverUrl,
    grpc.credentials.createInsecure()
  );

  var number = -1;
  var squareRootRequest = new calculator.SquareRootRequest();
  squareRootRequest.setNumber(number);

  client.squareRoot(squareRootRequest, (error, response) => {
    if (!error) {
      console.log(
        "Response => square root for " +
          number +
          " is " +
          response.getNumberRoot()
      );
    } else {
      console.error(error.message);
    }
  });
}

function main() {
  //   callGreetService();
  //   callCalculatorService();
  //   callGreetManyTimesService();
  // callNthFibonacciService();
  // callLongGreeting();
  // callComputeAverage();
  // callGreetEveryone();
  // callFindMaximum();
  callSquareRoot();
}
main();
