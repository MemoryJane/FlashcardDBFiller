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

    var rightNow = new Date();
    var dateToday = Number(rightNow.getUTCFullYear())
        +((rightNow.getUTCMonth()+1)*10000)
        +((rightNow.getUTCDate()+1)*1000000);

    // Get the latest item from the results DB.
    var latestItemParams = {
        TableName: 'MemoryJaneQueryResults',
        KeyConditionExpression: '#hashkey = :hk_val',
        ExpressionAttributeNames: {
            '#hashkey': 'Date',
        },
        ExpressionAttributeValues: {
            ':hk_val': { "N": dateToday.toString() },
        },
        ScanIndexForward: false,
        Limit: 1,
    };

    dynamodb.query(latestItemParams, function (latestItemError, latestItemData) {
        if (latestItemError) {
            console.log("_query ERROR " + latestItemError);
            process.exit(0);
        } else {
            // Using the sessionID, get all of the logged results for that session.
            var sessionID = latestItemData.Items[0].SessionID.S;

            // Get all the items that have ths same session ID as the latest item.
            var latestSessionItemsParams = {
                TableName: 'MemoryJaneQueryResults',
                KeyConditionExpression: '#hashkey = :hk_val',
                ExpressionAttributeNames: {
                    '#hashkey': 'Date',
                },
                ExpressionAttributeValues: {
                    ':hk_val': { "N": dateToday.toString() },
                    ':sess_val': { "S": sessionID }
                },
                ScanIndexForward: false,
                FilterExpression: 'SessionID = :sess_val',
            };
            dynamodb.query(latestSessionItemsParams, function (latestSessionItemsError, latestSessionItemsData) {
                if (latestSessionItemsError) {
                    console.log("_query ERROR " + latestSessionItemsError);
                    process.exit(0);
                } else {
                    console.log("EXPECTED\tUSER REPLY");
                    for(i = 0; i < latestSessionItemsData.Count; i++) {
                        console.log(latestSessionItemsData.Items[i].WordGiven.S+"\t"+latestSessionItemsData.Items[i].UserResponse.S);
                    }

                    process.exit(0);
                }
            });
        }
    });
});