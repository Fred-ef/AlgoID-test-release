// file containing cryptographic functions that operate on AlgoDID wallets

const crypto = require('crypto');
const readLine = require('readline-sync');

const aesEncrypt = require('./security').aesEncrypt;
const aesDecrypt = require('./security').aesDecrypt;
const hashSha256 = require('./security').hashSha256;

module.exports = {
    encryptWallet: function encryptWallet(account) {
        // ########## ACCOUNT ENCRYPTION ##########

        // extracting address and private key from the account
        const addr = account.addr;
        const pk = Buffer.from(account.sk);

        // generating the AES 128bit key and IV to encrypt the account's sensible data
        const aesKey = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);

        // creating an encrypted object associated with the generated account
        const accountObject = JSON.stringify({
            address: addr,
            pk: Buffer.from(pk).toString('base64')
        });
        const encAccount = aesEncrypt(accountObject, aesKey, iv);


        // ########## PASSPHRASE CREATION ##########

        // prompting the user to enter a passphrase
        console.log('\nGenerating a credential wallet for the new DID.\
        \nAlgoID wallets require a passphrase for security reasons.\
        \nYou will need it to modify and update the newly created DID.\n');
        let passphrase = readLine.question('Please insert a passphrase.\n> ');


        // ########## WALLET ENCRYPTION ##########

        // creating a new key generated from the passphrase to encrypt the (account, key, iv) triple
        const salt = crypto.randomBytes(16).toString('base64');
        const passphraseHash = crypto.pbkdf2Sync(passphrase, salt, 100000, 64, 'sha512');
        const walletKey = passphraseHash.subarray(0, 32);
        const keyTrace = passphraseHash.subarray(32, 64);
        const walletIv = crypto.randomBytes(16);

        // creating an encrypted object associated with the encrypted account and its cryptographic material
        const walletData = JSON.stringify({
            encAccount: encAccount,
            aesKey: aesKey.toString('base64'),
            iv: iv.toString('base64')
        });
        const encWalletData = aesEncrypt(walletData, walletKey, walletIv);

        // generating the complete encrypted wallet object
        const wallet = {
            encWalletData: encWalletData,
            salt: salt.toString('base64'),
            walletIv: walletIv.toString('base64'),
            keyTrace: hashSha256(keyTrace.toString('hex')).toString('base64')
        };

        return wallet;
    },

    decryptWallet: function decryptWallet(encWallet) {
    // prompting the user to insert the passphrase related to the specified DID
    let passphrase = readLine.question('\nType the passphrase for the specified identity\n> ');
    let passphraseHash = crypto.pbkdf2Sync(passphrase, encWallet.salt, 100000, 64, 'sha512');

    // getting the Wallet key from the passphrase
    const passKey = passphraseHash.subarray(0, 32);
    const passKeyTrace = hashSha256(passphraseHash.subarray(32, 64).toString('hex'));

    // failing if the user provided the wrong passphrase
    if(encWallet.keyTrace != passKeyTrace) {
        console.error("The passphrase provided is wrong.");
        process.exit(1);
    }

    // decrypting the wallet to get the encrypted account data and then decrypting that data
    const encAccount = JSON.parse(aesDecrypt(encWallet.encWalletData, passKey, Buffer.from(encWallet.walletIv, 'base64')).replace("^(?:\s*)(\w+)$"));
    const decAccount = aesDecrypt(encAccount.encAccount, new Uint8Array(Buffer.from(encAccount.aesKey, 'base64')), Buffer.from(encAccount.iv, 'base64'));

    return JSON.parse(decAccount.toString('binary'));
    }
}