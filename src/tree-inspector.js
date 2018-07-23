const _ = require('lodash');
const mongodb = require('mongodb');

const {TreeNodeTypes} = require('./tree-types');
const {inspectRoles, inspectUsers, databaseInspector, inspectReplicaset, shardInspector} = require('./inspectors/');
class TreeInspector {
  constructor(driver) {
    this.driver = driver;
  }
  inspect() {
    const driver = this.driver;
    const proms = [this.inspectDatabases(),this.inspectUsers(),this.inspectRoles(),this.inspectReplicaMembers()];

    if (driver.topology.constructor == mongodb.Mongos) {
      console.log('inspect mongo os');
      proms.push(this.inspectShards());
      proms.push(this.inspectConfigs());
      proms.push(this.inspectMongos());
    }
    return new Promise((resolve, reject) => {
      Promise.all(proms).then(value => {
        const results = (value.filter(v => {
          return v !== null && v !== undefined;
        }));
        const dbs = _.find(results, i => i.type === TreeNodeTypes.DATABASE) || {databases:[]};
        const users = _.find(results, i => i.type === TreeNodeTypes.USERS) || {users:[]};
        const roles = _.find(results, i => i.type === TreeNodeTypes.ROLES) || {roles: []};
        const replicaset = _.find(results, i => i.type === TreeNodeTypes.REPLICASET) || {roles: []};
        const shards = _.find(results, i => i.type === TreeNodeTypes.SHARDS) || {roles: []};
        const configs = _.find(results, i => i.type === TreeNodeTypes.CONFIG) || {roles: []};
        const routers = _.find(results, i => i.type === TreeNodeTypes.ROUTER) || {roles: []};
        const tree = _.pickBy({
          databases: dbs.databases,
          users: users.users,
          roles: roles.roles,
          replicaset: replicaset.replicaset,
          shards: shards.shards,
          configs: configs.configs,
          routers: routers.routers
        }, v => v !== undefined && v !== null);
        resolve(tree);
      }).catch(err => {
        reject(err);
      });
    });
  }

  /**
   * discover all databases in a mongodb instance
   */
  inspectDatabases() {
    return databaseInspector.inspectDatabases(this.driver);
  }

  buildInfo() {
    return databaseInspector.buildInfo(this.driver);
  }

  serverStats() {
    return databaseInspector.serverStats(this.driver);
  }

  /**
   * query users from mongodb instance
   *
   * @param db
   */
  inspectUsers() {
    return inspectUsers(this.driver);
  }

  inspectRoles() {
    return inspectRoles(this.driver);
  }

  inspectReplicaMembers() {
    return inspectReplicaset(this.driver);
  }

  getCollectionAttributes(db, collection) {
    return databaseInspector.getCollectionAttributes(this.driver, db, collection);
  }

  inspectConfigs() {
    return shardInspector.inspectConfigs(this.driver);
  }

  inspectShards() {
    return shardInspector.inspectShards(this.driver);
  }

  inspectMongos() {
    return shardInspector.inspectMongos(this.driver);
  }
}

module.exports = TreeInspector;
