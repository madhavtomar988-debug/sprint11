const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  image: {
  type: String,
},
});

module.exports = mongoose.model("Data", dataSchema);