const { inspectUsers } = require('./user-inspector');
const {inspectRoles} = require('./role-inspector');
const databaseInspector = require('./database-inspector');
const {inspectReplicaset} = require('./replica-inspector');

module.exports = {databaseInspector, inspectRoles, inspectUsers, inspectReplicaset};
