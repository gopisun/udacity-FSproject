
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import 'regenerator-runtime/runtime';

/*
FlightSuretyApp  = require('../../build/contracts/FlightSuretyApp.json');
Config = require('./config.json');
Web3 = require('web3');
express = require('express');
*/

async function handleOracleRequest(eventValues)  {
  console.log("In handleOracleRequest()");
  let oracleAddr = "";
  let indx3 = [];  // 3 indexes should be retrieved
  let rndNbr = 0;
  let resp = 0;

  // loop thro the oracles and fetch their indexes
  for (let i=0; i < NUM_ORACLES;i++)  {
    oracleAddr = oracles[i];
    // fetch the indexes from the smart contract
    indx3 = await flightSuretyApp.methods.getOracle(oracleAddr).call();
    console.log("After getOracle() call: " + indx3);

    if ((eventValues.index == indx3[0]) || (eventValues.index == indx3[1]) || (eventValues.index == indx3[2]))  {
      console.log("for oracle " + oracleAddr + " one of the index matched.  Generate response");
      // get a random number between 0 and 9.  Use it as key to obtain one of the canned responses.
      rndNbr = Math.floor(Math.random() * 10);
      console.log("Generated random number: " + rndNbr);

      // get one of the canned responses from map
      resp = orclRespMap.get(rndNbr);
      console.log("response to send: " + resp);
      console.log("index to send: " + eventValues.index);
      console.log("airlind to send: " + eventValues.airline);
      console.log("Timestamp to send: " + eventValues.timestamp);
      console.log("Flight to send: "+ eventValues.flight);
      
      try {
        await flightSuretyApp.methods.submitOracleResponse(eventValues.index,
                                                         eventValues.airline, 
                                                         eventValues.flight,
                                                         eventValues.timestamp, 
                                                         resp).send({"from": oracleAddr,
                                                                     "gas": 4712388,
                                                                     "gasPrice": 100000000000});
        console.log("Response sent to smart contract");
      }catch(e) {
        console.log("Error ooccured in submitOracleResponse(): " + e);
      }
    }
    else {
      console.log("indexes dont match.  Move to the next");
    }
  }
}



let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const NUM_ORACLES = 20;  // can be increased to 20 if desired.
let fee = 1000000000000000000;  // 10^18 wei is 1 ether.  Units are in wei

let oracles = [];

const orclRespMap = new Map();  // map to hold the response codes to be sent as partof oracle response.

orclRespMap.set(0,0);
orclRespMap.set(1,10);
orclRespMap.set(2,20);
orclRespMap.set(3,30);
orclRespMap.set(4,40);
orclRespMap.set(5,50);
orclRespMap.set(6,10);
orclRespMap.set(7,20);
orclRespMap.set(8,30);
orclRespMap.set(9,40);


// just for testing to force the oracle response to always as FLIGHT DELAYED -- 20.  This is to make sure insurance payout happens.
/*
orclRespMap.set(0,20);
orclRespMap.set(1,20);
orclRespMap.set(2,20);
orclRespMap.set(3,20);
orclRespMap.set(4,20);
orclRespMap.set(5,20);
orclRespMap.set(6,20);
orclRespMap.set(7,20);
orclRespMap.set(8,30);
orclRespMap.set(9,20);
*/

/*
flightSuretyApp.methods.getregistrationFee().call().then((regFee) => { 
  fee = regFee;
  console.log("Registration fee: " + fee);
  }).catch(err => {
    console.log("error getting reg fee: " + err);
  })
*/

/*
let fee = 1;
flightSuretyApp.methods.registerOracle().send({from: web3.eth.accounts[15], value: fee})
                                        .then((thenVal) => {console.log("thn val:" + thenVal)})
                                        .catch((catchVal) => {console.log("catch val: " + catchVal)})


*/

// There will be 29oracles. Load 12 address for the oracles from web3
console.log("here !");
web3.eth.getAccounts().then((accounts) => {
  // accounts is an array which will hold all the accounts that have been created in the etherum test server.
  // get the total number of accounts.  Use the last 12 for Oracle accounts.
  const oracleStartIndex = accounts.length - NUM_ORACLES;
  console.log("Number of accounts: " + accounts.length);
  for (let a = oracleStartIndex;a < accounts.length; a++)  {
      flightSuretyApp.methods.registerOracle().send({
        "from": accounts[a],
        "value": fee,
        "gas": 4712388,
        "gasPrice": 100000000000
      }).then( result => {
        // oracles registered
        console.log("oracle registered successfully: " + accounts[a]);
        oracles.push(accounts[a])
        flightSuretyApp.methods.getOracle(accounts[a]).call().then( rsltArr => {
          console.log("oracle retrieved. Indexes: "+ rsltArr[0] + rsltArr[1] + rsltArr[2]);
        });
      }).catch( err => {
        // oracle registration errored
        console.log("oracle registration errored out: " + err);
      })
  }

})


flightSuretyApp.events.OracleRequest({
    // fromBlock: 0 //"latest"    //  0
    fromBlock: 'latest'   
    // toBlock: "latest"
  }, async function (error, event) {
    if (error) console.log("got error: " + error)
    // console.log(event.returnValues.index)
    console.log("Event Received - Oracle Request: " + event.returnValues.index + " " 
                                                    + event.returnValues.airline + " "
                                                    + event.returnValues.flight + " "
                                                    + event.returnValues.timestamp);
    await handleOracleRequest(event.returnValues);
    console.log("Event OracleRequest handled."); 

});

flightSuretyApp.events.OracleReport({
    // fromBlock: 0 //"latest"    //  0
    fromBlock: 'latest'   
    // toBlock: "latest"
  }, async function (error, event) {
    if (error) console.log("got error: " + error)
    // console.log(event.returnValues.index)
    console.log("Event Received - Oracle Report: " + event.returnValues.status + " " 
                                                    + event.returnValues.airline + " "
                                                    + event.returnValues.flight + " "
                                                    + event.returnValues.timestamp);
    // await handleOracleRequest(event.returnValues);
    console.log("Event OracleReport handled."); 

});

flightSuretyApp.events.FlightStatusInfo({
    // fromBlock: 0 //"latest"    //  0
    fromBlock: 'latest'   
    // toBlock: "latest"
  }, async function (error, event) {
    if (error) console.log("got error: " + error)
    // console.log(event.returnValues.index)
    console.log("Event Received - Flight Status Info: " + event.returnValues.status + " " 
                                                        + event.returnValues.airline + " "
                                                        + event.returnValues.flight + " "
                                                        + event.returnValues.timestamp);
    // await handleOracleRequest(event.returnValues);
    console.log("Event FlightStatusInfo handled."); 

});


/*
flightSuretyApp.events.OracleRequest()
  .on('data', async function(event) {
    console.log("Event: " + event.index + " " + event.airline + " "+ event.flight + " "+ event.timestamp);
  })
  .on('error',async (error) => {
    console.log("Error: " + error);
  })
*/


const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})


export default app;


