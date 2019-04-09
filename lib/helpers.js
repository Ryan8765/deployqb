
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
     * @param {String} prefix The prefix of the file chosen to be prepended to the file in Quick Base.
     * @return {Array} Returns an array of file contents to be added to Quick Base OR false if any files were misssing.  Index 0 is filename, Index 1 is file contents to be added to Quick Base, and if the file is the main launch file (isIndexFile = true in qbcli.json) return true at index position 2 in the array 
     */
    getAllFileContents: function( filesArray, getFileContents, prefix ) {
        var missingFiles = false;
        var contents = filesArray.map((item)=>{
            //concats the filename and path to file
            const {filename, path, isIndexFile} = item;
            const filePath = path + filename;
            var fileContents = getFileContents(filePath);
            var returnArray = null;
            //if file has no content return false and set flag
            if( fileContents.length < 1 && missingFiles === false){
                missingFiles = true;
                return false;
            };

            //replace dependencies if they exist.  Handles replacing depencies for the project and naming them correctly based on the prefix provided by the user.
            if( item.dependencies && item.dependencies.length > 0 ) {
                let length = item.dependencies.length;
                //dependency is the numeric value set in qbcli.json file. 
                item.dependencies.forEach((i)=>{
                    let dependencyFileName = filesArray[i].filename;
                    let updatedFileName = `${prefix}${dependencyFileName}`;
                    //fileContents.indexOf(`pagename=${dependencyFileName}`, `pagename=${updatedFileName}`);
                    fileContents = fileContents.replace(`pagename=${dependencyFileName}`, `pagename=${updatedFileName}`);
                });
            }

            const escapeRegExp = (string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            }
            var string = escapeRegExp(']]>');
            var regexp = new RegExp(string, "g");
            //if this is the index file to launch - append that information for a flag later in the script.
            if( isIndexFile ) {
                return [filename, fileContents.replace(regexp, "]]]]><![CDATA[>"), isIndexFile];
            } else {
                //sanitize fileContents for CDATA tags
                return [filename, fileContents.replace(regexp, "]]]]><![CDATA[>")]
            }
            
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
    generateAllAPICallPromises: function(configs, fileContentsArray, addUpdateDbPage) {
        var { dbid, realm, apptoken, usertoken } = configs;
        return fileContentsArray.map((item)=>{
            var [fileName, fileContents] = item;
            return addUpdateDbPage(dbid, realm, usertoken, apptoken, fileContents, fileName);
        });
    },



    /**
     * Used to create the custom extension prefix.
     * @param {Object} config qbcli.json configuration object.
     * @param {Boolean} deploymentType Boolean used to determine if this is a production/dev deployment.
     * @param {String} repositoryId Repo unique identifier.
     */
    prefixGenerator: function(config, deploymentType, repositoryId) {
        const { customPrefix, customPrefixProduction, customPrefixFeature } = config;
        //for dev
        if ( deploymentType === 'dev' ) {
            if( customPrefix ) {
                return `${customPrefix}_${repositoryId}_`;
            } else {
                return `D_${repositoryId}_`;
            }
        }

        //for prod
        if ( deploymentType === 'prod' ) {
            if (customPrefixProduction) {
                return `${customPrefixProduction}_${repositoryId}_`;
            } else {
                return `P_${repositoryId}_`;
            }
        }

        //for prod
        if (deploymentType === 'feat') {
            if (customPrefixFeature) {
                return `${customPrefixFeature}_${repositoryId}_`;
            } else {
                return `F_${repositoryId}_`;
            }
        }

        return returnPrefix;
    }
};