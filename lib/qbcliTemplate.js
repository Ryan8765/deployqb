module.exports = function(userInput) {

    if( !userInput ) return false;

    return {
        urlQueryString: "",
        repositoryId: userInput.repositoryId,
        prodPrefix: userInput.customPrefixProduction,
        devPrefix: userInput.customPrefix,
        featPrefix: userInput.customPrefixFeature,

        filesConf: [
            {
                filename: "exampleFileName.js",
                path: "./example/"
            },
            {
                filename: "example.html",
                path: "./examplefolder/subfolder/",
                dependencies: [1, 3],
                isIndexFile: false
            }
        ]
    };

};