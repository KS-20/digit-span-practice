# digit-span-practice

# Setting up a development environment

Checkout the code:

> git clone git@github.com:KS-20/digit-span-practice.git

install npm packages:

> npm install

Run the server:

> npm start

Running selenium based gui test:

> node src/gui_test.js

To run custom storage server , make sure mysql is running , set the needed environment variables in the .env file and execute:

>npm run productionserverstart

to kill it:

>pm2 kill
