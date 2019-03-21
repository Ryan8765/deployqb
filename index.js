#!/usr/bin/env node

//npm
const clear = require('clear');
const userInput  = require('./lib/userInput');
const Configstore = require('configstore');
const pkg = require('./package.json');
const CLI = require ('clui');
const Spinner = CLI.Spinner;
const minimist = require('minimist');
const chalk = require('chalk');
const Cryptr = require('cryptr');
const cryptoRandomString = require('crypto-random-string');
const fs = require('fs');
const parse = require('parse-gitignore');
const path = require('path');


//custom scripts
const files = require('./lib/files');
const helpers = require('./lib/helpers');
const qb = require('./lib/qb');

//init configstore
const configurationFile = new Configstore(pkg.name);

//configs
const qbCLIConfName = 'qbcli.json';
var extensionPrefix = 'MCF_';
var extensionPrefixDev = 'MCF_d_';
const gitIgnoreFileName = './.gitignore';




const run = async () => {

    const args = minimist(process.argv.slice(2));


    //if running the install
    if( args._.includes('init') ) {

        //clear the screen
        clear();

        const input = await userInput.getInput();
        const repositoryId = input.repositoryId;
        const customPrefix = input.customPrefix;
        const salt = cryptoRandomString(25);

        const cryptr = new Cryptr(salt);

        //encrypt app & usertoken
        input.apptoken = cryptr.encrypt(input.apptoken);
        input.usertoken = cryptr.encrypt(input.usertoken);

        /*
            Save repository ID to local config and everything else to local
        */
        const data = {
            repositoryId,
            conf: salt,
            filesConf: [
                [
                    "filenameOne", "pathToFileOne"
                ],
                [
                    "filenameTwo", "pathToFileTwo"
                ]
            ]
        };

        //save the repository ID to local JSON file
        files.saveJSONToFile(`${qbCLIConfName}`, data);
        //save to local
        configurationFile.set(repositoryId, input);

        /*
            Update .gitignore if present to make sure it excludes qbcli.json
        */
        var pathToGitignore = path.join(__dirname, gitIgnoreFileName);
        if (files.fileFolderExists(pathToGitignore)) {
            //gets all contents of gitignore
            const gitIgnoreFilesArray = parse(fs.readFileSync(pathToGitignore));

            //only append if the qbcli.json isn't alrady listed
            if ( gitIgnoreFilesArray.indexOf(`${qbCLIConfName}`) < 0 ) {
                var writeStream = fs.createWriteStream(pathToGitignore, { 'flags': 'a' });
                // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
                writeStream.write(`\n${qbCLIConfName}`);
                writeStream.end();
            }
        } 

        console.log(chalk.green('\n A qbcli.json file has been created in the root of your project directory.  Please update this file to include all files that you need to deploy to QB.'));

    //if running the deploy
    } else if ( args._.includes('dev') || args._.includes('prod') ) {

        //make sure user is running this from the root of their react directory
        if (!files.fileFolderExists(`${qbCLIConfName}`)) {
            console.log(chalk.red('This qbdeploy command can only be run from the root of your directory.'));
            return;
        }


        //get repo ID and files to push to prod
        const { repositoryId, filesConf } = files.readJSONFile(`./${qbCLIConfName}`);
        if (files.length < 1) {
            console.log(chalk.red('You must list files to deploy in your qbcli.json file.'));
            return;
        }

        //get configs stored from qbcli install
        const configs = configurationFile.get(repositoryId);
        if (!configs) {
            console.log(chalk.red('Project may never have been initialized - please run qbdeploy init.'));
            return;
        }


        //get filenames in the build folder
        const buildCSSFileNames = files.getFilesFromDirectory('./build/static/css');
        const buildJSFileNames = files.getFilesFromDirectory('./build/static/js');



        // //concat filenames and return only filenames without .map
        // const fileNamesInBuild = buildCSSFileNames.concat(buildJSFileNames).filter((filenames)=>{
        //     return !filenames.includes('.map');
        // });

        // if( !fileNamesInBuild ) {
        //     console.log(chalk.red('You may have installed the qbdeploy in the wrong directory.  Please reinstall in the top level directory of your React application.'));
        //     return;
        // }

       

        //get filenames in the build folder
        // const cssFileName = helpers.getFileNameFromExt_h(fileNamesInBuild, '.css');
        // const jsFileName = helpers.getFileNameFromExt_h(fileNamesInBuild, '.js');

        // if( !cssFileName || !jsFileName ) {
        //     console.log(chalk.red('Make sure you have run npm run build for your React application'));
        //     return;
        // }

        // //create the filenames to be used for QB.
        // var qbCSSFileName = null;
        // var qbJSFileName = null;
        


        //get file contents from the build folder
        try{
            String.prototype.replaceAll = function (search, replacement) {
                var target = this;
                return target.replace(new RegExp(search, 'g'), replacement);
            };
            // var cssFileContents = files.getFileContents(`./build/static/css/${cssFileName}`);
            // var jsFileContents = files.getFileContents(`./build/static/js/${jsFileName}`);
            // //make sure no CDATA's are contained in the jsFIleContents - if there is modify it so the cdata is replaced
            // jsFileContents = jsFileContents.replaceAll("]]>", "]]]]><![CDATA[>");
            var arrayOfFileContents = helpers.getAllFileContents(filesConf, files.getFileContents, String.replaceAll);
            if( !arrayOfFileContents ) {
                console.log(chalk.red('Please check your qbcli.json in the root of your project. Make sure you have mapped the correct path to all of the files you are trying to deploy.  Also check all filenames match what is in those directories'));
            }


            var { customPrefix } = configs;

            //if there is a customprefix present, use that instead of "MCF_" & "MCF_d_"
            if (customPrefix) {
                extensionPrefix = `${customPrefix}_`;
                extensionPrefixDev = `${customPrefix}_d_`;
            }

            //add the appopriate extension prefix to each file depending on whether it is dev/prod deployment.
            if (args._.includes('prod')) {
               arrayOfFileContents = arrayOfFileContents.map((item)=>{
                    const [fileName, fileContents] = item;
                    return [`${extensionPrefix}${fileName}`, fileContents];
               });
            } else if (args._.includes('dev')) {
                arrayOfFileContents = arrayOfFileContents.map((item) => {
                    const [fileName, fileContents] = item;
                    return [`${extensionPrefixDev}${fileName}`, fileContents];
                });
            } else {
                console.log(chalk.green('Please specify dev or prod deployment.'));
                return;
            }

        } catch(err) {
            console.log(err);
            console.log(chalk.red('Files are not present in build folder.'));
            return;
        }
        

        var { dbid, realm, apptoken, usertoken } = configs;

        //get description
        const { conf } = files.readJSONFile(`./${qbCLIConfName}`);
        const cryptr = new Cryptr(conf);

        //decrypt usertoken and password
        usertoken = cryptr.decrypt(usertoken);
        apptoken = cryptr.decrypt(apptoken);

        /*
            Add files to QB
        */

        //start spinner
        const status = new Spinner('Processing request, please wait...');
        status.start();

        var allPromises = helpers.generateAllAPICallPromises(dbid, realm, usertoken, apptoken, arrayOfFileContents, qb.addUpdateDbPage);


        //api calls
        Promise.all(allPromises).then((res)=>{
            status.stop();
            console.log(chalk.green('Deployment Successful!'));
        }).catch((err)=>{
            // console.log(err);
            status.stop();
            console.log(chalk.red('API call failure.  All files weren\'t deployed successfully'));
        });
    }
  
}

run();





