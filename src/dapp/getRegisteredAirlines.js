/*
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
*/

FlightSuretyData = require('../../build/contracts/FlightSuretyData.json');
Config = require('./config.json');
Web3 = require('web3');


async function getRegisteredAirlines()  {
    
    console.log("In getRegisteredAirlines(). " );

    let registeredAirlines = await flightSuretyData.methods.getRegisteredAirlines().call({"from": accountsArr[0], 
                                                                    "gas": 4712388,
                                                                    "gasPrice": 100000000000});
    console.log("registerAirlines: " + registeredAirlines);
}

async function initialize()  {
    console.log("In initialize" );
    flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
    accountsArr = await web3.eth.getAccounts();
    console.log("In initialize: " + accountsArr[0]);
    web3.eth.defaultAccount = accountsArr[0];
    console.log("In initialize - default account : " + web3.eth.defaultAccount);

}

async function wrapperFn()  {
    await initialize();
    console.log("In wrapper - default account: " + web3.eth.defaultAccount);
    await getRegisteredAirlines();
}

//  Main
let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.HttpProvider(config.url));
let accountsArr = [];
let flightSuretyData;
/**** 
web3.eth.getAccounts().then (accounts => { 
                                accountsArr = accounts; 
                                console.log("In promise: " + accounts[0]);
                                console.log("In promise: " + accountsArr[0]);
                                web3.eth.defaultAccount = accountsArr[0];
                            });
*****/
wrapperFn().then( () => {console.log("After invoking wrapperFn()")})
            .catch( (e) => {console.log("wrapperFn() errored out: ", e)});
// console.log("After invoking wrapperFn()")


