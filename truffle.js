var HDWalletProvider = require("truffle-hdwallet-provider");
//var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
var mnemonic = "hamster bright bullet wing gun wall front often together bracket actress style";


module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: '*',
      gas: 6666666
    },
    developmentOld: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: '*',
      gas: 6666666
    },
    dev2: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:6545/", 0, 70);
      },
      network_id: '*',
      gas: 9999999
    }
  },
  compilers: {
    solc: {
      // version: "^0.4.24"
      version: "^0.8.0"
    }
  }
};