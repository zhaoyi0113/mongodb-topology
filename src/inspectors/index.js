const { inspectUsers } = require('./user-inspector');
const {inspectRoles} = require('./role-inspector');
const {inspectDatabases} = require('./database-inspector');

module.exports = {inspectDatabases, inspectRoles, inspectUsers};
