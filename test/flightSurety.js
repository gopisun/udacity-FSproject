
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  var registeredAirlines;
  var gFlightKey;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational();
    console.log("status: "+ status);
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to just Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access should not be restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, false, "Access should not be blocked for requireIsOperational to owner");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  /*  write test cases for FlightSuretyData contract for the following scenarios
        1. authorizContract by contract onwer - should succeed
        2. authorizeContract by non contract owner - should fail
        3. authorizeContract when 'operational' is false - should fail
        4. deauthorizeContract by contract onwer - should succeed
        5. deauthorizeContract by non contract owner - should fail
        6. deauthorizeContract when 'operational' is false - should fail
        7. registerAirline by authorized contract (one of the registered airline) - should succeed
        8. registerAirline by non authorized contract  - should fail
        9. registerAirline when 'operational' is false - should fail
        10. getRegisteredAirlines by owner/authorized contract - should succeed
        11. getRegisteredAirlines by unauthorized contract & owner - should fail
        12. getRegisteredAirlines when either operational flag is set or not  - should succeed
        13. isAirlineRegistered by authorized conract - should succeed
        14. isAirlineRegistered by unauthorized conract - should fail
        15. isAirlineRegistered when either operational flag is set or not  - should succeed
        16. hasSenderVoted by authorized conract - should succeed
        17. hasSenderVoted by unauthorized conract - should fail
        18. hasSenderVoted when either operational flag is set or not  - should succeed
        19. getVotes by authorized contract - should succeed
        20. getVotes by unauthorized conract - should fail
        21. getVotes when either operational flag is set or not  - should succeed
        22. addVote by authorized conract - should succeed
        20. addVote by unauthorized conract - should fail
        21. addVote when  operational flag is set to false - should fail
        25.  Accept airline payment
        26. Register flight
  */
  
  it(`1 & 4 - authorizing & deauthorizing  a contract(app contract) to invoke methods in data contract`, async function () {

    // Get operating status
    let authorized = await config.flightSuretyData.isContractAuthorized(accounts[9]);
    console.log("authorized: " + authorized);
    assert.equal(authorized, false, "Inigtial authoriztion should be false");
    
    try {
        await config.flightSuretyData.authorizeContract(accounts[9]);
        authorized = await config.flightSuretyData.isContractAuthorized(accounts[9]);
    }
    catch(e) {
        console.log("Exception: " + e);
    }
    assert.equal(authorized, true, "authoriztion should be true");

    try {
        await config.flightSuretyData.deauthorizeContract(accounts[9]);
        authorized = await config.flightSuretyData.isContractAuthorized(accounts[9]);
    }
    catch(e) {
        console.log("Exception: " + e);
    }
    assert.equal(authorized, false, "authoriztion should be false");

  });

  it(`2 & 5 - authorizing and deauthorizing a contract(app contract) by non owner`, async function () {

    let authorizedSuccessful = false;
    
    try {
        await config.flightSuretyData.authorizeContract(accounts[9], {from:accounts[6]});
        authorizedSuccessful = true;
    }
    catch(e) {
        console.log("Exception: " + e);
        authorizedSuccessful = false;
    }
    assert.equal(authorizedSuccessful, false, "authoriztion should be false");
    
    
    try {
        await config.flightSuretyData.deauthorizeContract(accounts[9], {from:accounts[6]});  // excepton here
        authorizedSuccessful = true;
    }
    catch(e) {
        console.log("Exception during deauthorizeContract(96) : " + e);
        authorizedSuccessful = false;
    }
    assert.equal(authorizedSuccessful, false, "authoriztion should be false");
    
  });

  it(`3 - block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false); 

      let executed = true;
      try 
      {
          await config.flightSuretyData.authorizeContract(accounts[9], {from:accounts[0]});
      }
      catch(e) {
          executed = false;
      }
      assert.equal(executed, false, "Access should have been blocked - requireIsOperational set to false");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  /*
  it(`10, - getRegisteredAirlines() by owner`, async function () {

      await config.flightSuretyData.setOperatingStatus(true); 

      let executed = true;
      try 
      {
         registeredAirlines =  await config.flightSuretyData.getRegisteredAirlines({from:accounts[0]});
         
         config.flightSuretyData.getRegisteredAirlines({from:accounts[0]}).then((retArr) => { console.log("retArr: " + retArr);
                                                                                              registeredAirlines = retArr;
                                                                                              console.log("Registered airlines: " + registeredAirlines[0]);}
                                                                               );
         
         console.log("Registered airlines: " + registeredAirlines);
      }
      catch(e) {
          console.log("err pt A: ", e);
          executed = false;
      }
      assert.equal(executed, true, "executed by owner should succeed");      
      assert.equal(registeredAirlines, accounts[2], "One registered airline should have been returned");


      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });
  */

it(`7, 10, 13, - Airline registration - called by authorized Contract`, async function () {

      await config.flightSuretyData.setOperatingStatus(true); 
      await config.flightSuretyData.authorizeContract(accounts[9]);

      let executed = true;
      try 
      {
         await config.flightSuretyData.registerAirline(accounts[5],{from:accounts[9]});
         isAirlineRegistered =  await config.flightSuretyData.isAirlineRegistered(accounts[5],{from:accounts[9]});
         registeredAirlines = await config.flightSuretyData.getRegisteredAirlines({from:accounts[9]});
         console.log("isAirlineRegistered: " + isAirlineRegistered);
         console.log("checking Reg for: " + accounts[5] );
         console.log("registered airlines: " + registeredAirlines);
      }
      catch(e) {
          console.log("err pt A: ", e);
          executed = false;
      }
      assert.equal(executed, true, "executed by owner should succeed");      
      assert.equal(isAirlineRegistered, true, "One registered airline should have been returned");


      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it(`16-21, - Vote for registration - called by authorized Contract`, async function () {

      await config.flightSuretyData.setOperatingStatus(true); 
      await config.flightSuretyData.authorizeContract(accounts[9]);

      let executed = true;
      try 
      {
         let voted;
         let senderAddr = accounts[6];
         let airlineAddr = accounts[7]; 

         voted = await config.flightSuretyData.hasSenderVoted(senderAddr, airlineAddr, {from:accounts[9]});
         assert.equal(voted, false, "Not voted yet"); 

         await config.flightSuretyData.addVote(senderAddr, airlineAddr, {from:accounts[9]});   
         voted = await config.flightSuretyData.hasSenderVoted(senderAddr, airlineAddr, {from:accounts[9]});
         console.log("Voted: " + voted);
         assert.equal(voted, true, "Voter has voted."); 

         let votes = await config.flightSuretyData.getVotes(airlineAddr, {from:accounts[9]});
         assert.equal(votes[0], senderAddr, "invalid vote"); 
      }
      catch(e) {
          console.log("err pt B: ", e);
          executed = false;
          assert.equal(0,1,"failed");
      }
      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

it(`25, - accept registration payment from airline`, async function () {

      await config.flightSuretyData.setOperatingStatus(true); 
      await config.flightSuretyData.authorizeContract(accounts[9]);

      let executed = true;
      try 
      {
         let resultBuffer;
         let airlineAddr = accounts[7]; 
         const paymentAmount = 1;
         const regPaid = true;

         resultBuffer = await config.flightSuretyData.getAirline(airlineAddr, {from:accounts[9]});
         assert.equal(resultBuffer[2], false, "Not paid yet"); 
         assert.equal(resultBuffer[3], 0, "Paid amount should be 0"); 

         await config.flightSuretyData.acceptPayment(airlineAddr, paymentAmount, "DeltaAir",regPaid, {from:accounts[9]});   
         resultBuffer = await config.flightSuretyData.getAirline(airlineAddr, {from:accounts[9]});
         assert.equal(resultBuffer[2], true, "Registration paid"); 
         assert.equal(resultBuffer[3], 1, "Paid amount should be 1"); 
         assert.equal(resultBuffer[0], airlineAddr, "Incorrect airline addr");
         assert.equal(resultBuffer[1], "DeltaAir", "Incorrect airline name");  
         assert.equal(resultBuffer[4], false, "Registration status should be false"); 

      }
      catch(e) {
          console.log("err pt B: ", e);
          executed = false;
          assert.equal(0,1,"failed");
      }
      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  
  it(`26, - FlightSuretyData - register flight`, async function () {

      await config.flightSuretyData.setOperatingStatus(true); 
      await config.flightSuretyData.authorizeContract(accounts[9]);

      let executed = true;
      try 
      {
         let resultBuffer;
         let airlineAddr = accounts[7]; 
         let flightKey;
         // const flightId = web3.utils.fromUtf8("AA101");
         const flightId = "AA101";
         let flightTime = new Date(2021, 9, 15, 17, 30, 0, 0);

         console.log("flight ID: " + flightId);
         console.log("Flight time: " + flightTime.getTime()/1000);

         // get flight key for the flight id, airline and flight time combinathion
         flightKey = await config.flightSuretyApp.getFlightKey(airlineAddr,flightId, flightTime.getTime()/1000)
         console.log("Flight key: " + flightKey);

         
         resultBuffer = await config.flightSuretyData.getFlight(flightKey,{from:accounts[9]});
         console.log("reg flight before registering: " + resultBuffer[3]);
         assert.equal(resultBuffer[3], false, "Flight is not registered at this point");
        
        await config.flightSuretyData.registerFlight(airlineAddr, flightId, flightTime.getTime()/1000,{from:accounts[9]});

         
         resultBuffer = await config.flightSuretyData.getFlight(flightKey,{from:accounts[9]});
         console.log("reg flight AFTER registering: " + resultBuffer[3] + " " + resultBuffer[0]);
         assert.equal(resultBuffer[3], true, "Flight should have been regostered");
         
      }
      catch(e) {
          console.log("err pt Flight Register: ", e);
          executed = false;
          assert.equal(0,1,"failed");
      }
      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });


  /**********************************
   Test cases for FlightSuretyApp contract

   22. register 2nd airline
   23. register 5th airline - check if it is in the approval queue
   24. Get at least 2 approvals - the 5th airline should be moved from queue to registered map
   27. make registration payment
  ***************************** */

it(`27 , - Make payment for registration`, async function () {

      await config.flightSuretyApp.setOperatingStatus(true); 
      await config.flightSuretyData.authorizeContract(accounts[9]);
      // await config.flightSuretyData.registerAirline(accounts[2],{from:accounts[9]});

      let paid = false;
      let paymentAmount = web3.utils.toWei("10", "ether");
      let airlineName = "USAir";
      
      try 
      {
        const balBefore =  await web3.eth.getBalance(accounts[2]);
        console.log("account 2 balance prior to payment: " + await web3.eth.getBalance(accounts[2]));
        await config.flightSuretyApp.makeRegPayment(airlineName,{from:accounts[2], value:paymentAmount});
        const balAfter =  await web3.eth.getBalance(accounts[2]);
        console.log("account 2 balance after payment: " + await web3.eth.getBalance(accounts[2]));
        console.log("paid amount based on balBefore and balAfter: " + (Number(balBefore) - Number(balAfter)) );
        console.log("App contract balance: " + await web3.eth.getBalance(config.flightSuretyApp.address));
        
        let retBuff = await config.flightSuretyData.getAirline(accounts[2], {from:accounts[9]});
        console.log("Returned value of getAirline: " + retBuff[1]);
        paid = retBuff[2];
        assert.equal(paid, true, "airline should show as paid"); 
      }
      catch(e) {
          console.log("err pt E: ", e);
          executed = false;
          assert.equal(0,1,"failed");
      }
      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);
});

it(`22 , - Register 2nd airline`, async function () {

      await config.flightSuretyApp.setOperatingStatus(true); 
      await config.flightSuretyData.authorizeContract(accounts[9]);
      await config.flightSuretyData.registerAirline(accounts[2],{from:accounts[9]});

      let registered = true;
      try 
      {
        registered = await config.flightSuretyApp.isAirlineRegistered(accounts[1],{from:accounts[2]});
        assert.equal(registered, false, "airline should not be registered"); 
        await config.flightSuretyApp.registerAirline(accounts[1],{from:accounts[2]});
        registered = await config.flightSuretyApp.isAirlineRegistered(accounts[1],{from:accounts[2]});
        assert.equal(registered, true, "airline should  be registered");
      }
      catch(e) {
          console.log("err pt C: ", e);
          executed = false;
          assert.equal(0,1,"failed");
      }
      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);
});

it(`23, 24 , - Register 5th  airline`, async function () {

      await config.flightSuretyApp.setOperatingStatus(true); 
      await config.flightSuretyData.authorizeContract(accounts[9]);
      // await config.flightSuretyData.registerAirline(accounts[2],{from:accounts[9]});

      let registered = true;
      try 
      {
        await config.flightSuretyApp.registerAirline(accounts[1],{from:accounts[2]});
        await config.flightSuretyApp.registerAirline(config.testAddresses[0],{from:accounts[2]});
        // await config.flightSuretyApp.registerAirline(config.testAddresses[1],{from:accounts[2]});
        let regAirlines = await config.flightSuretyApp.getRegisteredAirlines({from:accounts[2]});
        console.log("registered airlines: " + regAirlines);
        
        assert.equal(regAirlines.length, 4, "airlines registered should be 4");

        // registering the 5th airline
        await config.flightSuretyApp.registerAirline(config.testAddresses[1],{from:accounts[2]});
        regAirlines = await config.flightSuretyApp.getRegisteredAirlines({from:accounts[2]});
        console.log("registered airlines: " + regAirlines);
        assert.equal(regAirlines.length, 4, "airlines registered should be 4 till ");
        
        let votes = await config.flightSuretyData.getVotes(config.testAddresses[1], {from:accounts[9]})
        
        assert.equal(votes.length, 1, "There should be only one vote.");

        // second vote for 5th airline
        await config.flightSuretyApp.registerAirline(config.testAddresses[1],{from:accounts[1]});
        regAirlines = await config.flightSuretyApp.getRegisteredAirlines({from:accounts[2]});
        console.log("registered airlines: " + regAirlines);
        votes = await config.flightSuretyData.getVotes(config.testAddresses[1], {from:accounts[9]})
        console.log("Votes : " + votes);
        assert.equal(regAirlines.length, 5, "airlines registered should be 5" );
      }
      catch(e) {
          console.log("err pt D: ", e);
          executed = false;
          assert.equal(0,1,"failed");
      }
      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);
});

/**********************************
   Test cases for FlightSuretyApp contract

   28. Register flight in flightSuretyApp
   29. Customer flight insurance purchase.
   
  ***************************** */

  it(`28, - Register flight using flightSuretyApp -`, async function () {

      await config.flightSuretyApp.setOperatingStatus(true); 
      await config.flightSuretyData.authorizeContract(accounts[9]);

      let executed = true;
      try 
      {
         let resultBuffer;
         let airlineAddr = accounts[5]; 
         let flightKey;
         
         const flightId = "AB101";
         let flightTime = new Date(2021, 9, 15, 17, 30, 0, 0);

         // get flight key for the flight id, airline and flight time combinathion
         flightKey = await config.flightSuretyApp.getFlightKey(airlineAddr,flightId, flightTime.getTime()/1000)
         gFlightKey = flightKey;
         
         resultBuffer = await config.flightSuretyData.getFlight(flightKey,{from:accounts[9]});
         assert.equal(resultBuffer[3], false, "Flight is not registered at this point");
        
         await config.flightSuretyApp.registerFlight(flightId, flightTime.getTime()/1000,{from:airlineAddr});

         resultBuffer = await config.flightSuretyData.getFlight(flightKey,{from:accounts[9]});
         assert.equal(resultBuffer[3], true, "Flight should have been regostered");
         
      }
      catch(e) {
          console.log("err pt Flight Register in App contract: ", e);
          executed = false;
          assert.equal(0,1,"failed");
      }

  });

  it(`29, - Customer Insurance purchase `, async function () {

      await config.flightSuretyApp.setOperatingStatus(true); 
      await config.flightSuretyData.authorizeContract(accounts[9]);

      let paymentAmount = web3.utils.toWei("1", "ether");

      let executed = true;
      try 
      {
         let resultBuffer;
         let airlineAddr = accounts[5]; 
         // let flightKey;
         
         const flightId = "AB101";
         let flightTime = new Date(2021, 9, 15, 17, 30, 0, 0);
         let flightTimeSC = flightTime.getTime()/1000;

         // get flight key for the flight id, airline and flight time combinathion
         // flightKey = await config.flightSuretyApp.getFlightKey(airlineAddr,flightId, flightTime.getTime()/1000)
         
         console.log("acc 22 balance before purchase: "  + await web3.eth.getBalance(accounts[22]));
         await config.flightSuretyApp.purchaseFlightInsurance(flightId, airlineAddr,flightTimeSC, {from:accounts[22], value:paymentAmount});
         const hasPurchased = await config.flightSuretyData.hasCustomerPaid(accounts[22], gFlightKey, {from:accounts[9]});
         console.log("Has purchased: " + hasPurchased);
         assert.equal(hasPurchased, true, "Insurance should be purchased");
         console.log("acc 22 balance after purchase: " + await web3.eth.getBalance(accounts[22]));
         console.log("Data contract balance: " + await web3.eth.getBalance(config.flightSuretyData.address));
         
      }
      catch(e) { 
          console.log("err at Insurance purchase: ", e);
          executed = false;
          assert.equal(0,1,"failed");
      }

  });




  /*
  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });
  */

});
