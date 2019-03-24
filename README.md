deployqb attempts to solve the copy/paste problem when trying to deploy your files to Quick Base.  This allows you to work locally on your files in your favorite text editor, then deploy those files to Quick Base using this CLI.

**Available Commands**

 - **deployqb init** - Run this from the root of your project to initialize the CLI tool. 
 - **deployqb dev** - Run this to deploy your code to Quick Base for the UAT environment. 
 - **deployqb prod** - Run this to deploy your code to Quick Base for the production environment. 
 - **deployqb ldev** - Launch the UAT environment in your default browser. 
 - **deployqb lprod** - Launch the Production environment in your default browser. 
 - **deployqb help** - Get the available commands.

## qbcli.json Setup
After running "deployqb init" - you will need to update your qbcli.json file that will be located in the root of your project to add your files and dependencies.  Below is an example of this:

	{
	"repositoryId": "121212",
	"conf": "ab954fa788be461caa00b4bc5",
	"filesConf": [
			{
				"filename": "main.7dff319d.css",
				"path": "./build/static/css/"
			},
			{
				"filename": "index.html",
				"path": "./build/",
				"dependancies": [
					0
				],
				"isIndexFile": true
			}
		]
	}

The "**filesConf**" above holds all of the files to be deployed to Quick Base.  You must list your file name and the file path as shown above.  If a file depends on another, you can add an optional "dependencies" array.  In this array, add the index of the file that this particular file depends on.  For instance, in the above setup, "index.html" depends on "main.7dff319d.css."

There is an additional flag **isIndexFile** you can add that will allow you to utilize the "**ldev**" and "**lprod**" commands.  You must set this to true for a single file above if you want to be able to launch the project from your command line.

## Dependencies
This tool allows you to add dependencies to Quick Base, and the tool will automatically update those dependencies and map them appropriately in Quick Base (for instance css files and js files).  In order for the tool to accomplish this, any file that depends on another must link to those file as if the files were already in Quick Base.  For example, in the above qbcli.json file, our "index.html" file has a css dependency.  In order for the dependency to work, the index.html file is set up as follows:

	<!doctype  html>
	<html  lang="en">
	<head>
		<meta  charset="utf-8">
		<meta  name="viewport"  content="width=device-width,initial-scale=1,shrink-to-fit=no">
		<title>MCF React Demo</title>
		<link  href="/db/<yourdbid>?a=dbpage&pagename=main.7dff319d.css"  rel="stylesheet">
	</head>
	<body>
		<h1>Dummy content</h1>
	</body>
	</html>

You can see the following dependency:

```/db/<yourdbid>?a=dbpage&pagename=main.7dff319d.css```

Notice the dependency is set up as if it was in Quick Base already and notice the name of the dependency **matches** the name in the qbcli.json above "main.7dff319d.css."  Dependencies in this tool assume you are linking to other dbpages (pagename=nameofyourdependency).  Note, **do not utilize** pageid when linking to your dependencies using this tool - or the system will not operate appropriately you must use pagename (pagename=main.css etc.). 




