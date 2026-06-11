// Alias para /api/test-drive via redirect de netlify.toml
const apiTestDrive = require("./api-test-drive");

exports.handler = apiTestDrive.handler;
