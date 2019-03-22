const inquirer = require('inquirer');
// const files = require('./files');
const chalk = require('chalk');
const figlet = require('figlet');

module.exports = {

    getInput: () => {
        //use figlet to add a good starting image on console
        console.log(chalk.yellow('\n*** YOU ARE ABOUT TO DEPLOY TO PRODUCTION ***'));

        const questions = [{
            name: 'answer',
            type: 'input',
            message: 'Are you sure you want to deploy to production (Enter "yes" or "no")?',
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