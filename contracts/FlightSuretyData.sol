// pragma solidity ^0.4.25;
pragma solidity ^0.8.0;

import "../node_modules/openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
// import "truffle/Console.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => bool) private authorizedContracts;                       // list of contracts that are authorized to invoke methods of this contract

    //for testing
    mapping(address => bool) private regAirlines;

    // airline info.  For future use if required to store more than just the address of airline.
    struct Airline  {
        string airlineName;
        address airlineAddress;
        bool isRegistered;
        bool registrationPaid;
        uint256 regPaidAmount;
    }

    struct AirlinesRegistered {
        mapping(address => bool) registeredAirlines; 
        // TODO:  above mapping -refator to  use Airline str to track payment
        address[] arrRegAirlines; // = new address[](4);
        mapping(address => Airline) airlineDetails; // TODO:  Think.  It may need to be taken out
    }

    mapping(address => Airline) airlineDetails; 

    AirlinesRegistered airlinesRegistered;

    struct AirRegQueue {
        address airlineAddress; // TODO - refactor with str Airline
        mapping(address => bool) voters;
        address[] votersArr; // = new address[](2);
    }
    mapping(address => AirRegQueue) airRegQueues;  // airline address mapped to the structure that keep tracks of multi signtures.

    struct FlightInfo {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
        string flightId;
    }
    mapping(bytes32 => FlightInfo) private flightsInfo; // flightId mapped to flight info

    struct CustomerPayment {  // this is used to  for each insurance purchase  tracked to a flight id.
        address customerId;
        uint256 payAmount;
        bool insurancePaid;
    }

    struct InsPayment  {
        mapping (address => uint256) customerInsPurchase;  // customer address mapped to a payment amount
        CustomerPayment[] custInsDetails;  // Array of customers who had purchased insurance 
    }

    mapping (bytes32 => InsPayment) flightInsurancePayments;  // key is airline+glight+timestamp

    // data structures for Oracle management

    struct Oracle {
        bool isRegistered;
        uint8[] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        uint8 index;
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

 /**** end data structures for oracle management */

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event PayoutMade(address customerId, uint256 payoutAmt);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor() 
    {
        contractOwner = msg.sender;
        
    }

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

    // this modifier may not be needed at all
    modifier requireRegisteredAirline()
    {
        require(airlinesRegistered.registeredAirlines[msg.sender], 
                "Caller is not a registered airline");
        _;
    }

    modifier requireAuthorizedContract()
    {
        require(authorizedContracts[msg.sender],"Not an authorized caller");
        _;
    }

    modifier requireAuthorizedContractOrOwner()
    {
        require((authorizedContracts[msg.sender]) || ((keccak256(abi.encodePacked(contractOwner))) == (keccak256(abi.encodePacked(msg.sender)))),"Not an authorized caller or contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }

    // authorize contracts to call this contract methods
    function authorizeContract(address _address)   requireIsOperational requireContractOwner external {
        authorizedContracts[_address] = true;

    }

    // deauthorize contracts to call this contract methods
    function deauthorizeContract(address _address) requireIsOperational requireContractOwner  external {
        authorizedContracts[_address] = false;

    }

    // check for authorized contracts
    function isContractAuthorized(address _address)  
                    requireContractOwner  
                    public
                    view 
                    returns(bool) {
        bool authStatus = authorizedContracts[_address];
        return authStatus;
        // return true;


    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
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

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(address airlineAddress) requireIsOperational 
                                                     // requireAuthorizedContract 
                                                     requireAuthorizedContractOrOwner
                                                     external    
    {
        airlinesRegistered.registeredAirlines[airlineAddress] = true;
        airlinesRegistered.arrRegAirlines.push(airlineAddress);
        
        // for test
        // regAirlines[airlineAddress] = true;
                
    }

    function getRegisteredAirlines()  requireAuthorizedContractOrOwner  view external returns(address[] memory  )
    {
        address[] memory retArrVal = airlinesRegistered.arrRegAirlines;
        return retArrVal;
       
    }

    function getFirstRegisteredAirlines()    view external returns(address )
    {
        return airlinesRegistered.arrRegAirlines[0];
    }

    function isAirlineRegistered(address airlineAddress) requireAuthorizedContractOrOwner view external returns(bool)
    {
        return airlinesRegistered.registeredAirlines[airlineAddress];
        // return regAirlines[airlineAddress];
    }

    /*
    function isAirlineRegisteredAndPaid(address airlineAddress) requireAuthorizedContractOrOwner view external returns(bool)
    {
        // return airlinesRegistered.registeredAirlines[airlineAddress];

        return (airlinesRegistered.registeredAirlines[airlineAddress] && 
                airlinesRegistered.airlineDetails[airlineAddress].paid);
        
        
        // return regAirlines[airlineAddress];
    }
    */

    function hasSenderVoted(address sender, address airline) requireAuthorizedContract  view external  returns(bool)
    {
        return airRegQueues[airline].voters[sender];
    }

    function addVote(address sender, address airline) requireIsOperational requireAuthorizedContract external
    {
        AirRegQueue storage airRegQ = airRegQueues[airline];
        airRegQ.airlineAddress = airline;
        airRegQ.voters[sender] = true;
        airRegQ.votersArr.push(sender);
    }

    function getVotes(address airline)  requireAuthorizedContract view external returns(address[] memory)
    {
        AirRegQueue storage airRegQ = airRegQueues[airline];
        return airRegQ.votersArr;
    }

    //airline making payment to get registered.  Payment is a prerequisite for registration
    function acceptPayment(address airlineAddress, 
                           uint256 paymentAmt, 
                           string memory airlineName,
                           bool regPaid) requireAuthorizedContract 
                                         requireIsOperational
                                         external
                                         payable
    {
        Airline storage airline = airlineDetails[airlineAddress];
        airline.airlineName = airlineName;
        airline.airlineAddress = airlineAddress;
        airline.registrationPaid = regPaid;
        airline.regPaidAmount = airline.regPaidAmount.add(paymentAmt);
    }

    function getAirline(address airlineAddress) requireAuthorizedContract 
                                                view
                                                public
                        returns(address, string memory, bool, uint256, bool )
    {
        // Airline storage airline = _getAirline(airlineAddress);
        Airline storage airline = airlineDetails[airlineAddress];
        return (airline.airlineAddress,
                airline.airlineName,
                airline.registrationPaid,
                airline.regPaidAmount,
                airline.isRegistered);
    }

    function _getAirline(address airlineAddress) private view
                                                 returns(Airline memory)
    {
        Airline storage airline = airlineDetails[airlineAddress];
        return airline;
    }
                                            
    // registering a flight.  Insurance can be purchased for a registered flight only.

    function registerFlight(address airlineAddress, string memory flightId, uint256 flightTime) 
                                                                    requireAuthorizedContract 
                                                                    requireIsOperational
                                                                    external
                                                                    returns(bytes32)
    {

         bytes32 flightKey = keccak256(abi.encodePacked(airlineAddress, flightId, flightTime));
        
        FlightInfo storage flightInfo = flightsInfo[flightKey];
        flightInfo.flightId = flightId;
        flightInfo.airline = airlineAddress;
        flightInfo.updatedTimestamp = flightTime;
        flightInfo.isRegistered = true;

        return flightKey;

    }

    // retrun a specific flight requested by the flightId
    
    function getFlight(bytes32 flightKey) 
                                        requireAuthorizedContract 
                                        requireIsOperational
                                        external
                                        view
            returns( string memory , address , uint256 , bool , uint8 )
    {
        FlightInfo storage flightInfo = flightsInfo[flightKey];
        
        string memory rFlightId = flightInfo.flightId;
        address airlineAddress = flightInfo.airline;
        uint256 flightTime = flightInfo.updatedTimestamp;
        bool isRegistered = flightInfo.isRegistered;
        uint8 statusCode = flightInfo.statusCode;
        return (rFlightId, airlineAddress, flightTime, isRegistered, statusCode);
    }
    

   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy(bytes32 flightKey, address customerId, uint256 payAmount) requireIsOperational requireAuthorizedContract
                            external
                            payable
    {
        InsPayment storage insurancePayment = flightInsurancePayments[flightKey];
       
        CustomerPayment memory newCustPayment;
        newCustPayment.customerId = customerId;
        newCustPayment.payAmount = payAmount;
        newCustPayment.insurancePaid = true;

        insurancePayment.customerInsPurchase[customerId] = payAmount;
        insurancePayment.custInsDetails.push(newCustPayment);

    }
/**** 
    function getFlightInsurancePayments(string memory flightId)  requireIsOperational requireAuthorizedContract view internal
                                                        returns(Payment[] memory)
    {

    }

    function getCustomerInsurancePayments(address customerId) requireIsOperational requireAuthorizedContract view internal 
                                                        returns(Payment[] memory)
    {

    }
****/
    
    function hasCustomerPaid(address customerId, bytes32 flightKey) 
                            requireAuthorizedContract 
                            requireIsOperational 
                            view public returns(bool)
    {
        uint256 payAmt = flightInsurancePayments[flightKey].customerInsPurchase[customerId];
        if (payAmt > 0) 
            return true;
        else
            return false;
    }

    function getCustomerPremium(address customerId, bytes32 flightKey) 
                            requireAuthorizedContract 
                            requireIsOperational 
                            view public returns(uint256)
    {
        uint256 payAmt = flightInsurancePayments[flightKey].customerInsPurchase[customerId];
        return payAmt;
    }


    function getInsuredCustomers(bytes32 flightKey)
                           requireAuthorizedContract 
                            requireIsOperational 
                            view external returns(address[] memory)
    {
        CustomerPayment[] memory insPayments = flightInsurancePayments[flightKey].custInsDetails;
        address[] memory insuredCustomers = new address[](insPayments.length);
        for (uint i = 0; i < insPayments.length;i++) {
            insuredCustomers[i] = insPayments[i].customerId;
        }
        return insuredCustomers;
    }

    
    
    function makePayout(address customerId, uint256 payoutAmt)
                            requireAuthorizedContract 
                            requireIsOperational 
                            external 
                            payable
    {
        payable(customerId).transfer(payoutAmt);
        emit PayoutMade(customerId, payoutAmt);
    }



    /***** Methods to manage oracle data strutures */
    function registerOracle(address orclAddr, uint8[] memory indexes)
                            requireAuthorizedContract 
                            requireIsOperational 
                            public 
                            payable
    {
       /*
        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
        */

        Oracle storage newOracle = oracles[orclAddr];
        newOracle.isRegistered = true;
        newOracle.indexes = indexes;
    }

    function getOracleIndexes(address orclAddr)
                            requireAuthorizedContract 
                            requireIsOperational 
                            public view
                            returns(uint8[] memory)
    {
        return oracles[orclAddr].indexes;
    }

    function isOracleRegistered(address orclAddr)
                            requireAuthorizedContract 
                            requireIsOperational 
                            public view
                            returns(bool)
    {
        return oracles[orclAddr].isRegistered;
    }    
    
    function initializeRespInfo(bytes32 reqKey, address requestorAddress, uint8 index)
                            requireAuthorizedContract 
                            requireIsOperational 
                            external 
    {
        
        ResponseInfo storage newResponseInfo = oracleResponses[reqKey];
        newResponseInfo.requester = requestorAddress;
        newResponseInfo.isOpen = true; 
        newResponseInfo.index = index;

    }
    
    function getRequestIndex(bytes32 key)
                            requireAuthorizedContract 
                            requireIsOperational 
                            public view
                            returns(uint8)
    {
        return oracleResponses[key].index ;
    }   
    
    function isRequestOpen(bytes32 key)
                            requireAuthorizedContract 
                            requireIsOperational 
                            public view
                            returns(bool)
    {
        return oracleResponses[key].isOpen ;
    } 

    function addOrclResponse(bytes32 key, address orclAddr, uint8 statusCode)
                            requireAuthorizedContract 
                            requireIsOperational 
                            external 
                            
    {
        oracleResponses[key].responses[statusCode].push(orclAddr);
    } 

    function getOrclResponses(bytes32 key, uint8 statusCode)
                            requireAuthorizedContract 
                            requireIsOperational 
                            public view
                            returns(address[] memory)
    {
        return oracleResponses[key].responses[statusCode];
    }    

    function closeOrclResponse(bytes32 key)        
                            requireAuthorizedContract 
                            requireIsOperational 
                            external 
    {
        oracleResponses[key].isOpen = false;
    }              


    /*********** */

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(bytes32 requestKey, uint8 statusCode) 
                                requireIsOperational
                                requireAuthorizedContract 
                                external
                                payable

    {
        address custAddr;
        uint256 payoutAmt = 100;
        
        // for testing
        emit PayoutMade(custAddr, payoutAmt);
        payoutAmt = 0;

        if (statusCode == 20 || statusCode == 40 || statusCode == 50)  {
            // credit Insurees
            CustomerPayment[] memory insPayments = flightInsurancePayments[requestKey].custInsDetails;
            
            // for testing
            emit PayoutMade(custAddr, insPayments.length);

            for (uint i = 0; i < insPayments.length;i++) {
                custAddr = insPayments[i].customerId;
                payoutAmt = (insPayments[i].payAmount*150)/100;
                payable(custAddr).transfer(payoutAmt);
                emit PayoutMade(custAddr, payoutAmt);
            }
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() requireIsOperational
                            external
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund() requireIsOperational
                            public
                            payable
    {
    }

    function getFlightKey 
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    fallback() external payable requireIsOperational {  fund(); }


}

