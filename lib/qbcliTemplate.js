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
                dependancies: [1, 3],
                isIndex: false
            }
        ]
    };

};