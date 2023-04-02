// command-route for signing with dids

const didJwt = require('did-jwt');
const crypto = require('crypto');
const sdk = require('algosdk');
const readLine = require('readline-sync');


const commandHelp = require('../help/command-help');
const { readlink } = require('fs');
const validateFilename = require('../tools/validation').validateFilename;
const decryptWallet = require('../tools/cryptography/wallet-security').decryptWallet;
const loadWalletJson = require('../tools/wallet-storage').loadWalletJson;



// implements the "sign" command
const verify = function verify(command, args) {

    /*
    // command arguments validation
    if(args.length == 0) {
        commandHelp("You have to provide the name of the AlgoDID identity to sign with.", command);
        process.exit(1);
    } else if(args.length == 1) {
        commandHelp("You have to provide a binary string to sign.", command);
        process.exit(1);
    } else if(args.length > 2) {
        commandHelp("Too many arguments.", command);
        process.exit(1);
    }
    */


    // getting the wallet's name
    const binData = new TextEncoder().encode(readLine.question('\nType/paste the binary data you want to verify\n> '));
    const signatureBase64 = readLine.question('\nType the signature you want to verify\n> ');
    signature = new Uint8Array(Buffer.from(signatureBase64, 'base64url'));
    const address = readLine.question('\nType the AlgoID identity you want to verify the signature against (without "did:algoid:")\n> ');

    console.log("binData:\n"+binData);
    console.log("signature:\n"+signature);
    console.log("address:\n"+address);

    let timestamp = Date.now();

    // E4TWJPWAQSIY7HF7ND45TMP7KTRAVS7WSWV7YX3QHJ5QMMSWXP67IR6WEQ
    
    if(sdk.verifyBytes(binData, signature, address)) console.log("The signature is valid\n");
    else console.log("The signature is NOT valid");
    console.log((Date.now() - timestamp)/1000);
}



function getSigner(key, keyType) {
    if(keyType == 'EdDSA') return EdDSASigner(key);
    else if(keyType == 'ES256K') return ES256KSigner(key);
    else return null;
}

/*
const did = (JSON.parse(data));
const issuer = did.document.id;
const keyDesc = did.document.verificationMethod[0].type;
const pk = did.document.verificationMethod[0].private;
const buffer = Buffer.from(pk, 'base64');
const hexKey = buffer.toString('hex');
const key = hexToByteArr(hexKey);
const alg = returnKeyType(keyDesc);
const signer = getSigner(key, alg);

const jwt = await createJWT(
    {string: "hello"},
    {issuer: issuer, signer},
    {alg: alg});

console.log(decodeJWT(jwt));
console.log(jwt);
*/

module.exports = verify;