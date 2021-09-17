// pragma solidity ^0.4.25;
pragma solidity ^0.8.0;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
import "./FlightSuretyData.sol";   // this is not required since interface is defined at the end of this file for reference.

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // operational flag
    bool private operational = true;

    // registration fee
    uint256 public constant registrationFee = 10 ether; 
    uint16 public constant PAYOUT_PERCENT = 150;
    
    // Flight status codes.  For status codes 20, 40, 50 airline pays out to the insured customer.
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract

    // reference to Data Contract
    FlightSuretyData private flightSuretyData;

    /**** moved  to Data Contract  
    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights;
    ***************/
 
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
        require(operational, "Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireRegisteredAirline()  {
        require(flightSuretyData.isAirlineRegistered(msg.sender),"Invalid caller - not registered");
        _;
    }
    /***** 
    modifier requireRegisteredAndPaidAirline()  {
        require(flightSuretyData.isAirlineRegisteredAndPaid(msg.sender),"Invalid caller - not registerede and paid");
        _;
    }
    *******/

    modifier requireFlightNotRegistered(string memory flightId, address airline, uint256 timestamp)  {
        string memory rflightId;
        uint256 flightTime;
        address airlineAddress;
        bool isRegistered;
        uint8 statusCode;

        bytes32 flightKey = getFlightKey(airline, flightId, timestamp);

        (rflightId, airlineAddress, flightTime, isRegistered, statusCode) = 
                        flightSuretyData.getFlight(flightKey);
        require(!isRegistered, "Flight already registered");
        _;
    }

modifier requireFlightRegistered(string memory flightId, address airline, uint256 timestamp)  {
        string memory rflightId;
        uint256 flightTime;
        address airlineAddress;
        bool isRegistered;
        uint8 statusCode;

        bytes32 flightKey = getFlightKey(airline, flightId, timestamp);

        (rflightId, airlineAddress, flightTime, isRegistered, statusCode) = 
                        flightSuretyData.getFlight(flightKey);
        require(isRegistered, "Flight not registered for insurance purchase");
        _;
    }

    modifier requireNotPaid()  {
        address airlineAddress;
        string memory airlineName;
        bool regPaid;
        bool isReg;
        uint256 paidAmt;
        (airlineAddress, airlineName, regPaid, paidAmt, isReg) = flightSuretyData.getAirline(msg.sender);
        require(regPaid == false, "Registration has been paid");
        _;
    }

    modifier requireRegAmount()  {
        require(msg.value >= 1, "Minimum of 1 ether required for registration amount");
        _;
    }

    modifier requireCustomerNotPaid(string memory flightId, address airline, uint256 flightTime) {
        bytes32 flightKey = getFlightKey(airline, flightId, flightTime);
        require(!flightSuretyData.hasCustomerPaid(msg.sender, flightKey));
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(address _flightSuretyData, address firstAirline)  
    {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(payable(_flightSuretyData));
        // flightSuretyData.authorizeContract(address(this));
        // flightSuretyData.authorizeContract(firstAirline); // done from deployment script
        // flightSuretyData.registerAirline(firstAirline); // done from deployment script
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() 
                            public  
                            view
                            returns(bool) 
    {
        return operational;  // Modify to call data contract's status
    }


    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   // Airline making payment for registration.  This method accepts payment from airlines for 
   // registration.  This is a prerequisite for registration.  Until airlines have paid, other
   // airline cannot propose to register an airline.

   function makeRegPayment(string memory airlineName) requireIsOperational
                                                      requireNotPaid
                                                      requireRegAmount

                             external
                             payable
    {
        uint256 paidAmount = msg.value;
        // registration amount required is 1 ether.  Return excess value
        uint256 surplus = paidAmount - registrationFee;
        // change state (effects)
        bool regPaid = true;
        flightSuretyData.acceptPayment{value: msg.value}(msg.sender, registrationFee, airlineName,regPaid);
        // do interaction 
        payable(msg.sender).transfer(surplus);
    }

  
   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function registerAirline(address airline) requireIsOperational requireRegisteredAirline external 
                            // returns(bool success, uint256 votes)
    {
        
        if (!flightSuretyData.isAirlineRegistered(airline))
        {
            // check the number of alirline registered
            if (flightSuretyData.getRegisteredAirlines().length < 4)
            {
                // register the airline
                flightSuretyData.registerAirline(airline);
            } 
            else 
            { 
                // reg airline count is >=4, put it in reg queue
                // if 50% of vote is there, then register the airline
                if (!flightSuretyData.hasSenderVoted(msg.sender, airline))
                {
                    // add the votef
                    flightSuretyData.addVote(msg.sender, airline);
                    // get the number of votes.  if > 50% of reg airlines, register the airline
                    uint voteCount = flightSuretyData.getVotes(airline).length;
                    uint regAirlineCount = flightSuretyData.getRegisteredAirlines().length;

                    // if (voteCount >= regAirlineCount/2) {
                    if ((voteCount*100)/regAirlineCount >= 50) {
                        // register the airline.  All conditions are satisfied
                        flightSuretyData.registerAirline(airline);
                        // TODO: clean (delete) the reg queue for the airline
                    }
                }

            }
        }
        // return (success, 0);
    }

    function isAirlineRegistered(address airline) requireRegisteredAirline view external returns(bool)
    {
        return flightSuretyData.isAirlineRegistered(airline);
    }

    function getRegisteredAirlines() requireRegisteredAirline view external returns(address[] memory)
    {
        return flightSuretyData.getRegisteredAirlines();
    }

   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight (string memory flightId, uint256 flightTime) 
                                requireIsOperational 
                                requireRegisteredAirline
                                requireFlightNotRegistered(flightId, msg.sender, flightTime)
                                external
    {
        address airlineAddress = msg.sender;
        flightSuretyData.registerFlight(airlineAddress, flightId, flightTime);
    }

    //  purchase insurance for a flight.  Customers call this method to purchase flight insurance
    function purchaseFlightInsurance(string memory flightId, 
                                     address airline, 
                                     uint256 flightTime)  
                                                requireIsOperational 
                                                // requireCustomerNotPaid(flightId, airline, flightTime)
                                               requireFlightRegistered(flightId, airline, flightTime) 
                                                external
                                                payable
    {
        bytes32 flightKey = getFlightKey(airline, flightId, flightTime);
       
        flightSuretyData.buy{value: msg.value}(flightKey, msg.sender, msg.value);
        // flightSuretyData.buy{value: msg.value}(getFlightKey(airline, flightId, flightTime), msg.sender, msg.value);
    }
    
   /**
    * @dev Called after oracle has updated flight status.  TODO: Determine the payouts if the flight was delayed
    *
    */  

    

    function processFlightStatus
                                (
                                    bytes32 requestKey,
                                    uint8 statusCode
                                )
                                internal
                                
    {
        
    
        uint256 premiumAmt;
        uint256 payoutAmt;
        // check if status code is 20, 40 or 50.  
        // For these status codes, payout needds to happen to the customer.
        // payout is 1.5 times.
        // fetch the customers who has insured for the flight.
        // multiply the paid amout by 1.5 and transfer ether from data contract to customer
        
        if (statusCode == 20 || statusCode == 40 || statusCode == 50)  {
            // get insured customer list
            address[] memory insuredCustomers = flightSuretyData.getInsuredCustomers(requestKey);
            
            // get the customer premium for each insured customer and make payment
            for (uint8 i; i< insuredCustomers.length; i++)  {
                premiumAmt = flightSuretyData.getCustomerPremium(insuredCustomers[i], requestKey);
                payoutAmt = (premiumAmt * PAYOUT_PERCENT)/100;
                flightSuretyData.makePayout(insuredCustomers[i],payoutAmt);
            }
        }

    }

    

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string  memory flight,
                            uint256 timestamp                            
                        )
                        external
                        returns(bytes32)
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));

        // my addtion to fix the compile problem
        /**** Gopi commented outto replance it idfferently for solidity v > 0.7.0 
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true,
                                                responses: newResponses
                                            });
        */
        // for solidity v0.7.0 and greater
        // initialize ResponseInfof for the request
        flightSuretyData.initializeRespInfo(key, msg.sender, index);
        /****** moved to Data str 
        ResponseInfo storage newResponseInfo = oracleResponses[key];
        newResponseInfo.requester = msg.sender;
        newResponseInfo.isOpen = true; 
        ****** */
        emit OracleRequest(index, airline, flight, timestamp);

        return key;
    } 


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3; 

    /**** data structures moved from here to Data Contract */


    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    event InsuredCustomers(address[] insuredCustomers);
    event RespEventCode(uint8 statusCode);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);

    modifier requireRegFee()
    {
        string memory messag = "Caller did not send registration fee of ";
        string memory regFee = string(abi.encodePacked(bytes32(REGISTRATION_FEE)));
        
        require(msg.value >= REGISTRATION_FEE, string(abi.encodePacked(messag, regFee)));
        _;
    }


    // Register an oracle with the contract.  
    function registerOracle
                            (
                            )
                            external
                            payable
                            requireRegFee
    {
        // Require registration fee.  Below line commented out.  Functionality moved to modifier
        // require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[] memory indexes = generateIndexes(msg.sender);

        flightSuretyData.registerOracle{value: msg.value}(msg.sender, indexes);
        
        /**** moved to Data Contract  
        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
        ****  moved to data contract *****/
    }

    // Obtain indexes for the given oracle
    function getOracle
                        (
                            address account
                        )
                        public
                        view
                        returns(uint8[] memory)
    {
        require(flightSuretyData.isOracleRegistered(account), "Oracle not registered");
        return flightSuretyData.getOracleIndexes(account);
    }

    function getMyIndexes
                            (
                            )
                            view
                            public
                            returns(uint8[] memory)
    {
        // require(oracles[msg.sender].isRegistered, "Not registered as an oracle"); 
        require(flightSuretyData.isOracleRegistered(msg.sender), "Oracle not registered");

        //  return oracles[msg.sender].indexes;   // moved to Data contract
        return flightSuretyData.getOracleIndexes(msg.sender);
        
        
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string memory flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        
        uint8[] memory orclIndexes = getOracle(msg.sender);
        require((orclIndexes[0] == index) || (orclIndexes[1] == index) || (orclIndexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 

         // ensure the index receives is the same as the index associated with the flight status request 
         
         uint8 reqIndex = flightSuretyData.getRequestIndex(key);
         // require(oracleResponses[key].index == index, "index received is not the index in flight status request");
         require(reqIndex == index, "index received is not the index in flight status request");
        
        bool reqOpen = flightSuretyData.isRequestOpen(key); // should be either open or close .  If close do nothing
        require(reqOpen,"No longer open for response");
        // add the oracle's response
        flightSuretyData.addOrclResponse(key, msg.sender, statusCode);
        // oracleResponses[key].responses[statusCode].push(msg.sender);  // moved to Data Contract
        

        // emit an event for each valid response received.
        emit OracleReport(airline, flight, timestamp, statusCode);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        address[] memory orclResponses =  flightSuretyData.getOrclResponses(key, statusCode);
        if (orclResponses.length >= MIN_RESPONSES) {
            
            // close the request
            flightSuretyData.closeOrclResponse(key);   // close the request.  No further responses will be accepted.
            
            // Handle flight status as appropriate.. 
            // processFlightStatus(key, statusCode);  //  BUG was here.  See the description belowmoved to Data contract
            processFlightStatus(getFlightKey(airline, flight, timestamp), statusCode);
            // flightSuretyData.creditInsurees(key, statusCode);  // THIS WAS THE BUG.  WAS HARD TO FIND WITHOUT THE console output in truffle.  Used hardhat to identify it.
            // flightSuretyData.creditInsurees(getFlightKey(airline, flight, timestamp), statusCode); 
            
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        public
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[] memory)
    {
        uint8[] memory indexes = new uint8[](3);
        indexes[0] = getRandomIndex(account);
        /*
        indexes.push(getRandomIndex(account));
        indexes.push(getRandomIndex(account));
        indexes.push(getRandomIndex(account));
        */
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        if (random == 0) { random = 4;}

        return random;
    }

// endregion

}   

/*

// add reference to FlightData Contract.  Similar to itnerface
interface FlightSuretyData   {

    // add all the public functions here

    function registerAirline(address airline) external;
    function buy() external payable;
    function creditInsurees() external;
    function pay() external;
    function fund() external payable;
    function getFlightKey(address airline, string memory flight, uint256 timestamp) external returns(bytes32);
}

*/
/***** Before refactoring 
function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string memory flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 

         // ensure the index receives is the same as the index associated with the flight status request 
        require(oracleResponses[key].index == index, "index received is not the index in flight status request");
        require(oracleResponses[key].isOpen,"No longer open for response");
        

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // emit an event for each valid response received.
        emit OracleReport(airline, flight, timestamp, statusCode);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);
            oracleResponses[key].isOpen = false;  // close the request.  No further responses will be accepted.

            // Handle flight status as appropriate.. TODO
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }




*************** */