const chalk = require('chalk');


module.exports = {
   success: (message) => {
        console.log(chalk.green(`\nmessage\n`));
   },
   error: (message) => {
       console.log(chalk.red(`\nmessage\n`));
   },
   warning: (message) => {
       console.log(chalk.red(`\nmessage\n`));
   }
};