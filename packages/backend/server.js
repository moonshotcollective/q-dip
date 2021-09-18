const fastify = require('fastify')({ logger: true })

const domainType = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "verifyingContract", type: "address" },
    { name: "salt", type: "bytes32" },
];
const metaTransactionType = [
    { name: "nonce", type: "uint256" },
    { name: "from", type: "address" },
    { name: "functionSignature", type: "bytes" }
];
// replace the chainId 42 if network is not kovan
let domainData = {
    name: "Diplomacy",
    version: "1",
    verifyingContract: config.contract.address,
    salt: ethers.utils.hexZeroPad((ethers.BigNumber.from(5)).toHexString(), 32)
};

let contract = new ethers.Contract(<CONTRACT_ADDRESS>,
              <CONTRACT_ABI>, biconomy.getSignerByAddress(userAddress));
let contractInterface = new ethers.utils.Interface(<CONTRACT_ABI>);

 /*
  This provider is linked to your wallet.
  If needed, substitute your wallet solution in place of window.ethereum
 */
walletProvider = new ethers.providers.Web3Provider(window.ethereum);
walletSigner = walletProvider.getSigner();

let nonce = await contract.getNonce(userAddress);
let functionSignature = contractInterface.encodeFunctionData("setQuote", [newQuote]);

let message = {};
message.nonce = parseInt(nonce);
message.from = userAddress;
message.functionSignature = functionSignature;

const dataToSign = JSON.stringify({
  types: {
    EIP712Domain: domainType,
    MetaTransaction: metaTransactionType
  },
  domain: domainData,
  primaryType: "MetaTransaction",
  message: message
});

/*Its important to use eth_signTypedData_v3 and not v4 to get EIP712 signature
because we have used salt in domain data instead of chainId*/
// Get the EIP-712 Signature and send the transaction
let signature = await walletProvider.send("eth_signTypedData_v3", [userAddress, dataToSign])
let { r, s, v } = getSignatureParameters(signature);

const getSignatureParameters = signature => {
  if (!ethers.utils.isHexString(signature)) {s
      throw new Error(
          'Given value "'.concat(signature, '" is not a valid hex string.')
      );
  }
  var r = signature.slice(0, 66);
  var s = "0x".concat(signature.slice(66, 130));
  var v = "0x".concat(signature.slice(130, 132));
  v = ethers.BigNumber.from(v).toNumber();
  if (![27, 28].includes(v)) v += 27;
  return {
      r: r,
      s: s,
      v: v
  };
};

fastify.get('/', async (request, reply) => {
  return 'Q-Dip API'
})

fastify.post('/election', async (request, reply) => {
  // Create a new election
  return
})

const start = async () => {
  try {
    await fastify.listen(3000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
