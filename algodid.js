const homedir = require('os').homedir();
const fs = require('fs');
const { argv } = require('process');
const create = require('./commands/create');
const signBytes = require('./commands/sign');
const verifyBytes = require('./commands/verify');
const vc = require('./commands/vc');
const commandHelp= require('./help/command-help');


// ########## PRELIMINARY SETUP ##########

// setting up working directory if it doesn't exist
const dirpath = homedir+'/.algodid/';
if(!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);


// ########## GLOBAL DATA ##########

const ALLOWED_COMMANDS = ["create"];


// ########## FUN DEF ##########

const parseCommand = function() {
    // checking if a command was issued
    if(process.argv.length < 3) {
        commandHelp();
        process.exit(1);
    }

    // copying over the cli commands
    const argvClean = process.argv.slice(2);
    const command = argvClean[0];
    const args = argvClean.slice(1);

    switch (command) {
        case "create":
            create(command, args);
            break;

        case "sign":
            signBytes(command, args);
            break;

        case "verify":
            verifyBytes(command, args);
            break;

        case "vc":
            vc(command, args);
            break;
        
        case "help":
        case "-h":
            commandHelp();
            break;
        
        default:
            commandHelp("Command \""+command+"\" not recognized");
            process.exit(1);
    }
}



// ########## MAIN EXECUTION ##########
parseCommand();