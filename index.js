#!/usr/bin/env node

//npm
const clear = require('clear');
const userInput  = require('./lib/userInput');
const userConfirmation = require('./lib/userInputConfirmation');

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
const opn = require('opn');
const xmlparser = require('fast-xml-parser');
const editJsonFile = require("edit-json-file");


//custom scripts
const files = require('./lib/files');
const helpers = require('./lib/helpers');
const qb = require('./lib/qb');

//init configstore
const configurationFile = new Configstore(pkg.name);

//configs
const qbCLIConfName = 'qbcli.json';
// var extensionPrefix = 'MCF_';
// var extensionPrefixDev = 'MCF_d_';
const gitIgnoreFileName = './.gitignore';




const run = async () => {

    const args = minimist(process.argv.slice(2));


    //if running the install
    if( args._.includes('init') ) {

        //clear the screen
        clear();

        const input = await userInput.getInput();
        const repositoryId = input.repositoryId;
        const salt = cryptoRandomString(25);

        const cryptr = new Cryptr(salt);

        //save app & usertoken
        input.apptoken = cryptr.encrypt(input.apptoken);
        input.usertoken = cryptr.encrypt(input.usertoken);

        /*
            Save repository ID to local config and everything else to local
        */
        const data = {
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

        console.log(chalk.green('\n A qbcli.json file has been created in the root of your project directory.  Please update this file to include all files that you need to deploy to QB.\n'));

    //if running the production or development deploy option
    } else if ( args._.includes('dev') || args._.includes('prod') ) {

        //make sure user is running this from the root of their react directory
        if (!files.fileFolderExists(`${qbCLIConfName}`)) {
            console.log(chalk.red('This qbdeploy command can only be run from the root of your directory.'));
            return;
        }


        //get repo ID and files to push to prod
        const { repositoryId, filesConf } = files.readJSONFile(`./${qbCLIConfName}`);
        if (filesConf.length < 1) {
            console.log(chalk.red('You must list files to deploy in your qbcli.json file.'));
            return;
        }

        //get configs stored from qbcli install
        const configs = configurationFile.get(repositoryId);
        if (!configs) {
            console.log(chalk.red('Project may never have been initialized - please run qbdeploy init.'));
            return;
        }
        
        //get prefix for files
        var prefix = null;
        var { customPrefix, customPrefixProduction } = configs;
        if (args._.includes('prod') ) {
            //confirm deployment to production
            const confirmation = await userConfirmation.getInput();
            if (confirmation.answer === "yes" ) {
                prefix = helpers.prefixGenerator(customPrefix, customPrefixProduction, true, repositoryId);
            } else {
                return;
            }
        } else {
            prefix = helpers.prefixGenerator(customPrefix, customPrefixProduction, false, repositoryId);
        }


        //get file contents from the build folder
        try{
            String.prototype.replaceAll = function (search, replacement) {
                var target = this;
                return target.replace(new RegExp(search, 'g'), replacement);
            };

            //gets an array of file contents.  Each item in the array ahs filename, and filecontent, and conditionally a "isIndexFile" boolean.
            var arrayOfFileContents = helpers.getAllFileContents(filesConf, files.getFileContents, String.replaceAll, prefix);
            if( !arrayOfFileContents ) {
                console.log(chalk.red('Please check your qbcli.json in the root of your project. Make sure you have mapped the correct path to all of the files you are trying to deploy.  Also check all filenames match what is in those directories'));
            }

            //add the appopriate extension prefix to each file depending on whether it is dev/prod deployment.
            var indexFileName = null;
            arrayOfFileContents = arrayOfFileContents.map((item)=>{
                const [fileName, fileContents, isIndexFile] = item;
                if( isIndexFile ) {
                    indexFileName = fileName;
                }
                return [`${prefix}${fileName}`, fileContents];
            });

        } catch(err) {
            console.log(chalk.red('\nFiles are not present.  Make sure you have listed the correct paths in your qbcli.json'));
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
            // console.log(res[0].config.data);
            //loop through the responses to set the appropriate dbpage id value for dev/production in the qbcli.json
            res.forEach((i)=>{
                if (i.config && indexFileName && i.config.data.indexOf(indexFileName) >= 0) {
                    var resObj = xmlparser.parse(i.data);
                    var pageID = resObj.qdbapi.pageID;
                    if ( args._.includes('prod') ) {
                        let file = editJsonFile(`${__dirname}/${qbCLIConfName}`);
                        file.set("launchProdPageId", pageID);
                        file.save();
                    } else {
                        let file = editJsonFile(`${__dirname}/${qbCLIConfName}`);
                        file.set("launchDevPageId", pageID);
                        file.save();
                    }
                }
            });

            status.stop();
            console.log(chalk.green('\nFiles deployed successfully!!\n'));
        }).catch((err)=>{
            status.stop();
            console.log(chalk.red(`\nAPI call failure - files weren\'t deployed successfully. Check your username and usertoken - run qbdeploy init again to reconfigure those values. \n\nQB response: ${err.response.statusText}`));
        });
    } else if (args._.includes('ldev')) {
        //get repo ID and files to push to prod
        const { launchDevPageId, repositoryId } = files.readJSONFile(`./${qbCLIConfName}`);
        if( !launchDevPageId ) {
            console.log(chalk.red('\nYou must first deploy the development files to the Quick Base application before you can use this command.  Try running "qbdeploy dev" first.'));
            return;
        }
        //get configs stored from qbcli install
        const configs = configurationFile.get(repositoryId);
        const { dbid, realm } = configs;
        //launch the webpage
        opn(`https://${realm}.quickbase.com/db/${dbid}?a=dbpage&pageID=${launchDevPageId}`);
    } else if (args._.includes('lprod')) {
        //get repo ID and files to push to prod
        const { launchProdPageId, repositoryId } = files.readJSONFile(`./${qbCLIConfName}`);
        if (!launchProdPageId) {
            console.log(chalk.red('\nYou must first deploy the production files to the Quick Base application before you can use this command.  Try running "qbdeploy prod" first.'));
            return;
        }
        //get configs stored from qbcli install
        const configs = configurationFile.get(repositoryId);
        const { dbid, realm } = configs;
        //launch the webpage
        opn(`https://${realm}.quickbase.com/db/${dbid}?a=dbpage&pageID=${launchProdPageId}`);
    }
  
}

run();





