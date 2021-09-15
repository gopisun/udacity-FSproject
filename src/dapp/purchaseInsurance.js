/*
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
*/

FlightSuretyApp = require('../../build/contracts/FlightSuretyApp.json');
Config = require('./config.json');
Web3 = require('web3');

// hold the airline address for the flightId.  It is passed in as first command line argument.
// Ex:  makeAirlineRegPayment 4.  This will take the address at position 4 in accounts[]
let customerAddr;  // pick a customer from address index 30-34
let airlineAddr; // from account index 1-9
let flightId; // flight for which insurance is purchasec
let flightTime; // flight time of the flight for which insurance is purchased
let insurancePremium; // insurance premium payment in ether

async function purchaseFlightInsurance()  {
    
    console.log("In purchaseFlightInsurance(): " + 
                    customerAddr + " " +
                    airlineAddr + " " + 
                    flightId + " " + 
                    flightTime + " " + 
                    insurancePremium);
    let paymentAmount = web3.utils.toWei(insurancePremium, "ether");
    await flightSuretyApp.methods.purchaseFlightInsurance(flightId,
                                                          airlineAddr,
                                                          flightTime/1000)
                                                          .send({"from": customerAddr, 
                                                                    "value": insurancePremium,
                                                                    "gas": 4712388,
                                                                    "gasPrice": 100000000000});
    console.log("In purchaseFlightInsurance() - Purchase Flight Insurance completed. ");
}

async function initialize()  {
    console.log("In initialize" );
    flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    accountsArr = await web3.eth.getAccounts();
    web3.eth.defaultAccount = accountsArr[0];
    console.log("In initialize - default account : " + web3.eth.defaultAccount);

    customerAddr = accountsArr[process.argv[2]]; 
    airlineAddr = accountsArr[process.argv[3]]; 
    flightId = process.argv[4]; 
    flightTime = process.argv[5]; 
    insurancePremium = web3.utils.toWei(process.argv[6], "ether");
    console.log("Initialization completed");
}


async function wrapperFn()  {
    await initialize();
    console.log("In wrapper - default account: " + web3.eth.defaultAccount);
    await purchaseFlightInsurance();
}

//  Main
let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.HttpProvider(config.url));
let accountsArr = [];
let flightSuretyApp;
wrapperFn().then( () => {console.log("After completing wrapperFn()")})
           .catch( (e) => {console.log("wrapper function errored out: " + e)});