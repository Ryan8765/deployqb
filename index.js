#!/usr/bin/env node

//npm
const clear = require('clear');
const Configstore = require('configstore');
const pkg = require('./package.json');
const CLI = require ('clui');
const Spinner = CLI.Spinner;
const minimist = require('minimist');
const Cryptr = require('cryptr');
const cryptoRandomString = require('crypto-random-string');
const path = require('path');
const opn = require('opn');
const xmlparser = require('fast-xml-parser');
const editJsonFile = require("edit-json-file");


//custom scripts
const files = require('./lib/files');
const helpers = require('./lib/helpers');
const qb = require('./lib/qb');
const alert = require('./lib/alerts');
const qbcliTemplate = require('./lib/qbcliTemplate');
const userInput = require('./lib/userInput');
const userConfirmation = require('./lib/userInputConfirmation');
const modifyPrefixInput = require('./lib/userInputModifyPrefix');

//init configstore
const configurationFile = new Configstore(pkg.name);

//configs
const qbCLIConfName = 'qbcli.json';
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

        //update app & usertoken
        input.apptoken = cryptr.encrypt(input.apptoken);
        input.usertoken = cryptr.encrypt(input.usertoken);

        //create qbcli template object
        const data = qbcliTemplate(repositoryId, salt);
    

        //create qbcli.json file
        try {
            files.saveJSONToFile(`${qbCLIConfName}`, data);
        } catch (error) {
            alert.error(error);
            return;
        }
        

        //save qb db configs
        configurationFile.set(repositoryId, input);


        //make sure git ignore includes qbcli.json
        var pathToGitignore = path.join(__dirname, gitIgnoreFileName);

        try {
            files.updateGitIgnore(pathToGitignore, qbCLIConfName);
        } catch (error) {
            alert.warning('Not able to update .gitignore.  Please add the qbcli.json to your .gitignore if this project is initialized with git.');
        }

        alert.success('A qbcli.json file has been created in the root of your project directory.  Please update this file to include all files that you need to deploy to QB');    

    //if running the production or development deploy option
    } else if ( args._.includes('dev') || args._.includes('prod') ) {

        const isProdDeployment = args._.includes('prod') ? true : false;

        //make sure user is running this from the root of their react directory
        if (!files.fileFolderExists(`${qbCLIConfName}`)) {
            alert.error('This deployqb command can only be run from the root of your directory.');
            return;
        }


        //get repo ID and files to push to prod
        const { repositoryId, filesConf } = files.readJSONFile(`${process.cwd()}\\${qbCLIConfName}`);
        if (filesConf.length < 1) {
            alert.error('You must list files to deploy in your qbcli.json.')
            return;
        }

        //get configs stored from qbcli install
        const configs = configurationFile.get(repositoryId);
        if (!configs) {
            alert.error('Project may never have been initialized - please run deployqb init.');
            return;
        }

        //if this is a prod deployment - double check the user wants to actually deploy
        if( isProdDeployment ) {
            const confirmation = await userConfirmation.getInput();
            if (confirmation.answer !== "yes") {
                return;
            }
        }
        
        
        //get prefix for files
        const prefix = helpers.prefixGenerator(configs, isProdDeployment, repositoryId);
      

        //get file contents from the build folder
        try{
            //gets an array of file contents.  Each item in the array ahs filename, and filecontent, and conditionally a "isIndexFile" boolean.
            var arrayOfFileContents = helpers.getAllFileContents(filesConf, files.getFileContents, prefix);
            if( !arrayOfFileContents || arrayOfFileContents.length < 1 ) {
                alert.error('Please check your qbcli.json in the root of your project. Make sure you have mapped the correct path to all of the files you are trying to deploy.  Also check all filenames match what is in those directories - and that all files have content (this tool will not deploy blank files - add a comment in the file if you would like to deploy without code).');
                return;
            }

            //add the appopriate extension prefix to each file depending on whether it is dev/prod deployment.  IF an index file has been listed, set the indexFileName below.
            var indexFileName = null;
            arrayOfFileContents = arrayOfFileContents.map((item)=>{
                const [fileName, fileContents, isIndexFile] = item;
                if( isIndexFile ) {
                    indexFileName = fileName;
                }
                return [`${prefix}${fileName}`, fileContents];
            });

        } catch(err) {
            alert.error('Please check your qbcli.json in the root of your project. Make sure you have mapped the correct path to all of the files you are trying to deploy.  Also check all filenames match what is in those directories and make sure those files have content (this tool will not deploy blank files - add a comment if you would like to deploy without code).');
            return;
        }
        

        //get description
        const { conf } = files.readJSONFile(`${process.cwd()}\\${qbCLIConfName}`);
        const cryptr = new Cryptr(conf);

        //decrypt usertoken and password
        configs.usertoken = cryptr.decrypt(configs.usertoken);
        configs.apptoken = cryptr.decrypt(configs.apptoken);

        /*
            Add files to QB
        */

        //start spinner
        const status = new Spinner('Processing request, please wait...');
        status.start();

        //get all promises for API calls.
        var allPromises = helpers.generateAllAPICallPromises(configs, arrayOfFileContents, qb.addUpdateDbPage);


        //api calls
        Promise.all(allPromises).then((res)=>{
            //loop through the responses to set the appropriate dbpage id value for dev/production in the qbcli.json.
            res.forEach((i)=>{
                if (i.config && indexFileName && i.config.data.indexOf(indexFileName) >= 0) {
                    var resObj = xmlparser.parse(i.data);
                    var pageID = resObj.qdbapi.pageID;
                    if ( args._.includes('prod') ) {
                        let file = editJsonFile(`${process.cwd()}\\${qbCLIConfName}`);
                        file.set("launchProdPageId", pageID);
                        file.save();
                    } else {
                        try {
                            let file = editJsonFile(`${process.cwd()}\\${qbCLIConfName}`);
                            file.set("launchDevPageId", pageID);
                            file.save();
                        } catch (error) {
                            alert.error(`There was an error adding the pageID.  Note, your application still was deployed, but you may have trouble with ldev. \n ${error}`)
                        }
                        
                    }
                }
            });

            status.stop();
            alert.success('Files deployed successfully!')
        }).catch((err)=>{
            status.stop();
            alert.error(`API call failure - files weren\'t deployed successfully. Check your application token and user token.  You can run deployqb init again to reconfigure those values.  Note, running deployqb init will reconfigure your "files" in your qbcli.json file.  Make a copy of these values before re-running deployqb init. \n\nQB response: ${err.response.statusText}`);
        });
    } else if (args._.includes('ldev')) {
        //make sure user is running this from the root of their react directory
        if (!files.fileFolderExists(`${qbCLIConfName}`)) {
            alert.error('This deployqb command can only be run from the root of your directory.');
            return;
        }
        //get repo ID and files to push to prod
        const { launchDevPageId, repositoryId } = files.readJSONFile(`${process.cwd()}\\${qbCLIConfName}`);
        if( !launchDevPageId ) {
            alert.error('You must first deploy the development files to the Quick Base application before you can use this command.Try running "deployqb dev" first.');
            return;
        }
        //get configs stored from qbcli install
        const configs = configurationFile.get(repositoryId);
        if (!configs) {
            alert.error('Project may never have been initialized - please run deployqb init.');
            return;
        }
        const { dbid, realm } = configs;
        //launch the webpage
        opn(`https://${realm}.quickbase.com/db/${dbid}?a=dbpage&pageID=${launchDevPageId}`);
    } else if (args._.includes('lprod')) {
        //make sure user is running this from the root of their react directory
        if (!files.fileFolderExists(`${qbCLIConfName}`)) {
            alert.error('This deployqb command can only be run from the root of your directory.');
            return;
        }
        //get repo ID and files to push to prod
        const { launchProdPageId, repositoryId } = files.readJSONFile(`${process.cwd()}\\${qbCLIConfName}`);
        if (!launchProdPageId) {
            alert.error('You must first deploy the production files to the Quick Base application before you can use this command.  Try running "deployqb prod" first.');
            return;
        }
        //get configs stored from qbcli install
        const configs = configurationFile.get(repositoryId);
        if (!configs) {
            alert.error('Project may never have been initialized - please run deployqb init.');
            return;
        }
        const { dbid, realm } = configs;
        //launch the webpage
        opn(`https://${realm}.quickbase.com/db/${dbid}?a=dbpage&pageID=${launchProdPageId}`);
    } else if (args._.includes('help')) {
        alert.success('deployqb commands');
        console.log('init:        Initializes this project.');
        console.log('dev:         Deploys your files to the development environment.');
        console.log('prod:        Deploys your files to the production environment.');
        console.log('ldev:        Launch your development environment in Quick Base with your default browser.');
        console.log('lprod:       Launch your production environment in Quick Base with your default browser.');
        console.log('edevprefix:  Edit UAT environment prefix.');
        console.log('eprodprefix: Edit Production environment prefix.');
        console.log('genlinks:    Displays a list of possible links for each file in your project.\n');

    } else if (args._.includes('edevprefix')) {
        //make sure user is running this from the root of their react directory
        if (!files.fileFolderExists(`${qbCLIConfName}`)) {
            alert.error('This deployqb command can only be run from the root of your directory.');
            return;
        }
        const { repositoryId } = files.readJSONFile(`${process.cwd()}\\${qbCLIConfName}`);
        const configs = configurationFile.get(repositoryId);
        if (!configs) {
            alert.error('Project may never have been initialized - please run deployqb init.');
            return;
        }
        console.log('\nYour current developer prefix is: ' + configs.customPrefix + '\n');
        const input = await modifyPrefixInput.getInput();
        configs.customPrefix = input.newPrefix;
        configurationFile.set(repositoryId, configs);
        alert.success('Your development prefix has been updated successfully.')
    } else if (args._.includes('eprodprefix')) {
        //make sure user is running this from the root of their react directory
        if (!files.fileFolderExists(`${qbCLIConfName}`)) {
            alert.error('This deployqb command can only be run from the root of your directory.');
            return;
        }
        const { repositoryId } = files.readJSONFile(`${process.cwd()}\\${qbCLIConfName}`);
        const configs = configurationFile.get(repositoryId);

        if (!configs) {
            alert.error('Project may never have been initialized - please run deployqb init.');
            return;
        }
        console.log('\nYour current production prefix is: ' + configs.customPrefixProduction + '\n');
        const input = await modifyPrefixInput.getInput();
        configs.customPrefixProduction = input.newPrefix;
        configurationFile.set(repositoryId, configs);
        alert.success('Your production prefix has been updated successfully.')
    } else if (args._.includes('genlinks')) {
        //make sure user is running this from the root of their react directory
        if (!files.fileFolderExists(`${qbCLIConfName}`)) {
            alert.error('This deployqb command can only be run from the root of your directory.');
            return;
        }
        const { repositoryId, filesConf } = files.readJSONFile(`${process.cwd()}\\${qbCLIConfName}`);
        //get configs stored from qbcli install
        const configs = configurationFile.get(repositoryId);
        if (!configs) {
            alert.error('Project may never have been initialized - please run deployqb init.');
            return;
        }
        
        // console.log(filesConf);
        if( filesConf && filesConf.length > 0 ) {
            alert.warning('\nPOSSIBLE DEPENDENCY LINKS BASED ON YOUR QBCLI.jSON CONFIGS:');
            filesConf.forEach((file)=>{
                alert.soft('__________________________________________');
                const { filename } = file;
                console.log(filename + ':\n');
                console.log(`\t/db/${configs.dbid}?a=dbpage&pagename=${filename}`);
                alert.soft('__________________________________________');
            });
        }
    }
  
}

run();





