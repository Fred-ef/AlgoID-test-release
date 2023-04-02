// command-route for signing with dids

const didJwt = require('did-jwt');
const crypto = require('crypto');
const sdk = require('algosdk');
const readLine = require('readline-sync');


const commandHelp = require('../help/command-help');
const validateFilename = require('../tools/validation').validateFilename;
const decryptWallet = require('../tools/cryptography/wallet-security').decryptWallet;
const loadWalletJson = require('../tools/wallet-storage').loadWalletJson;



// implements the "sign" command
const vc = function vc(command, args) {

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
    const walletName = readLine.question('\nType the name of the AlgoID identity you want to sign with\n> ');
    if(!validateFilename(walletName)) {
        console.error("Invalid file name.");
        process.exit(1);
    }

    // getting the encrypted wallet as a JSON object
    let encWallet = loadWalletJson(walletName);

    // retrieving the account data associated with the wallet
    const account = decryptWallet(encWallet);
    const key = Buffer.from(account.pk, 'base64');

    // generating the credential
    const vcId = readLine.question('\nType the ID of the credential (you can also leave it blank)\n> ');
    const vcType = readLine.question('\nType the credential type\n> ');
    const vcSubject = readLine.question('\nType the ID of the credential subject (without "did:algoid:")\n> ');
    const vcName = readLine.question('\nType the name of the credential\n> ');
    console.log("\nType the name and the value of each of the VC attributes. Type \"end\" when finished.");
    let tempKey = "";
    let tempVal = "";

    let credentialFields = {};
    do {
        tempKey = readLine.question('\nType the name of the attribute\n> ');
        if(tempKey == "" || tempKey == "end") break;
        tempVal = readLine.question('\nType the value of the attribute\n> ');
        if(tempVal == "" || tempVal == "end") break;
        credentialFields[tempKey] = tempVal;
    } while(1);
    let credentialSubject = {};
    credentialSubject["id"] = vcSubject;
    credentialSubject[vcName] = credentialFields;

    // getting date
    const timestamp = Date.now();
    const dateTime = new Date(timestamp);
    const stringTime = dateTime.getFullYear()+'/'+dateTime.getMonth()+'/'+dateTime.getDate()+'T'+dateTime.getHours()+':'+dateTime.getMinutes()+':'+dateTime.getSeconds()+'Z';


    let vcUnsigned = {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://www.w3.org/2018/credentials/examples/v1",
          "https://w3id.org/security/suites/ed25519-2020/v1"
        ],
        "id": vcId,
        "type": [
          "VerifiableCredential",
          vcType
        ],
        "issuer": "did:algoid:"+account.address,
        "issuanceDate": stringTime,
        "credentialSubject": credentialSubject
      }
    const signature = sdk.signBytes(JSON.stringify(vcUnsigned), key);

    
    let vcProof = {
      "proof": {
        "type": "Ed25519Signature2020",
        "created": stringTime,
        "verificationMethod": "did:algoid:"+vcSubject+"#controller",
        "proofPurpose": "assertionMethod",
        "proofValue": Buffer.from(signature).toString('base64url')
      }
    }

    let vc = vcUnsigned;
    vc["proof"] = vcProof;

    console.log(vc);
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

module.exports = vc;