const algosdk = require('algosdk');
const fs = require('fs');
const baseServer = "https://testnet-algorand.api.purestake.io/ps2";
const port = "";
const windowsPort = "8112";

const token = {
    'X-API-key': 'hYXvwFevok3UESqCgUPLW5jgZvZnpimD9Zhd3CqM',
}


// #################### HELPER FUNCTIONS ####################

// read local state of application from user account
async function readLocalState(client, account, appId){
    let accountInfoResponse = await client.accountApplicationInformation(account.addr, appId).do();
    if(accountInfoResponse && accountInfoResponse["app-local-state"]) {
        for(let i=0; i < accountInfoResponse["app-local-state"]["key-value"].length; i++) {
            console.log(Buffer.from(accountInfoResponse["app-local-state"]["key-value"][i].key, 'base64').toString('utf8'));
            console.log(Buffer.from(accountInfoResponse["app-local-state"]["key-value"][i].value.bytes, 'base64').toString('utf8'));
        }
    }
}

// read global state of application
async function readGlobalState(client, appId){
    let applicationInfoResponse = await client.getApplicationByID(appId).do();
    // console.log(applicationInfoResponse.params["global-state"]);
    let globalState = []
    if(applicationInfoResponse.params && applicationInfoResponse.params["global-state"]) {
        globalState = applicationInfoResponse.params["global-state"];
    }
    for (let i = 0; i < globalState.length; i++) {
        console.log(Buffer.from(applicationInfoResponse.params["global-state"][i].key, 'base64').toString('utf-8'));
        console.log(Buffer.from(applicationInfoResponse.params["global-state"][i].value.bytes, 'base64url').toString('utf8'));
    }
}

// helper function to compile program source  
async function compileProgram(client, programSource) {
    let compileResponse = await client.compile(programSource).do();
    let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
    return compiledBytes;
}


// #################### FUN DEF ####################

let creatorAccount = {};
creatorAccount.addr = "VD7KFX67JK7IXVLYFWDHV2WJAI25QA6COZQPOMCHRTTLP6IULUFBNED5BQ";
creatorAccount.sk = new Uint8Array([
    118, 241, 235, 235, 201, 226, 119, 192,  15,  12, 159,
    160, 245,  11, 225, 159, 193, 226,  86, 252, 184, 216,
    161, 101, 225, 161,   0, 201, 159, 228,   0,  15, 168,
    254, 162, 223, 223,  74, 190, 139, 213, 120,  45, 134,
    122, 234, 201,   2,  53, 216,   3, 194, 118,  96, 247,
     48,  71, 140, 230, 183, 249,  20,  93,  10
]);

let appId = 144913849;

const algodClient = new algosdk.Algodv2(token, baseServer, port);

// get sender address
let sender = creatorAccount.addr;


let createContract = (async function createContract() {
    // params number
    let localInts = 0;
    let localBytes = 16;
    let globalInts = 0;
    let globalBytes = 2;
    // approval and clear programs text
    let approvalProgramSource = new Uint8Array(Buffer.from(fs.readFileSync('./approval.teal', {encoding: 'binary'})));
    let clearProgramSource = `#pragma version 5
    int 1
    `;

    // get node suggested parameters
    let params = await algodClient.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;
    console.log(params);

    // declare onComplete as NoOp
    let onComplete = algosdk.OnApplicationComplete.NoOpOC;

    // compile program
    let approvalProgramRaw = await algodClient.compile(approvalProgramSource).do();
    let clearProgramRaw = await algodClient.compile(clearProgramSource).do();
    let approvalProgram = new Uint8Array(Buffer.from(approvalProgramRaw.result, "base64"));
    let clearProgram = new Uint8Array(Buffer.from(clearProgramRaw.result, "base64"));
    console.log(approvalProgram);
    console.log(clearProgram);

    // creating tx
    // create unsigned transaction
    let txn = algosdk.makeApplicationCreateTxn(sender, params, onComplete, 
        approvalProgram, clearProgram, 
        localInts, localBytes, globalInts, globalBytes,);
    let txId = txn.txID().toString();

    // Sign the transaction
    let signedTxn = txn.signTxn(creatorAccount.sk);
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await algodClient.sendRawTransaction(signedTxn).do();

    // Wait for transaction to be confirmed
    confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    //Get the completed Transaction
    console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

    // display results
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    let appId = transactionResponse['application-index'];
    console.log("Created new app-id: ",appId);
    
});

let optin = (async function optin() {
    // get node suggested parameters
    let params = await algodClient.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;
    // prepare the optIn transaction
    let txn = algosdk.makeApplicationOptInTxn(sender, params, appId);
    // get tx ID
    let txId = txn.txID().toString();
    // Sign the transaction
    let signedTxn = txn.signTxn(creatorAccount.sk);
    // submit the tx
    await algodClient.sendRawTransaction(signedTxn).do();
    // Wait for transaction to be confirmed
    confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    //Get the completed Transaction
    console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
    // display results
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    console.log("Opted-in to app-id:",transactionResponse['txn']['txn']['apid']);

});

let readState = (async function readState() {

    // await readGlobalState(algodClient, appId);
    await readLocalState(algodClient, creatorAccount, appId);

});

let addKey = (async function addKey() {
    // get node suggested parameters
    let params = await algodClient.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;
    // preparing app args
    let appArgs = [];
    appArgs.push(new Uint8Array(Buffer.from("add_key")));
    appArgs.push(new Uint8Array(Buffer.from("mykey1")));
    appArgs.push(new Uint8Array(Buffer.from("ed")));
    appArgs.push(new Uint8Array(Buffer.from("2020")));
    appArgs.push(new Uint8Array(Buffer.from("mypublickey")));
    appArgs.push(new Uint8Array(Buffer.from("3")));
    // preparing accounts args
    let appAcc = [];
    appAcc.push(sender);
    // creating tx
    let txn = algosdk.makeApplicationNoOpTxn(sender, params, appId, appArgs, appAcc);
    // get tx ID
    let txId = txn.txID().toString();
    // Sign the transaction
    let signedTxn = txn.signTxn(creatorAccount.sk);
    // submit the tx
    await algodClient.sendRawTransaction(signedTxn).do();
    // Wait for transaction to be confirmed
    confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // display results
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    console.log("Called app-id:",transactionResponse['txn']['txn']['apid'])
    if (transactionResponse['global-state-delta'] !== undefined ) {
        console.log("Global State updated:",transactionResponse['global-state-delta']);
    }
    if (transactionResponse['local-state-delta'] !== undefined ) {
        console.log("Local State updated:",transactionResponse['local-state-delta']);
    }

});

let addService = (async function addService() {
    // get node suggested parameters
    let params = await algodClient.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;
    // preparing app args
    let appArgs = [];
    appArgs.push(new Uint8Array(Buffer.from("add_service")));
    appArgs.push(new Uint8Array(Buffer.from("service1")));
    appArgs.push(new Uint8Array(Buffer.from("net")));
    appArgs.push(new Uint8Array(Buffer.from("https://my-service.org")));
    // preparing accounts args
    let appAcc = [];
    appAcc.push(sender);
    // creating tx
    let txn = algosdk.makeApplicationNoOpTxn(sender, params, appId, appArgs, appAcc);
    // get tx ID
    let txId = txn.txID().toString();
    // Sign the transaction
    let signedTxn = txn.signTxn(creatorAccount.sk);
    // submit the tx
    await algodClient.sendRawTransaction(signedTxn).do();
    // Wait for transaction to be confirmed
    confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // display results
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    console.log("Called app-id:",transactionResponse['txn']['txn']['apid'])
    if (transactionResponse['global-state-delta'] !== undefined ) {
        console.log("Global State updated:",transactionResponse['global-state-delta']);
    }
    if (transactionResponse['local-state-delta'] !== undefined ) {
        console.log("Local State updated:",transactionResponse['local-state-delta']);
    }

});

let addAlias = (async function addAlias() {
    // get node suggested parameters
    let params = await algodClient.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;
    // preparing app args
    let appArgs = [];
    appArgs.push(new Uint8Array(Buffer.from("add_alias")));
    appArgs.push(new Uint8Array(Buffer.from("alias1")));
    appArgs.push(new Uint8Array(Buffer.from("did")));
    appArgs.push(new Uint8Array(Buffer.from("did:algoid:"+sender)));
    // preparing accounts args
    let appAcc = [];
    appAcc.push(sender);
    // creating tx
    let txn = algosdk.makeApplicationNoOpTxn(sender, params, appId, appArgs, appAcc);
    // get tx ID
    let txId = txn.txID().toString();
    // Sign the transaction
    let signedTxn = txn.signTxn(creatorAccount.sk);
    // submit the tx
    await algodClient.sendRawTransaction(signedTxn).do();
    // Wait for transaction to be confirmed
    confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // display results
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    console.log("Called app-id:",transactionResponse['txn']['txn']['apid'])
    if (transactionResponse['global-state-delta'] !== undefined ) {
        console.log("Global State updated:",transactionResponse['global-state-delta']);
    }
    if (transactionResponse['local-state-delta'] !== undefined ) {
        console.log("Local State updated:",transactionResponse['local-state-delta']);
    }

});

let addDelegate = (async function addDelegate() {
    // get node suggested parameters
    let params = await algodClient.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;
    // preparing app args
    let appArgs = [];
    appArgs.push(new Uint8Array(Buffer.from("add_delegate")));
    appArgs.push(new Uint8Array(Buffer.from("delegate")));
    appArgs.push(new Uint8Array(Buffer.from("ed")));
    appArgs.push(new Uint8Array(Buffer.from("2020")));
    appArgs.push(new Uint8Array(Buffer.from("mypublickey")));
    appArgs.push(new Uint8Array(Buffer.from("3")));
    // preparing accounts args
    let appAcc = [];
    appAcc.push(sender);
    // creating tx
    let txn = algosdk.makeApplicationNoOpTxn(sender, params, appId, appArgs, appAcc);
    // get tx ID
    let txId = txn.txID().toString();
    // Sign the transaction
    let signedTxn = txn.signTxn(creatorAccount.sk);
    // submit the tx
    await algodClient.sendRawTransaction(signedTxn).do();
    // Wait for transaction to be confirmed
    confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // display results
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    console.log("Called app-id:",transactionResponse['txn']['txn']['apid'])
    if (transactionResponse['global-state-delta'] !== undefined ) {
        console.log("Global State updated:",transactionResponse['global-state-delta']);
    }
    if (transactionResponse['local-state-delta'] !== undefined ) {
        console.log("Local State updated:",transactionResponse['local-state-delta']);
    }

});

let removeAttr = (async function removeAttr(attr) {
    // get node suggested parameters
    let params = await algodClient.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;
    // preparing app args
    let appArgs = [];
    appArgs.push(new Uint8Array(Buffer.from("remove_attr")));
    appArgs.push(new Uint8Array(Buffer.from(attr)));
    // preparing accounts args
    let appAcc = [];
    appAcc.push(sender);
    // creating tx
    let txn = algosdk.makeApplicationNoOpTxn(sender, params, appId, appArgs, appAcc);
    // get tx ID
    let txId = txn.txID().toString();
    // Sign the transaction
    let signedTxn = txn.signTxn(creatorAccount.sk);
    // submit the tx
    await algodClient.sendRawTransaction(signedTxn).do();
    // Wait for transaction to be confirmed
    confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // display results
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    console.log("Called app-id:",transactionResponse['txn']['txn']['apid'])
    if (transactionResponse['global-state-delta'] !== undefined ) {
        console.log("Global State updated:",transactionResponse['global-state-delta']);
    }
    if (transactionResponse['local-state-delta'] !== undefined ) {
        console.log("Local State updated:",transactionResponse['local-state-delta']);
    }

});


// MAIN

(async function main() {

    let checkpoint = Date.now();
    // await createContract();
    // await optin();
    // await addKey();
    // await addService();
    // await addAlias();
    // await addDelegate();
    await readState();
    // await removeAttr("service1");
    console.log((Date.now()-checkpoint)/1000);
    
})().catch(e => {
    console.log(e);
});

return;