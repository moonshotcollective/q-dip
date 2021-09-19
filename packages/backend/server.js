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
  const userNonce = parseInt(await diplomacyContract.getNonce(request.params.address).call(), 10)
  const pendingTxs = parseInt(await MetaTx.countDocuments({ from: request.params.address }), 10)
  return { address: request.params.address, nonce: userNonce + pendingTxs }
})

fastify.post('/metatx/:electionId', async (request, reply) => {

})

fastify.get('/metatx/:electionId', async (request, reply) => {

})

fastify.delete('/metatx/:electionId', async (request, reply) => {

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
