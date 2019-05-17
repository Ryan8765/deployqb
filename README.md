## Install

    npm install -g deployqb

## Overview

deployqb attempts to solve the copy/paste problem when trying to deploy your files to Quick Base.  This allows you to work locally on your files in your favorite text editor, then deploy those files to Quick Base using this CLI.  It allows complex file/folder structures locally when developing - and flattens the dependencies for Quick Base automatically.

**Available Commands**

 - **deployqb init**        - Run this from the root of your project to initialize the CLI tool.
 - **deployqb feat**        - Run this to deploy your code to Quick Base for the Feature environment. 
 - **deployqb dev**         - Run this to deploy your code to Quick Base for the Development environment. 
 - **deployqb prod**        - Run this to deploy your code to Quick Base for the production environment.
 - **deployqb lfeat**       - Launch the Feature environment in your default browser. 
 - **deployqb ldev**        - Launch the Developer environment in your default browser. 
 - **deployqb lprod**       - Launch the Production environment in your default browser.
 - **deployqb efeatprefix** - Edit Feature environment prefix.
 - **deployqb edevprefix**  - Deprecated - change your dev prefix in the qbcli.json file in the root of your project.
 - **deployqb eprodprefix** - Deprecated - change your prod prefix in the qbcli.json file in the root of your project.
 - **deployqb genlinks**    - Displays a list of possible links for each file in your project.
 - **deployqb help**        - Get the available commands.

## qbcli.json Setup
After running "deployqb init" - you will need to update your qbcli.json file that will be located in the root of your project to add your files and dependencies.  Below is an example of this:

```json
{
	"urlQueryString": "<optional query string appended to url when using ldev, lfeat, lprod commands>",
	"repositoryId": "<unique identifier for your project - must be unique across all projects!>",
	"prodPrefix": "<your production prefix>",
	"devPrefix": "<your development prefix>",
	"dbid": "<your quick base dbid>",
	"realm": "<your quick base realm>",
	"filesConf": [
		{
			"filename": "index.css",
			"path": "./build/css/"
		},
		{
			"filename": "index.html",
			"path": "./",
			"dependencies": [
				0
			],
			"isIndexFile": true
		}
	]
}
```

The "**filesConf**" above holds all of the files to be deployed to Quick Base.  You must list your file name and the file path as shown above.  The file path is the path from your qbcli.json (the root of your project) to your file of interest that needs to be deployed (this is the file path in your local project).  For instance, the "index.css" above is in the './build/css/' folder locally.

If a file depends on another, you can add an optional "dependencies" array.  In this array, add the index of the file that this particular file depends on.  For instance, in the above setup, "index.html" depends on "index.css" (the 0 index item in the filesConf array).

There is an additional flag **isIndexFile** you can add that will allow you to utilize the "**ldev**" and "**lprod**" commands.  You must set this to true for a single file above if you want to be able to launch the project from your command line.

## Dependencies
This tool allows you to add dependencies to your files, and the tool will automatically update those dependencies and map them appropriately in Quick Base (for instance css files and js files).  In order for the tool to accomplish this, any file that depends on another must link to those files as if the files were already in Quick Base.  For example, in the above qbcli.json file, our "index.html" file has a css dependency.  In order for the dependency to work, the index.html file is set up as follows:

```html
<!doctype  html>
<html  lang="en">
<head>
	<meta  charset="utf-8">
	<meta  name="viewport"  content="width=device-width,initial-scale=1,shrink-to-fit=no">
	<title>Demo</title>
	<link  href="/db/<yourdbid>?a=dbpage&pagename=index.css"  rel="stylesheet">
</head>
<body>
	<h1>Dummy content</h1>
</body>
</html>
```

You can see the following dependency:

```/db/<yourdbid>?a=dbpage&pagename=index.css```

Notice the dependency is set up as if it was in Quick Base already and notice the name of the dependency **matches** the name in the qbcli.json above "index.css."  Dependencies in this tool assume you are linking to other dbpages (pagename=nameofyourdependency).  Note, **do not utilize** pageid when linking to your dependencies using this tool - or the system will not operate appropriately you must use pagename (pagename=main.css etc.).  Use the command **"deployqb genlinks"** to see a list of possible links you can use for your dependencies based on your configurations in your qbcli.json filesConf array.


## Environments/Deployment Types

This tool allows you to deploy to 3 different "environments" - or to deploy your application into three separate code bases for testing purposes when taking code live in Quick Base.  Those 3 environments are:

 1. **Production** - Your production environment for your application. 
 2. **Development** - Your development environment for your application.
 3. **Feature** - If you're working on a large team - this feature environment allows you to test your specific feature changes before aggregating those changes in the "Development" environment with other team for your next release to production.

Each one of these environments separates the code in Quick Base with filename prefix's that you set when you run 'deployqb init'.  When running "deployqb init", you will be prompted to enter a unique repository ID or a unique number.  If you're working on a team - each team member will want to add the same unique repository ID, developer prefix, and production prefix.  This will assure that when you deploy to Quick Base, the same dbpages are being updated throughout your team.

**Feature Environment**

If you're not working in a team for your particular project - the Production/Development environments should suffice for your needs and the "feature" deployment will likely not be used.

The Feature environment allows two or more people on a team to collaborate on the same code base.  With a team of two or more, a team member can work on their own "Feature" branch and deploy to Quick Base with the "deployqb feat" command.  When their work is done and tested on the feature branch, they can then merge to the development branch (you can think of development as a "release" branch in this case).  When the teams changes are ready to deploy to production in the development environment, you can then merge to master and deploy to production.  

An important note about "Feature" prefix's - your prefix should be unique among your teams feature prefix's - if they are not unique, you will overwrite team members feature environments within Quick Base.  Example:

Team Member 1 Feature Prefix - "modal"
Team Member 2 Feature Prefix - "modal"

When team member 1 & team member 2 deploy to Quick Base they will overwrite each others work.

## Optional Query String
In the qbcli.json file you can add an optional "urlQueryString."  If present, when you run the commands "deployqb ldev", "deployqb lprod" and "deployqb lfeat", the query string will be appended to the URL.  Example:

    "urlQueryString": "rid=348&fid=324"

This will append the above query string to the URL's when launching.

## Final Note
DO NOT use this tool on public computers.  User tokens and and application tokens are managed by Keychain, Secret Service API/libsecret or the Credential Vault on windows.





