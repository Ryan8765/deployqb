#!/usr/bin/env node

//npm
const clear = require('clear');
const Configstore = require('configstore');
const pkg = require('./package.json');
const CLI = require ('clui');
const Spinner = CLI.Spinner;
const minimist = require('minimist');
const path = require('path');
const opn = require('opn');
const xmlparser = require('fast-xml-parser');
const editJsonFile = require("edit-json-file");
const stripBom = require('strip-bom');
const keytar = require('keytar');

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

//load enums/commands
const ENUMS = require('./lib/enums');

/**
 * Runs the main logic for the CLI Script
 */
const run = async () => {

    //configs used by multiple CLI commands
    const qbCLIConfName      = ENUMS.QB_CLI_FILE_NAME;
    var pathToQBCLIJSON      = path.join(process.cwd(), qbCLIConfName);
    var qbCliJsonExists      = files.fileFolderExists(pathToQBCLIJSON);
    var existingQbCliConfigs = null;


    if (qbCliJsonExists) {
        existingQbCliConfigs = files.readJSONFile(pathToQBCLIJSON);
    }




    const args = minimist(process.argv.slice(2));

    //if running the install
    if (args._.includes(ENUMS.DEPLOYQB_INIT_CMD) ) {

        //clear the screen
        clear();
        var input = null;

        if ( !qbCliJsonExists ) {
            input = await userInput.getInput();
        } else {
            input = await userInput.getRevisedUserInput( existingQbCliConfigs );
        }


        const repositoryId = input.repositoryId;


        //set usertoken and app token in secure storage
        try {
            const setUserToken = await keytar.setPassword(ENUMS.DEPLOYQB_NAME, `${repositoryId}ut`, input.usertoken);
        } catch (error) {
            alert.error('Error setting user token.  If you are on Linux - you may need to install "libsecret" - see documentation https://www.npmjs.com/package/keytar');
            alert.error(error);
        }

        try {
            const setAppToken = await keytar.setPassword(ENUMS.DEPLOYQB_NAME, `${repositoryId}ap`, input.apptoken);
        } catch (error) {
            alert.error('Error setting user token.  If you are on Linux - you may need to install "libsecret" - see documentation https://www.npmjs.com/package/keytar');
            alert.error(error);
        }
        
        
        if(!input.customPrefix) {
            input.customPrefix = "D";
        }

        if (!input.customPrefixProduction) {
            input.customPrefixProduction = "P";
        }

        if (!input.customPrefixFeature) {
            input.customPrefixFeature = "F";
        }
        

        //create qbcli template object
        const data = qbcliTemplate(input);

        //IF qbcli.json already exists - grab the urlquery string and filesconf        
        if ( qbCliJsonExists ) {
            data.urlQueryString = existingQbCliConfigs.urlQueryString;
            data.filesConf = existingQbCliConfigs.filesConf;
        }


        //Save feature prefix outside project/repo/qbcli.json - as this is specific for an individual coder
        configurationFile.set(repositoryId, {
            customPrefixFeature: input.customPrefixFeature
        });

        //create qbcli.json file
        try {
            files.saveJSONToFile(`${qbCLIConfName}`, data);
        } catch (error) {
            alert.error(error);
            return;
        }
        

        alert.success('A qbcli.json file has been created in the root of your project directory.  Please update this file to include all files that you need to deploy to QB');    

    //if running the production or development deploy option
    } else if (args._.includes(ENUMS.DEPLOY_DEV_CMD) || args._.includes(ENUMS.DEPLOY_PROD_CMD) || args._.includes(ENUMS.DEPLOY_FEAT_CMD) ) {
        
        //set the necessary deployment type
        var deploymentType = null;
        if (args._.includes(ENUMS.DEPLOY_DEV_CMD) ) {
            deploymentType = 'dev';
        } else if (args._.includes(ENUMS.DEPLOY_PROD_CMD) ) {
            deploymentType = 'prod';
        } else if (args._.includes(ENUMS.DEPLOY_FEAT_CMD) ) {
            deploymentType = 'feat';
        }

        //make sure user is running this from the root of their react directory
        if ( !qbCliJsonExists ) {
            alert.error('This deployqb command can only be run from the root of your directory.');
            return;
        }

        //get repo ID and files to push to prod
        const { repositoryId, filesConf } = existingQbCliConfigs;
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

        //if this is a prod/dev deployment - double check the user wants to actually deploy
        if( deploymentType === 'prod' || deploymentType === 'dev' ) {
            const confirmation = await userConfirmation.getInput( deploymentType );
            if (confirmation.answer !== "yes") {
                return;
            }
        }
        
        
        //get prefix for files
        const prefix = helpers.prefixGenerator({
                customPrefix: existingQbCliConfigs.devPrefix,
                customPrefixProduction: existingQbCliConfigs.prodPrefix,
                customPrefixFeature: configs.customPrefixFeature
            }, deploymentType, repositoryId);


        //get file contents from the build folder
        try{
            //gets an array of file contents.  Each item in the array ahs filename, and filecontent, and conditionally a "isIndexFile" boolean.
            var arrayOfFileContents = helpers.getAllFileContents(filesConf, files.getFileContents, prefix, stripBom);
            
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
        
        

        


        /*
            Add files to QB
        */

        //decrypt usertoken and password
        try {
            var usertoken = await keytar.getPassword(ENUMS.DEPLOYQB_NAME, `${repositoryId}ut`);
        } catch (error) {
            alert.error('Error getting user token.  If you are on Linux - you may need to install "libsecret" - see documentation https://www.npmjs.com/package/keytar');
            alert.error(error);
            return;
        }

        try {
            var apptoken = await keytar.getPassword(ENUMS.DEPLOYQB_NAME, `${repositoryId}at`);
        } catch (error) {
            alert.error('Error getting user token.  If you are on Linux - you may need to install "libsecret" - see documentation https://www.npmjs.com/package/keytar');
            alert.error(error);
            return;
        }
        
        if( !usertoken || !apptoken ) {
            alert.error('Please try to run "deployqb init" again - for some reason we can not find your usertoken or apptoken for this project.');
            return;
        }

        //start spinner
        const status = new Spinner('Processing request, please wait...');
        status.start();

        //get all promises for API calls.
        var allPromises = helpers.generateAllAPICallPromises({
                dbid: existingQbCliConfigs.dbid,
                realm: existingQbCliConfigs.realm,
                apptoken,
                usertoken
            }, arrayOfFileContents, qb.addUpdateDbPage);

        
        //api calls
        Promise.all(allPromises).then((res)=>{
            //loop through the responses to set the appropriate dbpage id value for dev/production in the qbcli.json.
            res.forEach((i)=>{
                if (i.config && indexFileName && i.config.data.indexOf(indexFileName) >= 0) {
                    var resObj = xmlparser.parse(i.data);
                    var pageID = resObj.qdbapi.pageID;
                    var errorMessage = null;
                    var qbcliPageIDName = null;
                    var file = null;

                    if (deploymentType === 'prod') {
                        qbcliPageIDName = 'launchProdPageId';
                        errorMessage = 'There was an error adding the pageID.  Note, your application still was deployed, but you may have trouble with lprod.';
                    } else if (deploymentType === 'dev') {
                        qbcliPageIDName = 'launchDevPageId'; 
                        errorMessage = 'There was an error adding the pageID.  Note, your application still was deployed, but you may have trouble with ldev.';
                    } else if (deploymentType === 'feat') {
                        qbcliPageIDName = 'launchFeatPageId'; 
                        errorMessage = 'There was an error adding the pageID.  Note, your application still was deployed, but you may have trouble with lfeat.';
                    }

                    try {
                        file = editJsonFile(pathToQBCLIJSON);
                        file.set(qbcliPageIDName, pageID);
                        file.save();
                    } catch (error) {
                        alert.error(`${errorMessage} \n ${error}`);
                    }
                }
            });

            status.stop();
            alert.success('Files deployed successfully!')
        }).catch((err)=>{
            status.stop();
            alert.error(`API call failure - files weren\'t deployed successfully - see error details below. If you need to update your user/application token, you can run deployqb init again to reconfigure those values.\n\nQuick Base Response:`);

            if( err.response.statusText ) {
                alert.error(err.response.statusText);
            }
            
            if( err.response.data ) {
                alert.error(err.response.data);
            }

            if (err.response.config.data) {
                var errData = xmlparser.parse(err.response.config.data);
                var pageName = errData.qdbapi.pagename;
                alert.error(`Error Occurred for File: ${pageName}\n\n`);
            }
            
        });
    } else if (args._.includes(ENUMS.LAUNCH_PROD_CMD) || args._.includes(ENUMS.LAUNCH_FEAT_CMD) || args._.includes(ENUMS.LAUNCH_DEV_CMD)) {

        var pageId = null;
        var errorMessage = null;
        var repositoryId = null;
        var qbCLIConfigs = null;
        var queryString  = null;

        //make sure user is running this from the root of their react directory
        if ( !qbCliJsonExists ) {
            alert.error('This deployqb command can only be run from the root of your directory.');
            return;
        }

        //get repo ID
        repositoryId = existingQbCliConfigs.repositoryId;
        queryString  = existingQbCliConfigs.urlQueryString;

        //set correct pageID for prod/dev/feat
        if (args._.includes(ENUMS.LAUNCH_PROD_CMD) ) {
            pageId = existingQbCliConfigs.launchProdPageId;
            errorMessage = 'You must first deploy the production files to the Quick Base application before you can use this command.  Try running "deployqb prod" first.  If you have done that, then you need to set an "isIndexFile" in your qbcli.json to use this command (see npm docs).';
        } else if (args._.includes(ENUMS.LAUNCH_DEV_CMD) ) {
            pageId = existingQbCliConfigs.launchDevPageId;
            errorMessage = 'You must first deploy the development files to the Quick Base application before you can use this command.  Try running "deployqb dev" first. If you have done that, then you need to set an "isIndexFile" in your qbcli.json to use this command (see npm docs).';
        } else if (args._.includes(ENUMS.LAUNCH_FEAT_CMD)) {
            pageId = existingQbCliConfigs.launchFeatPageId;
            errorMessage = 'You must first deploy the feature files to the Quick Base application before you can use this command.  Try running "deployqb feat" first. If you have done that, then you need to set an "isIndexFile" in your qbcli.json to use this command (see npm docs).';
        }
        //get repo ID and files to push to prod
        if (!pageId) {
            alert.error(errorMessage);
            return;
        }
        //get configs stored from qbcli install
        const configs = configurationFile.get(repositoryId);
        if (!configs) {
            alert.error('Project may never have been initialized - please run deployqb init.');
            return;
        }
        const { dbid, realm } = existingQbCliConfigs;

        //add optional query string if present from qbcli.json
        if( queryString ) {
            queryString = encodeURI(`&${queryString}`);
        } else {
            queryString = '';
        }

        //launch the webpage
        opn(`https://${realm}.quickbase.com/db/${dbid}?a=dbpage&pageID=${pageId}${queryString}`);
    } else if (args._.includes(ENUMS.DEPLOYQB_HELP)) {
        alert.success('deployqb commands');
        console.log('init:        Initializes this project.');
        console.log('feat:        Deploys your files to the feature environment.');
        console.log('dev:         Deploys your files to the development environment.');
        console.log('prod:        Deploys your files to the production environment.');
        console.log('lfeat:       Open your feature environment in Quick Base with your default browser.');
        console.log('ldev:        Open your development environment in Quick Base with your default browser.');
        console.log('lprod:       Open your production environment in Quick Base with your default browser.');
        console.log('efeatprefix: Feature prefix is stored outside qbcli.json - this allows you to edit the Feature environment prefix.');
        console.log('genlinks:    Displays a list of possible links for each file in your project.\n');

    } else if (args._.includes(ENUMS.EDIT_DEV_PREFIX_CMD) || args._.includes(ENUMS.EDIT_PROD_PREFIX_CMD) || args._.includes(ENUMS.EDIT_FEAT_PREFIX_CMD)) {

        if (args._.includes(ENUMS.EDIT_DEV_PREFIX_CMD) || args._.includes(ENUMS.EDIT_PROD_PREFIX_CMD) ) {
            alert.warning('After running "deployqb init", you can update your dev and prod prefix in the qbcli.json file in the root of your project.  Only efeatprefix is still supported, as this prefix is saved outside the qbcli.json file.');
            return;
        }
        

        var prefixReference = null;
        

        //make sure user is running this from the root of their react directory
        if ( !qbCliJsonExists ) {
            alert.error('This deployqb command can only be run from the root of your directory.');
            return;
        }
        const { repositoryId } = existingQbCliConfigs;
        const configs = configurationFile.get(repositoryId);
        if (!configs) {
            alert.error('Project may never have been initialized - please run deployqb init.');
            return;
        }

        //get correct name for prefix
        if (args._.includes(ENUMS.EDIT_FEAT_PREFIX_CMD) ) {
            prefixReference = "customPrefixFeature";
        }

        //set the feature prefix
        alert.warning('Your current developer prefix is: ' + configs[prefixReference]);
        const input = await modifyPrefixInput.getInput();
        configs[prefixReference] = input.newPrefix;
        configurationFile.set(repositoryId, configs);
        alert.success('Your development prefix has been updated successfully.');
    } else if (args._.includes(ENUMS.GENERATE_LINKS_CMD)) {

        //make sure user is running this from the root of their react directory
        if ( !qbCliJsonExists ) {
            alert.error('This deployqb command can only be run from the root of your directory.');
            return;
        }
        const { repositoryId, filesConf, dbid } = existingQbCliConfigs;
        //get configs stored from qbcli install
        const configs = configurationFile.get(repositoryId);
        if (!configs) {
            alert.error('Project may never have been initialized - please run deployqb init.');
            return;
        }
        
        if( filesConf && filesConf.length > 0 ) {
            alert.warning('\nPOSSIBLE DEPENDENCY LINKS BASED ON YOUR QBCLI.jSON CONFIGS:');
            filesConf.forEach((file)=>{
                alert.soft('__________________________________________');
                const { filename } = file;
                console.log(filename + ':\n');
                console.log(`\t/db/${dbid}?a=dbpage&pagename=${filename}`);
                alert.soft('__________________________________________');
            });
        }
    }
  
}

run();





