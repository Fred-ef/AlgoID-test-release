// file containing functions managing the storage of AlgoDID wallets

const homedir = require('os').homedir();
const fs = require('fs');

module.exports = {
    // loads the given wallet from local storage and parses it in a JSON object
    loadWalletJson: function loadWalletJson(walletName) {
        const filePath = homedir+'/.algodid/wallets/'+walletName+'.wallet';
        if(fs.existsSync(filePath)) walletRaw = fs.readFileSync(filePath, {encoding: 'binary'});
        else {
            console.error("The name provided does not correspond to an AlgoDID identity");
            process.exit(1);
        }
        return JSON.parse(Buffer.from(walletRaw, 'base64').toString('binary'));
    },

    // stores a JSON wallet object in local storage in base64 encoding
    storeWalletJson: function storeWalletJson(wallet, walletName) {
        // converting the wallet object to a binary string
        const walletBin = JSON.stringify(wallet);

        // generating the filepath and saving the encrypted wallet file
        const dirpath = homedir+'/.algodid/wallets/';
        const filepath = dirpath+walletName+'.wallet';
        if(!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);
        fs.writeFile(filepath, Buffer.from(walletBin).toString('base64'), {flag: 'wx'}, (err) => {
            if(err) {
                if(err.errno == -17) console.error(walletName+' already exists')
            }
        });
    },

    checkWalletDuplicate: function checkWalletDuplicate(walletName) {
        const dirpath = homedir+'/.algodid/wallets/';
        const filepath = dirpath+walletName+'.wallet';
        if(fs.existsSync(filepath)) return true;
        else return false;
    }
}