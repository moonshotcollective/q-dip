const mongoose = require('mongoose')

const metaTxSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true
  },
  data: {
    type: String,
    required: true
  },
  electionId: {
    type: Number,
    required: true
  }
})

const MetaTx = mongoose.model('metaTx', metaTxSchema)

module.exports = { MetaTx }
