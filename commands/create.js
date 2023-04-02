// command-route for did creation

const sdk = require('algosdk');
const readLine = require('readline-sync');

const generateDid = require('../tools/did-management/generate_did');
const commandHelp = require('../help/command-help');
const encryptWallet = require('../tools/cryptography/wallet-security').encryptWallet;
const storeWalletJson = require('../tools/wallet-storage').storeWalletJson;
const checkWalletDuplicate = require('../tools/wallet-storage').checkWalletDuplicate;



// implements the "create" command
const create = function(command, args) {

    // ########## ACCOUNT GENERATION ##########

    /* 
    // command arguments validation
    if(args.length == 0) {
        commandHelp("You have to provide a name for the new AlgoDID identity", command);
        process.exit(1);
    } else if(args.length > 1) {
        commandHelp("Too many arguments", command);
        process.exit(1);
    }
    */

    // getting did's name
    const name = readLine.question('You have chosen to create a new DID\
        \nInsert a name for the new AlgoID identity\n> ');
    if(checkWalletDuplicate(name)) {
        console.error("\nThe name provided is already associated with another of your AlgoID identities\n");
        process.exit(1);
    }

    // generating a new account and a new encrypted wallet to store it safely
    const account = sdk.generateAccount();
    const wallet =  encryptWallet(account);

    // ########## SAVING WALLET IN LOCAL STORAGE ##########
    storeWalletJson(wallet, name);

    console.log('\nNew identity "'+name+'" successfully created.');
    console.log('Your new AlgoID identifier is: '+account.addr);
    console.log("Use the \"list\" command to show all existing AlgoID identities");

    let did = generateDid(account.addr);

    console.log('\n'+name+" created!\n");
    console.log(did);
}


module.exports = create;