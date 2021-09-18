# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

1. start ganache at port 8545 with 60 accounts, each with balance of atleast 200 ethers.
2. Deploy the smart contracts to ganache with the command - `truffle migrate`
3. Start the Oracle server with the command - `npm run server`.  This will simulate 20 oracle servers.  
   The oracles will get registered with the DLT application.  Oracle addresses are from accounts 41 to 60.
4. Start the dapp with the command - `npm run dapp`

## For End to End Scenarios
----------------------
Please note:  For end to end scenarios,  dapp is NOT used.  Instead client scritps have been provided.  The scripts are located at ./src/dapp

    1. getOracles.js:  Retrieves the registered oracles.  The oracles were registered when teh server process was started using `npm run server`.
                       
    2. makeAirlineRegPayment.js:  Used for making registration payment for an airline.  This has to be done prior to registering an airline.
            Usage: node src/dapp/makeAirlineRegPayment.js <accounts index>
                   Ex. for registration payment for airline with address[6], do
                        node src/dapp/makeAirlineRegPayment.js 6

    3. registerAirline.js: To register an airline.  This is done after the airline makes the payment
            Usage: 	node src/dapp/registerAirline.js <accounts index>
                    Ex. for registering an airline with address[6], do
                        node src/dapp/registerAirline.js 6

    4. registerFlight.js: Registering a flight.  This step is required for scheduling a flight.  Customers can purchase insurance only for
       scheduled flights.  This step is necessary for purchansing flight insurance.  The airline for the flight is hardcoded to accounts[6].
            Usage: node src/dapp/registerFlight.js <flight id>
                    Ex:  node src/dapp/registerFlight.js BA234

    4. purchaseInsurance.js:  for Customers to purchase flight insurance.
            Usage: node src/dapp/purchaseInsurance.js <customer address> <airline addr> <flight id> <flight timestamp>  <payment in ether>
                    wherever address is mentioned, it is the index of the location in the array accounts.
                    Ex. node src/dapp/purchaseInsurance.js 30 6 BA234 1634333400000 1

    5. fetchFlightStatus.js: for fetching the status of a specific flight.  This invokes the method in the app contract that emits an event,       
       that oracles are listening on, to getting flight status for a specific registered flight.  The listening oracles (simulated by the 
       server process) responds and invokes the submitOracleResponse method in the app contract.  The responses are random.  IF the necessary
       criteria are met i.e flight is delayed, insuress get a pay back.

## End to End scenario execution:
------------------------------
To execute an end to end scenario execute the following scripts in the sequence.

	1. Make registration fee for airline
		i. node src/dapp/makeAirlineRegPayment.js 6
	2. Register an airline
		i. node src/dapp/registerAirline.js 6
	3. Register a flight for the airline:
		i. node src/dapp/registerFlight.js BA234 (change the hardcoded airlineAddr to 6 (DONE) )
	4. Register 20 oracles.  - done when  oracle server process is started
	5. 5 customers purchasing insurance
		node src/dapp/purchaseInsurance.js 30 6 BA234 1634333400000 1
		node src/dapp/purchaseInsurance.js 31 6 BA234 1634333400000 1
		node src/dapp/purchaseInsurance.js 32 6 BA234 1634333400000 1
		node src/dapp/purchaseInsurance.js 33 6 BA234 1634333400000 1
		node src/dapp/purchaseInsurance.js 34 6 BA234 1634333400000 1
		
	6. Request flight status:
	Node src/dapp/fetchFlightStatus.js.  (need to change the hardcoded values in the code:  airline, flightId, flighttime (DONE) )




    
