module.exports = function(userInput) {

    if( !userInput ) return false;

    return {
        urlQueryString: "",
        repositoryId: userInput.repositoryId,
        prodPrefix: userInput.customPrefixProduction,
        devPrefix: userInput.customPrefix,
        dbid: userInput.dbid,
        devDbid: userInput.devAndProdQuickBaseApplications === "yes" ? userInput.devDbid : "",
        devAndProdQuickBaseApplications: userInput.devAndProdQuickBaseApplications === "yes" ? userInput.devAndProdQuickBaseApplications : "",
        realm: userInput.realm,

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