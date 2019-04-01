const inquirer = require('inquirer');
// const files = require('./files');
const chalk = require('chalk');
const figlet = require('figlet');

module.exports = {

    getInput: () => {
        
        //use figlet to add a good starting image on console
        console.log(
            chalk.yellow(
                figlet.textSync('Deploy QB', { horizontalLayout: 'full' })
            )
        );

        const questions = [{
                name: 'dbid',
                type: 'input',
                message: 'Enter the Quick Base application DBID:',
                validate: function(value) {
                    if (value.length) {
                        return true;
                    } else {
                        return '\nEnter the QB application DBID.';
                    }
                }
            },
            {
                name: 'realm',
                type: 'input',
                message: 'Enter the Quick Base realm:',
                validate: function(value) {
                    if (value.length) {
                        return true;
                    } else {
                        return '\nPlease enter the Quick Base realm.';
                    }
                }
            },
            {
                name: 'apptoken',
                type: 'password',
                message: 'Enter the Application Token:',
                validate: function(value) {
                    if (value.length) {
                        return true;
                    } else {
                        return '\nPlease enter your Application Token.';
                    }
                }
            },
            {
                name: 'usertoken',
                type: 'password',
                message: 'Enter the User Token:',
                validate: function(value) {
                    if (value.length) {
                        return true;
                    } else {
                        return '\nPlease enter your User Token.';
                    }
                }
            },
            {
                name: 'repositoryId',
                type: 'text',
                message: 'Enter the repository ID - or a unique numeric value for this project:',
                validate: function(value) {
                    if (value.length) {
                        return true;
                    } else {
                        return '\nPlease the repository ID';
                    }
                }
            },
            {
                name: 'customPrefix',
                type: 'text',
                message: '(Optional) Enter a custom prefix to be used for UAT deployments.  If left blank a "D_" will be added to filenames for UAT deployments.'
            },
            {
                name: 'customPrefixProduction',
                type: 'text',
                message: '(Optional) Enter a custom prefix to be used for Production deployments.  If left blank a "P_" will be added to filenames for Production deployments.'
                
            },
            {
                name: 'customPrefixFeature',
                type: 'text',
                message: '(Optional) Enter a custom prefix to be used for Feature deployments.  If left blank a "F_" will be added to filenames for Feature deployments.'

            }
        ];
        return inquirer.prompt(questions);
    },
}