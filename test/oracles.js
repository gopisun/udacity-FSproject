
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

// user truffle assertions for  truffle v5 to handle events.  
const truffleAssert = require('truffle-assertions');


contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 20;

  // Watch contract events
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;


  var config;
  var expected_reg_fee = web3.utils.toWei("1", "ether");
  let eventIndex = 0; // value of event.index for OracleRequest Event

  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
    await config.flightSuretyData.registerAirline(config.firstAirline);

    

  });


  it('can register oracles', async () => {
    
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
    console.log("fee for registration: " + fee);
    assert(Number(fee) == Number(expected_reg_fee), "Not the expected registration fee");

    // ACT
    for(let a=40; a< (40+TEST_ORACLES_COUNT); a++) {      
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      
      
      let result= await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
      assert.equal(((result[0] != result[1]) && (result[1] != result[2]) && (result[0] != result[2])), true, "Not registered. Expectged to be registered");
    }
  });

  it('can request flight status', async () => {
    
    // ARRANGE
    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.now() / 1000);

    // get the registered airlines
    let registeredAirlines = await config.flightSuretyData.getRegisteredAirlines();
    console.log("Registered Airlines: "+ registeredAirlines);

    // Flight needs to be regist3ered and customers purchase insurance prior to fetchFlightStatus. Customer accounts: 30-34
    await config.flightSuretyApp.registerFlight(flight, timestamp,{from:config.firstAirline});

    let paymentAmount = web3.utils.toWei("1", "ether");
    await config.flightSuretyApp.purchaseFlightInsurance(flight, config.firstAirline,timestamp, {from:accounts[30], value:paymentAmount});
    await config.flightSuretyApp.purchaseFlightInsurance(flight, config.firstAirline,timestamp, {from:accounts[31], value:paymentAmount});
    await config.flightSuretyApp.purchaseFlightInsurance(flight, config.firstAirline,timestamp, {from:accounts[32], value:paymentAmount});
    await config.flightSuretyApp.purchaseFlightInsurance(flight, config.firstAirline,timestamp, {from:accounts[33], value:paymentAmount});
    await config.flightSuretyApp.purchaseFlightInsurance(flight, config.firstAirline,timestamp, {from:accounts[34], value:paymentAmount});

    // Submit a request for oracles to get status information for a flight
    let tx = await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp, {from: accounts[0]});
    // ACT
    // check if the event was emitted
    truffleAssert.eventEmitted(tx, 'OracleRequest', (event) => {

            console.log("Event - index for the flight request: " + event.index);
            eventIndex = event.index
            // return ev.param1 === 1 && ev.param2 === farmerAddress;
            return (event.flight == flight) && (event.timestamp == timestamp);
        
    });
    console.log("Data contract balance before  response: " + await web3.utils.fromWei(await web3.eth.getBalance(config.flightSuretyData.address)));

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a=40; a< (40+TEST_ORACLES_COUNT); a++) {

      // Get oracle information
      
     // let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
      //for(let idx=0;idx<3;idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          let tx2 = await config.flightSuretyApp.submitOracleResponse(eventIndex, config.firstAirline, flight, timestamp, 20 ,{ from: accounts[a] });
          console.log("Submit response success: " + tx2 );

          truffleAssert.eventEmitted(tx2, 'OracleReport', (event) => {
            console.log("Event OracleReport - eventCode " + event.airline + " " + event.status);
            return (true);
           });

           truffleAssert.eventEmitted(tx2, 'FlightStatusInfo', (event) => {
            console.log("Event FlightStatusInfo -  " + event.airline + " " + event.status + " " + event.flight + " " + event.timestamp);
            return (true);
           });

          truffleAssert.eventEmitted(tx2, 'PayoutMade', (event) => {

            console.log("Event PayoutMade - customer ID: " + event.customerId);
            console.log("Event PayoutMade - customer payout amojunt: " + event.payoutAmt);
           
            // return ev.param1 === 1 && ev.param2 === farmerAddress;
            return (true);
        
          });
          truffleAssert.eventEmitted(tx2, 'RespEventCode', (event) => {
            console.log("Event RespEventCode - eventCode " + event.eventCode);
            return (true);
           });
           truffleAssert.eventEmitted(tx2, 'InsuredCustomers', (event) => {
            console.log("Event InsuredCustomers - InsuredCustomers:" + event.insuredCustomers);
            return (true);
           });

        }
        catch(e) {
          // Enable this when debugging
           // console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
           //console.log('\nError:', accounts[a]);
           // console.log(e);
        }

    //  }
    }
    console.log("Data contract balance after response: " + await web3.utils.fromWei(await web3.eth.getBalance(config.flightSuretyData.address)));


  });


 
});
