const fs = require('fs');
const path = require('path');

module.exports = {
    //gets current working directory
    getCurrentDirectoryBase : () => {
        return path.basename(process.cwd());
    },

    //checks to see if the directory exists
    directoryExists : (filePath) => {
        try {
            return fs.statSync(filePath).isDirectory();
        } catch (err) {
            return false;
        }
    },
    //checks to see if a file exists
    fileFolderExists: (filePath)=>{
        return fs.existsSync(filePath)
    },

    /**
     * @param {String} filename Filename of the file being saved
     * @param {Object} data JS object data to save to json file
     */
    saveJSONToFile: (filename, data)=>{
        fs.writeFile( filename, JSON.stringify(data), (err)=>{
            if (err) throw err;
        });
    },

    /**
     * Gets all filenames from a particular directory
     * @param {String} path Filename of the file being saved
     */
    getFilesFromDirectory: (path)=>{
        const files = fs.readdirSync(path);
        if( files.length < 1 ) {
            return false
        }
        return files;
    },

    /**
     * Returns JS object from JSON file given the path
     * @param {String} path Path to file
     */
    readJSONFile: ( path )=>{
        const data = fs.readFileSync(path);
        return JSON.parse(data);
    },

    /**
     * Returns the contents of the file.
     * @param {String} path Path to file
     */
    getFileContents: (path)=>{
        return fs.readFileSync(path).toString();
    }
};