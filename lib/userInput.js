const inquirer = require('inquirer');
// const files = require('./files');
const chalk = require('chalk');
const figlet = require('figlet');

module.exports = {

    getInput: () => {
        
        //use figlet to add a good starting image on console
        console.log(
            chalk.yellow(
                figlet.textSync('QB Deploy', { horizontalLayout: 'full' })
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
                message: 'Enter the repository ID:',
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
                message: 'Please enter a custom prefix for all your files for UAT/dev deployments.'
            }
        ];
        return inquirer.prompt(questions);
    },
}