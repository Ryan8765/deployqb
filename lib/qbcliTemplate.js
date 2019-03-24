module.exports = function(repositoryId, salt) {

    if( !repositoryId || !salt ) return false;

    return {
        repositoryId,
        conf: salt,
        filesConf: [
            {
                filename: "exampleFileName.js",
                path: "./example/"
            },
            {
                filename: "exampleFileName.css",
                path: "./examplefolder/subfolder/",
                dependencies: [1, 3],
                isIndex: false
            }
        ]
    };

};