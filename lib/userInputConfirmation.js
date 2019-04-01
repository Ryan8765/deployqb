const inquirer = require('inquirer');
// const files = require('./files');
const chalk = require('chalk');
const figlet = require('figlet');

module.exports = {

    getInput: ( deploymentType ) => {
        if ( deploymentType === 'prod' ) {
            //use figlet to add a good starting image on console
            console.log(chalk.yellow('\n*** YOU ARE ABOUT TO DEPLOY TO PRODUCTION ***'));
        } else {
            //use figlet to add a good starting image on console
            console.log(chalk.yellow('\n*** YOU ARE ABOUT TO DEPLOY TO DEV ***'));
        }

        const questions = [{
            name: 'answer',
            type: 'input',
            message: 'Are you sure you want to deploy (Enter "yes" or "no")?',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return '\nPlease provide an answer.';
                }
            }
        }];
        return inquirer.prompt(questions);
    },
}