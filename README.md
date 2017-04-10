# arrow2ParseMigrator
A tool to migrate ArrowDB data from Appcelerator to ParseServer database.

It uses standart Node+Express modules, so nothing special you need to do.

I did this project to migrate my "Easy Classic Games" mobile app, initially based on ArrowDB server, to Back4App.com Parse Server.

The structure of the project is quite simple: I have Users and users have Scores.
So, this script will get all my users (using an "admin" user, with privileges to read all users data, including email) from ArrowDB and will create them on Parse if they have some Scores stored.
For each user with Scores, will import every Score in Parse. That's all.

You can easily add your own schemas or modify the logic for your own purposes.

## Key files
* You need to provide your Arrow and Parse API KEYS: check the *keys.js* file
* You probably will need to change the logic of the imported objects to your own: check the *routes/start.js* file

## Run
To run the project locally, simply execute `npm start` inside the project folder

If you want to run in DEBUG mode:

* On Windows: `set DEBUG=arrow2parsemigrator:* & npm start`
* On Linux: `DEBUG=arrow2parsemigrator:* & npm start`
