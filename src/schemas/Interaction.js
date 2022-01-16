const { Schema } = require("mongoose");

module.exports = new Schema({
  key: {
    type: Object,
    default: {
      a: Schema.Types.ObjectId,
      b: Schema.Types.ObjectId,
    },
  },
  description: String,
  status: String,
  url: String,
});
