/*
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
*/

FlightSuretyApp = require('../../build/contracts/FlightSuretyApp.json');
Config = require('./config.json');
Web3 = require('web3');

// hold the flightId  that is being registeredIt is passed in as first command line argument.
// Ex:  registerFlight AA404.  This will take the address at position 4 in accounts[]
let flightId;
let flightTime;


async function registerFlight()  {
    
    console.log("In registerFlight(): " + flightId);
    let airlineAddr = accountsArr[6];  // account 2 is the airling that is registering the flight
    let flightTime = new Date(2021, 9, 15, 17, 30, 0, 0).getTime()/1000;

    await flightSuretyApp.methods.registerFlight(flightId, flightTime).send({"from": airlineAddr, 
                                                                    "gas": 4712388,
                                                                    "gasPrice": 100000000000});
    console.log("In registerFlight - Flight registration done. ");
}

async function initialize()  {
    console.log("In initialize" );
    flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    accountsArr = await web3.eth.getAccounts();
    console.log("In initialize: " + accountsArr[0]);
    web3.eth.defaultAccount = accountsArr[0];
    console.log("In initialize - default account : " + web3.eth.defaultAccount);

    flightId = process.argv[2] ; 
    console.log("Flight Id: " + flightId);

}

async function wrapperFn()  {
    await initialize();
    console.log("In wrapper - default account: " + web3.eth.defaultAccount);
    await registerFlight();
}

//  Main
let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.HttpProvider(config.url));
let accountsArr = [];
let flightSuretyApp;
/**** 
web3.eth.getAccounts().then (accounts => { 
                                accountsArr = accounts; 
                                console.log("In promise: " + accounts[0]);
                                console.log("In promise: " + accountsArr[0]);
                                web3.eth.defaultAccount = accountsArr[0];
                            });
*****/
wrapperFn();
console.log("After invoking wrapperFn()")


