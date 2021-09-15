/*
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
*/

FlightSuretyApp = require('../../build/contracts/FlightSuretyApp.json');
Config = require('./config.json');
Web3 = require('web3');

let airlineAddr;

async function registerAirline()  {
    
    console.log("In registerAirline(): " + airlineAddr);

    await flightSuretyApp.methods.registerAirline(airlineAddr).send({"from": accountsArr[1], 
                                                                    "gas": 4712388,
                                                                    "gasPrice": 100000000000});
    console.log("In registerAirline - Airline registration done. ");
}

async function initialize()  {
    console.log("In initialize" );
    flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    accountsArr = await web3.eth.getAccounts();
    console.log("In initialize: " + accountsArr[0]);
    web3.eth.defaultAccount = accountsArr[0];
    console.log("In initialize - default account : " + web3.eth.defaultAccount);

    airlineAddr = accountsArr[process.argv[2]] ; 
    console.log("Airline addr: " + airlineAddr);
}

async function wrapperFn()  {
    await initialize();
    console.log("In wrapper - default account: " + web3.eth.defaultAccount);
    await registerAirline();
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


