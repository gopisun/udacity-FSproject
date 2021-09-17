const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = async function(deployer, network, accounts) {

    let firstAirline = '0x07832006Ca82e0e0BCFf20cC0eA50A85FB1E5724';
    let secondAirline = '0xB91189D2075A29555455eE5728a71Cf33F6c7Ef0';
    await deployer.deploy(FlightSuretyData)
    .then(async () => {
        return await deployer.deploy(FlightSuretyApp, FlightSuretyData.address, firstAirline)
                .then(() => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:8545',
                            dataAddress: FlightSuretyData.address,
                            appAddress: FlightSuretyApp.address
                        }
                    }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                });
    });

    let flightSuretyData = await FlightSuretyData.deployed();
    await flightSuretyData.authorizeContract(FlightSuretyApp.address);
    await flightSuretyData.authorizeContract(accounts[0]);

    firstAirline = accounts[1];
    secondAirline = accounts[2];

    await flightSuretyData.registerAirline(firstAirline, {from: accounts[0]});
    // await flightSuretyData.deauthorizeContract(accounts[0]);

    console.log("FlightSuretyData address: " + FlightSuretyData.address);
    console.log("FlightSuretyApp address: "+ FlightSuretyApp.address);
    console.log("registered Airline: " + await flightSuretyData.getRegisteredAirlines());
    console.log("END OF DEPLOYMENT.");

    // let flightSuretyApp = await FlightSuretyApp.deployed();
    // await flightSuretyApp.registerAirline(secondAirline, {from: accounts[0]});
}