// files containing some useful validation functions

module.exports = {
    // checks if the given file name is a legal filename
    validateFilename: function validateFilename(fileName) {
        return fileName.match("[a-z_\-\s0-9\.]");
    },

    validateDirname: function validateDirname(dirName) {
        return dirName.match("[a-z_\-\s0-9\.]");
    }
}