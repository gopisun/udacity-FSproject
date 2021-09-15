/*
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
*/

FlightSuretyApp = require('../../build/contracts/FlightSuretyApp.json');
Config = require('./config.json');
Web3 = require('web3');

async function getOracles()  {
    // let orclAddr = '0x175e6F8fCbCe4F69325c1363AD31EBE2Da224009';
    console.log("In getOracles(): " + accountsArr[0]);
    let indexes = [];

    const oracleStartIndex = accountsArr.length - NUM_ORACLES;

    for (let a = oracleStartIndex;a < accountsArr.length; a++)  {
        const indexes = await flightSuretyApp.methods.getOracle(accountsArr[a]).call(/***** {from: accountsArr[0]}  default has already been set *****/);
        console.log("indexes: " + indexes + " " + indexes[0] + " " + indexes[1] + " " + indexes[2]);
    }

    
}

async function initialize()  {
    flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    accountsArr = await web3.eth.getAccounts();
    console.log("In initialize: " + accountsArr[0]);
    web3.eth.defaultAccount = accountsArr[0];
    console.log("In initialize - default account : " + web3.eth.defaultAccount);

}

async function wrapperFn()  {
    await initialize();
    console.log("In wrapper - default account: " + web3.eth.defaultAccount);
    await getOracles();
}

const NUM_ORACLES = 20;
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
wrapperFn().then( () => {console.log("After invoking wrapperFn()")});
// console.log("After invoking wrapperFn()")


/*
export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
}

*/