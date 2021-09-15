/*
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
*/

FlightSuretyApp = require('../../build/contracts/FlightSuretyApp.json');
Config = require('./config.json');
Web3 = require('web3');

async function submitFlightStatusRequest()  {
    
    let flightTime = new Date(2021, 10, 27, 19, 45, 0, 0);
    let flightTimeForContract = flightTime.getTime()/1000;
    const retVal = await flightSuretyApp.methods.fetchFlightStatus(accountsArr[1],  // airline
                                                                   "BA234",     // picked a random account for airline
                                                                   flightTimeForContract)
                                                                   .send({from: accountsArr[12]});  
    console.log("fetch flight status request submitted.  Event should be generated. Key = " + retVal);
        
    
}

async function initialize()  {
    flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    accountsArr = await web3.eth.getAccounts();
    web3.eth.defaultAccount = accountsArr[0];
}

async function wrapperFn()  {
    await initialize();
    await submitFlightStatusRequest()
}

const NUM_ORACLES = 20;
let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.HttpProvider(config.url));
let flightSuretyApp;
let accountsArr = [];
wrapperFn();


