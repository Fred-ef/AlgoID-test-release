// file containing some useful cryptography primitives

const crypto = require('crypto');

module.exports = {
    // returns the key type inferred from the W3C "verificationMethod" description of the key
    getKeyType: function getKeyType(keyDesc) {
        if(keyDesc.includes('Ed255')) return 'EdDSA';
        else if(keyDesc.includes('EcdsaSecp256k')) return 'ES256K';
        else return null;
    },

    // returns an encrypted string from a message, key (bytes) and IV (bytes)
    aesEncrypt: function aesEncrypt(message, key, iv) {
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encryptedPk = cipher.update(message);
        encryptedPk = Buffer.concat([encryptedPk, cipher.final()]);
        return encryptedPk.toString('base64');
    },

    aesDecrypt: function aesDecrypt(message, key, iv) {
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decryptedMsg = decipher.update(message, 'base64');
        decryptedMsg = Buffer.concat([decryptedMsg, decipher.final()]);
        return decryptedMsg.toString();
    },

    // returns a sha256-hashed string of the input parameter
    hashSha256: function hashSha256(message) {
        const hasher = crypto.createHash('sha256');
        hasher.update(message);
        let hashedMsg = hasher.digest();
        return hashedMsg.toString('hex');
    }
}