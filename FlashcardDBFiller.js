// Get ready to use AWS and Dynamo DB.
var AWS = require("aws-sdk");
var dynamodb;

// Setup the readline, which will collect input from the user.
var readline = require('readline'),
    rl = readline.createInterface(process.stdin, process.stdout);


// This is a recursive function that pops one question / answer pair off the arrays, adds them
// to the DB, then calls the function again.
var PutArrayOfAnswers = function (qArray, aArray, index, prompt) {
    // Setup the JSON of the quesion to add.
    var QuestionToAdd = { TableName: 'MemoryJaneFlashCards',
        Item: {
            Index: { "N": index.toString() },
            Question: { "S": qArray[0].trim() },
            Answer: { "S": aArray[0].trim() }
        }
    };

    // If the prompt is empty, then we don't include it at all. Otherwise, we add it here.
    if (prompt != "") {
        QuestionToAdd.Item.Prompt = {"S": prompt};
    }

    // Put the question into the DB.
    dynamodb.putItem(QuestionToAdd, function (err, data) {
        if (err) { console.log(err);
        } else {
            console.log("Added "+qArray[0].trim()+". Remaining count: "+String(qArray.length-1));

            // If there are still questions left, call this again, otherwise, we're done.
            if (qArray.length > 1) {
                // Splice pops one item off each array.
                qArray.splice(0,1);
                aArray.splice(0,1);

                PutArrayOfAnswers(qArray, aArray, index+1, prompt);
            } else {
                process.exit(0);
            }
        }
    });
};

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

    // Get the number of questions already in the table by doing a COUNT scan.
    var countParams = { TableName: "MemoryJaneFlashCards", Select: 'COUNT' };
    dynamodb.scan(countParams, function (err, data) {
        if (err) console.log("Data _describingTable_  ERROR " + err); // an error occurred
        else {
            // Second question: what's the prompt code?
            rl.question("What's your prompt code? (Enter for none.) ", function(prompt) {
                    if (prompt == "Spelling") {
                        console.log("You said Spelling, so we won't ask for any answers.");
                    }

                    // Third question, what your questions?
                    rl.question("What's your question values? (Comma separated.) ", function(questions) {
                            var questionArray = questions.split(",");

                            // If this is spelling, we don't need the answers, we can generate them.
                            if (prompt == "Spelling") {
                                var answerArray = questionArray.slice(0);
                                for (i = 0; i < answerArray.length; i++) {
                                    if (questionArray[i].indexOf("'") >= 0) {
                                        questionArray.splice(i,1);
                                        answerArray.splice(i,1);
                                    } else {
                                        answerArray[i] = answerArray[i].split("").join(". ") + ".";
                                    }
                                }
                                PutArrayOfAnswers(questionArray, answerArray, data.Count+1, prompt)
                            } else {
                                // Otherwise, fourth and final question, what are the answers?
                                rl.question("Now tell me " + questionArray.length + " answers to match. (Also comma separated.) ", function(answers) {
                                        var answerArray = answers.split(",");

                                        // If the two arrays are not the szme size, then there's been a mistake.
                                        if (questionArray.length != answerArray.length) {
                                            console.log("ERROR - You gave me "+questionArray.length
                                                +" questions and "+answerArray.length+" answers. Please try again.");
                                            process.exit(0);
                                        }

                                        PutArrayOfAnswers(questionArray, answerArray, data.Count+1, prompt)
                                    }
                                );
                            }
                        }
                    );
                }
            );
        }
    });

});
