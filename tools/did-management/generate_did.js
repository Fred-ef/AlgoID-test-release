// utility tools for DID creation

const sdk = require('algosdk');


const context = ['https://www.w3.org/ns/did/v1', "https://w3id.org/security/v1"];


// ########## FUNCTION ##########

const generateDid = function(addr, pubKey) {
    return {
        '@context': context,
        id: 'did:algo:'+addr,
        verificationMethod: [
            {
                id: 'did:algo:'+addr+'#master',
                type: 'Ed25519VerificationKey2018',
                controller: 'did:algo:'+addr
            }
        ],
        authentication: [
            'did:algo:'+addr+'#master'
        ]
    }
}


module.exports = generateDid;