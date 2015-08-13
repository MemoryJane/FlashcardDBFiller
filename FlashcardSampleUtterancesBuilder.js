// Get ready to use AWS and Dynamo DB.
var AWS = require("aws-sdk");
var dynamodb;

// Setup the readline, which will collect input from the user.
var readline = require('readline'),
    rl = readline.createInterface(process.stdin, process.stdout);

var fs = require('fs');

// First question to ask: do you want to add to the local or remote DB?
rl.question("Local or AWS DB? ", function(localOrRemote) {
    // If local, assume an instance of Dynamo Local is running.
    if (localOrRemote.toLowerCase() == "local") {
        dynamodb = new AWS.DynamoDB({endpoint: new AWS.Endpoint('http://localhost:8000')});
        dynamodb.config.update({accessKeyId: "myKeyId", secretAccessKey: "secretKey", region: "us-east-1"});
        console.log("Using LOCAL ");
    } else {
        // Otherwise try to connect to the remote DB using the config file.
        AWS.config.loadFromPath('./config.json');
        dynamodb = new AWS.DynamoDB();
        console.log("Using AWS ");
    }

    // Get the number of questions in the table by doing a COUNT scan.
    var countParams = {
        TableName: 'MemoryJaneFlashCards',
        "AttributesToGet": [
            "Answer"
        ]
    };

    dynamodb.scan(countParams, function (err, data) {
        if (err) {
            console.log("_scan ERROR " + err);
        } else {
            var answerCount = data.Count;
            var stringToOutput = "";

            for (i = 0; i < answerCount; i++) {
                stringToOutput += "MemoryJaneQuestionIntent {"+data.Items[i].Answer.S.trim()+"|Answer}\n";
            }

            var dateString = new Date().toLocaleString().replace(/[, :/]+/g, "").trim();
            fs.writeFile("SampleUtterances-"+dateString+".txt", stringToOutput, function (writeFileError) {
                process.exit(0);
            });
        }
    });
});

