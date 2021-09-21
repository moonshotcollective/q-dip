require('dotenv').config()
const fastify = require('fastify')({ logger: true })
const mongoose = require('mongoose')
const Web3 = require('web3')
const { MetaTx } = require('./models/metatx.js')
const diplomacyAbi = require('./config/EIP721Metatransaction.json')

const web3 = new Web3(process.env.RPC_URL)

const diplomacyContract = new web3.eth.Contract(diplomacyAbi,
  '0xC1C06B92d563879A8ef29C8DdD94214F5e98a429')

fastify.get('/', async (request, reply) => {
  return 'Q-Dip API'
})

fastify.get('/nonce/:address', async (request, reply) => {
  try {
    const userNonce = parseInt(await diplomacyContract.getNonce(request.params.address).call(), 10)
    const pendingTxs = parseInt(await MetaTx.countDocuments({ from: request.params.address }), 10)
    return { address: request.params.address, nonce: userNonce + pendingTxs }
  } catch (err) {
    fastify.log.error(err)
    return { statusCode: 400, message: err }
  }
})

fastify.get('/vote/:electionId/:address', async (request, reply) => {
  try {
    const hasVoted = await diplomacyContract.hasVoted(request.params.electionId, request.params.address)
    if (hasVoted) {
      return { electionId: request.params.electionId, address: request.params.address, voteStatus: true }
    }
    const metaTxVotes = await MetaTx.countDocuments({
      from: request.params.address,
      electionId:
      request.params.electionId
    })
    if (metaTxVotes > 0) {
      return { electionId: request.params.electionId, address: request.params.address, voteStatus: true }
    }
    return { electionId: request.params.electionId, address: request.params.address, voteStatus: false }
  } catch (err) {
    fastify.log.error(err)
    return { statusCode: 400, message: err }
  }
})

fastify.post('/metatx/:electionId', async (request, reply) => {
  try {
    const electionStatus = await diplomacyContract.getElectionById(request.params.electionId).call()
    if (!electionStatus.isActive) {
      throw new Error('Election is not active')
    }
    const { userAddress, functionSignature, sigR, sigS, sigV } = request.body
    const address = await web3.eth.accounts.recover(functionSignature, sigV, sigR, sigS)
    if (address !== userAddress) {
      throw new Error('Address does not match signature')
    }
    const isVoter = await diplomacyContract.canVote(request.params.electionId, userAddress)
    if (!isVoter) {
      throw new Error('Address not eligible to vote')
    }
    const hasVoted = await diplomacyContract.hasVoted(request.params.electionId, userAddress)
    if (hasVoted) {
      throw new Error('Address has already voted')
    }
    const metaTxVotes = await MetaTx.countDocuments({ from: userAddress, electionId: request.params.electionId })
    if (metaTxVotes > 0) {
      throw new Error('Address has already voted')
    }
    await MetaTx.create({
      from: userAddress,
      data: web3.eth.abi.encodeParameters(
        ['address', 'bytes', 'bytes32', 'bytes32', 'uint8'],
        [
          request.body.userAddress,
          request.body.functionSignature,
          request.body.sigR,
          request.body.sigS,
          request.body.sigV
        ]),
      electionId: request.params.electionId
    })
  } catch (err) {
    fastify.log.error(err)
    return { statusCode: 400, message: err }
  }
})

fastify.get('/metatx/:electionId', async (request, reply) => {
  try {
    const votes = await MetaTx.find({ electionId: request.params.electionId }, { _id: 0, __v: 0 }).lean()
    return { electionId: request.params.electionId, voteArray: votes }
  } catch (err) {
    fastify.log.error(err)
    return { statusCode: 400, message: err }
  }
})

fastify.delete('/metatx/:electionId', async (request, reply) => {
  try {
    const electionStatus = await diplomacyContract.getElectionById(request.params.electionId).call()
    if (electionStatus.isActive) {
      throw new Error('Election is still active')
    }
    await MetaTx.deleteMany({ electionId: request.params.electionId })
    return { statusCode: 200 }
  } catch (err) {
    fastify.log.error(err)
    return { statusCode: 400, message: err }
  }
})

const start = async () => {
  try {
    console.log('⬆️ Connecting to DB...')
    await mongoose.connect(process.env.DB_URL)
    console.log('🚀 Listening to requests on port 3000...')
    await fastify.listen(3000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
