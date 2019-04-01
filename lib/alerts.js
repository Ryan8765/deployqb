const chalk = require('chalk');


module.exports = {
   success: (message) => {
        console.log(chalk.green(`\n${message}\n`));
   },
   error: (message) => {
       console.log(chalk.red(`\n${message}\n`));
   },
   warning: (message) => {
       console.log(chalk.yellow(`\n${message}\n`));
   },
   soft: (message)=>{
       console.log(chalk.cyan(`${message}`));
   }
};