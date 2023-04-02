// Function handling help prints

const fs = require('fs');


// ########## GLOBAL DATA ##########

const HELP_PATH = './help/';
const HELP_EXT = '.txt';


// ########## FUNCTIONS ##########

// helper function that prints a guide on how to use the issued command
const commandHelp = function(msg, command='general') {
    // reads the correct helper file and returns
    // a textual guide on how to use the given command

    if(msg) console.error("\nError: "+msg);     // printig error message

    let filePath = HELP_PATH+command+HELP_EXT;
    let res = "";


    switch (command) {
        case "create":
            res = fs.readFileSync(filePath, {encoding:'utf8', flag:'r'});
            console.error(res);
            break;
    
        default:
            res = fs.readFileSync(filePath, {encoding:'utf8', flag:'r'});
            console.error(res);
            break;
    }
}

module.exports = commandHelp;