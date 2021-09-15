/*
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
*/

FlightSuretyApp = require('../../build/contracts/FlightSuretyApp.json');
Config = require('./config.json');
Web3 = require('web3');

// hold the airline address that is making the payment.  It is passed in as first command line argument.
// Ex:  makeAirlineRegPayment 4.  This will take the address at position 4 in accounts[]
let airlineAddr;
let airlineName;  // derived from airlineAddr;  "Airline " + argv[2]

async function makeRegPayment()  {
    
    console.log("In makeRegPayment(): " + airlineAddr);
    let paymentAmount = web3.utils.toWei("10", "ether");
    await flightSuretyApp.methods.makeRegPayment(airlineName).send({"from": airlineAddr, 
                                                                    "value": paymentAmount,
                                                                    "gas": 4712388,
                                                                    "gasPrice": 100000000000});
    console.log("In makeRegPayment() - Registration payment made. ");
}

async function initialize()  {
    console.log("In initialize" );
    flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    accountsArr = await web3.eth.getAccounts();
    console.log("In initialize: " + accountsArr[0]);
    web3.eth.defaultAccount = accountsArr[0];
    console.log("In initialize - default account : " + web3.eth.defaultAccount);

    airlineAddr = accountsArr[process.argv[2]] ; 
    airlineName = "Airline " + process.argv[2];
    console.log("In initialize, airline address paseed in cmd line for registering: ", airlineAddr)

}

async function wrapperFn()  {
    await initialize();
    console.log("In wrapper - default account: " + web3.eth.defaultAccount);
    await makeRegPayment();
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


