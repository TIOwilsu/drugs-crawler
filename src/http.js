const axios = require("axios");
const https = require("https");

const http = axios.create({
  baseURL: "https://www.drugs.com/",
  httpsAgent: new https.Agent({ keepAlive: true }),
  headers: { "Content-Type": "application/xml" },
});

module.exports = http;
