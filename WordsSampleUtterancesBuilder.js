// Setup the readline, which will collect input from the user.
var readline = require('readline'),
    rl = readline.createInterface(process.stdin, process.stdout);

var fs = require('fs');

// First question to ask: do you want to add to the local or remote DB?
rl.question("What are your words (comma separated)? ", function(daWords) {
    var wordsArray = daWords.split(",");
    var sampleUtterances = "";

    for (i = 0; i < wordsArray.length; i++) {
        sampleUtterances += "CreateIntent publish {";
        for (x = 0; x < 6 && wordsArray.length != 0; x++) {
            sampleUtterances += wordsArray[0]+" ";
            wordsArray.splice(0, 1);
        }
        sampleUtterances += "|Story}\n";
    }

    var dateString = new Date().toLocaleString().replace(/[, :/]+/g, "").trim();
    fs.writeFile("SampleUtterances-"+dateString+".txt", sampleUtterances, function (writeFileError) {
        process.exit(0);
    });
});

