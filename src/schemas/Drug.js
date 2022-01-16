const { Schema } = require("mongoose");

module.exports = new Schema({
  name: String,
  url: String,
  urlDrugInterations: String,
  uses: Object,
  warnings: Object,
  dosage: Object,
  "side-effects": Object,
  "what-of-avoid": Object,
});
