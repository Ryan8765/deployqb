const fs = require('fs');
const path = require('path');
const parse = require('parse-gitignore');


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
        return fs.existsSync(filePath);
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
    },

    /**
     * Used to update the .gitignore file
     * @param {String} pathToFile The path to the .gitignore file from current directory
     * @param {String} itemToAddToGitignore The item to add to the gitignore.
     */
    updateGitIgnore: function (pathToFile, itemToAddToGitignore ) {
        if (this.fileFolderExists(pathToFile)) {
            //gets all contents of gitignore
            const gitIgnoreFilesArray = parse(fs.readFileSync(pathToFile));

            //only append if the qbcli.json isn't already listed
            if (gitIgnoreFilesArray.indexOf(`${itemToAddToGitignore}`) < 0) {
                var writeStream = fs.createWriteStream(pathToFile, { 'flags': 'a' });
                // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
                writeStream.write(`\n${itemToAddToGitignore}`);
                writeStream.end();
            }
        }
    }
};