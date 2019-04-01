const inquirer = require('inquirer');
const chalk = require('chalk');

module.exports = {
    getInput: () => {
        const questions = [
            {
                name: 'newPrefix',
                type: 'input',
                message: 'Enter a new prefix for your deployment:',
                validate: function (value) {
                    if (value.length) {
                        return true;
                    } else {
                        return '\nPlease a prefix';
                    }
                }
            }
        ];
        return inquirer.prompt(questions);
    },
}