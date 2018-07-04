const { inspectUsers } = require('./user-inspector');
const {inspectRoles} = require('./role-inspector');
const {inspectDatabases} = require('./database-inspector');
const {inspectReplicaset} = require('./replica-inspector');

module.exports = {inspectDatabases, inspectRoles, inspectUsers, inspectReplicaset};
