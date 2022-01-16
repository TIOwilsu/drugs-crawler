const mongoose = require("mongoose");
const { drugSchema, interactionSchema } = require("./schemas");

const Drug = mongoose.model("Drug", drugSchema);
const Interaction = mongoose.model("Interaction", interactionSchema);

module.exports = {
  Drug,
  Interaction,
};
