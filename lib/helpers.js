
module.exports = {
    /**
     * Returns a filename from an array given an extension.
     * @param {String} extension The Extension of the file you are looking for
     * @param {Array} array Array of file names from a given directory.
     */
    getFileNameFromExt_h : (array, extension) => {
        const length = array.length;
        var name = false;
        for( var i = 0; i < length; i++ ) {
            if( array[i].includes(extension) ) {
                name = array[i];
            }
        }
        return name;
    },

    /**
     * Used to loop through the files housed in the qbcli.json that the user wants added to QB
     * @param {Array} filesArray Array of files.  First index is filename, second is the path to the file directory
     * @param {Function} getFileContents Give a path, obtains the contents of a file and returns that as a string
     * @param {Function} replaceAll Scans a string and replaces all instances.
     * @param {String} prefix The prefix of the file chosen to be prepended to the file in Quick Base.
     * @return {Array} Returns an array of file contents to be added to Quick Base OR false if any files were misssing.  Index 1 is filename, Index 2 is file contents to be added to Quick Base. 
     */
    getAllFileContents( filesArray, getFileContents, replaceAll, prefix ) {
        var missingFiles = false;
        var contents = filesArray.map((item)=>{
            //concats the filename and path to file
            const {filename, path} = item;
            const filePath = path + filename;
            var fileContents = getFileContents(filePath);
            //if file has no content return false and set flag
            if( fileContents.length < 1 && missingFiles === false){
                missingFiles = true;
                return false;
            };

            //replace dependencies if they exist.  Handles replacing depencies for the project and naming them correctly based on the prefix provided by the user.
            if( item.dependancies && item.dependancies.length > 0 ) {
                let length = item.dependancies.length;
                //dependency is the numeric value set in qbcli.json file. 
                item.dependancies.forEach((i)=>{
                    let dependencyFileName = filesArray[i].filename;
                    let updatedFileName = `${prefix}${dependencyFileName}`;
                    //fileContents.indexOf(`pagename=${dependencyFileName}`, `pagename=${updatedFileName}`);
                    fileContents = fileContents.replace(`pagename=${dependencyFileName}`, `pagename=${updatedFileName}`);
                });
            }
            
            //sanitize fileContents for CDATA tags
            return [filename, fileContents.replaceAll("]]>", "]]]]><![CDATA[>")]
        });

        if (missingFiles) {
            return false;
        } else {
            return contents;
        }
    },

    /**
     * Used to generate an array of promises for all API calls for adding dbpages to QB from file contents.
     * @param {String} dbid Application dbid
     * @param {String} realm QB realm
     * @param {String} usertoken Usertoken for QB
     * @param {String} apptoken apptoken for QB
     * @param {String} fileContentsArray An array of files to be added to QB.  Index 1 = filename Index 2 = File contents
     * @param {Function} addUpdateDbPage Returns a promise for add/update QB dbpage.
     */
    generateAllAPICallPromises(dbid, realm, usertoken, apptoken, fileContentsArray, addUpdateDbPage) {
        return fileContentsArray.map((item)=>{
            var [fileName, fileContents] = item;
            return addUpdateDbPage(dbid, realm, usertoken, apptoken, fileContents, fileName);
        });
    },



    /**
     * Used to create the custom extension prefix.
     * @param {String} customPrefix If a user created a custom prefix for dev files, this is that value.
     * @param {String} extensionPrefix Default extensionPrefix for production
     * @param {String} extensionPrefixDev Default extension prefix for dev
     * @param {Boolean} isProd Boolean used to determine if this is a production/dev deployment.
     * @param {String} repositoryId Repo unique identifier.
     */
    prefixGenerator(customPrefix, extensionPrefix, extensionPrefixDev, isProd, repositoryId) {
        var returnPrefix = null;
        //for dev
        if (customPrefix && !isProd) {
            returnPrefix = `${customPrefix}_`;
        } else {
            returnPrefix = `${extensionPrefixDev}${repositoryId}`;
        }

        //for prod
        if( isProd ) {
            returnPrefix = `${extensionPrefix}${repositoryId}_`;
        }

        return returnPrefix;
    }
};