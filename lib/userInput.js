const inquirer = require('inquirer');
// const files = require('./files');
const chalk = require('chalk');
const figlet = require('figlet');
const { ary } = require('lodash');

module.exports = {

    getInput: async () => {
        
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
                type: 'input',
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
                type: 'input',
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

            },
            {
                name: 'devAndProdQuickBaseApplications',
                type: 'input',
                message: 'Do you have a development Quick Base application that is different than your production Quick Base application (Enter "yes" or "no")?',
                validate: function (value) {
                    if (value.length && (value === "yes" || value === "no")) {
                        return true;
                    } else {
                        return '\nPlease provide an answer.';
                    }
                }
            }
        ];
        var answers = await inquirer.prompt(questions);
        var devAnswers = {};
        if(answers.devAndProdQuickBaseApplications === "yes") {
            var devAnswers = await inquirer.prompt([
                {
                    name: 'devDbid',
                    type: 'input',
                    message: 'Enter the development Quick Base application DBID:',
                    validate: function (value) {
                        if (value.length) {
                            return true;
                        } else {
                            return '\nEnter the QB application DBID.';
                        }
                    }
                },
                {
                    name: 'devApptoken',
                    type: 'input',
                    message: 'Enter the development Quick Base Application Token:',
                    validate: function (value) {
                        if (value.length) {
                            return true;
                        } else {
                            return '\nPlease enter your Application Token.';
                        }
                    }
                },
                {
                    name: 'devUsertoken',
                    type: 'input',
                    message: 'Enter the development Quick Base application User Token:',
                    validate: function (value) {
                        if (value.length) {
                            return true;
                        } else {
                            return '\nPlease enter your User Token.';
                        }
                    }
                }
            ]);
        }

        return Promise.resolve({
            ...answers,
            ...devAnswers
        })
        
    },

    /** 
     * IF a user has already signed up - pass then a different set of questions.
    */
    getRevisedUserInput: async (existingQbCliConfig) => {

        //use figlet to add a good starting image on console
        console.log(
            chalk.yellow(
                figlet.textSync('Deploy QB', { horizontalLayout: 'full' })
            )
        );

        const questions = [{
            name: 'dbid',
            type: 'input',
            message: 'Enter the Quick Base application DBID or hit enter to accept the default shown:',
            default: `${existingQbCliConfig.dbid}`,
            validate: function (value) {
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
            message: 'Enter the Quick Base realm or hit enter to accept the default shown:',
            default: `${existingQbCliConfig.realm}`,
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return '\nPlease enter the Quick Base realm.';
                }
            }
        },
        {
            name: 'apptoken',
            type: 'input',
            message: 'Enter the Application Token:',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return '\nPlease enter your Application Token.';
                }
            }
        },
        {
            name: 'usertoken',
            type: 'input',
            message: 'Enter the User Token:',
            validate: function (value) {
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
            default: `${existingQbCliConfig.repositoryId}`,
            message: 'Enter the repository ID - or a unique numeric value for this project or hit enter to accept the default shown:',
            validate: function (value) {
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
            default: `${existingQbCliConfig.devPrefix}`,
            message: '(Optional) Enter a custom prefix to be used for UAT deployments or hit enter to accept the default shown.  If a blank value is entered, "D_" will be added to filenames for UAT deployments.'
        },
        {
            name: 'customPrefixProduction',
            type: 'text',
            default: `${existingQbCliConfig.prodPrefix}`,
            message: '(Optional) Enter a custom prefix to be used for Production deployments.  If a blank value is entered, "P_" will be added to filenames for Production deployments.'

        },
        {
            name: 'customPrefixFeature',
            type: 'text',
            message: '(Optional) Enter a custom prefix to be used for Feature deployments.  If a blank value is entered, "F_" will be added to filenames for Feature deployments.'

        },
        {
            name: 'devAndProdQuickBaseApplications',
            type: 'input',
            message: 'Do you have a development Quick Base application that is different than your production Quick Base application (Enter "yes" or "no")?',
            default: existingQbCliConfig.devAndProdQuickBaseApplications ? `${existingQbCliConfig.devAndProdQuickBaseApplications}` : 'no',
            validate: function (value) {
                if (value.length && (value === "yes" || value === "no")) {
                    return true;
                } else {
                    return '\nPlease provide an answer.';
                }
            }
        }
        ];
        var answers = await inquirer.prompt(questions);
        var devAnswers = {};
        if(answers.devAndProdQuickBaseApplications === "yes") {
            var devAnswers = await inquirer.prompt([
                {
                    name: 'devDbid',
                    type: 'input',
                    message: 'Enter the development Quick Base application DBID or hit enter to accept the default shown:',
                    default: existingQbCliConfig.devDbid ? `${existingQbCliConfig.devDbid}` : null,
                    validate: function (value) {
                        if (value.length) {
                            return true;
                        } else {
                            return '\nEnter the QB application DBID.';
                        }
                    }
                },
                {
                    name: 'devApptoken',
                    type: 'input',
                    message: 'Enter the development Quick Base Application Token:',
                    validate: function (value) {
                        if (value.length) {
                            return true;
                        } else {
                            return '\nPlease enter your Application Token.';
                        }
                    }
                },
                {
                    name: 'devUsertoken',
                    type: 'input',
                    message: 'Enter the development Quick Base application User Token:',
                    validate: function (value) {
                        if (value.length) {
                            return true;
                        } else {
                            return '\nPlease enter your User Token.';
                        }
                    }
                }
            ]);
        }
        

        return Promise.resolve({
            ...answers,
            ...devAnswers
        })
    }
}