module.exports = function(repositoryId, salt) {

    if( !repositoryId || !salt ) return false;

    return {
        urlQueryString: "",
        repositoryId,
        conf: salt,
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