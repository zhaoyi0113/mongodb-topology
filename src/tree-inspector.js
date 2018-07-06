const _ = require('lodash');
const mongodb = require('mongodb');

const {TreeNodeTypes} = require('./tree-types');
const {inspectRoles, inspectUsers, databaseInspector, inspectReplicaset} = require('./inspectors/');

class TreeInspector {
  constructor(driver) {
    this.driver = driver;
  }
  inspect() {
    const driver = this.driver;
    if (driver.topology.constructor == mongodb.Mongos) {
      console.log('inspect mongo os');
      return new Promise((resolve, reject) => {
        Promise.all([
          this.getAllShards(),
          this.getAllConfigs(),
          this.getAllMongos(),
          this.inspectDatabases(),
          this.inspectUsers(),
          this.inspectRoles(),
          this.inspectReplicaMembers()
        ])
          .then(value => {
            resolve(
              value.filter(v => {
                return v !== null && v !== undefined;
              })
            );
          })
          .catch(err => {
            reject(err);
          })
          .catch(err => {
            reject(err);
          });
      }).catch(err => {
        console.error('get error ', err);
      });
    }
    return new Promise((resolve, reject) => {
      Promise.all([
        this.inspectDatabases(),
        this.inspectUsers(),
        this.inspectRoles(),
        this.inspectReplicaMembers()
      ]).then(value => {
        const results = (value.filter(v => {
          return v !== null && v !== undefined;
        }));
        const dbs = _.find(results, i => i.type === TreeNodeTypes.DATABASE) || {databases:[]};
        const users = _.find(results, i => i.type === TreeNodeTypes.USERS) || {users:[]};
        const roles = _.find(results, i => i.type === TreeNodeTypes.ROLES) || {roles: []};
        const replicaset = _.find(results, i => i.type === TreeNodeTypes.REPLICASET) || {roles: []};
        const tree = _.pickBy({
          databases: dbs.databases,
          users: users.users,
          roles: roles.roles,
          replicaset: replicaset.replicaset
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

  getAllConfigs() {
    return new Promise(resolve => {
      const adminDB = this.driver.db(MongoShardsInspector.ADMIN_DB);
      const configTree = {
        text: 'Config Servers',
        children: []
      };
      adminDB
        .command({getShardMap: 1})
        .then(shardMap => {
          if (shardMap.map && shardMap.map.config) {
            const confHosts = shardMap
              .map
              .config
              .split('/')[1]
              .split(',');
            confHosts.map(conf => {
              configTree
                .children
                .push({text: conf, type: TreeNodeTypes.CONFIG});
            });
            resolve(configTree);
          }
        })
        .catch(err => {
          console.error('failed to get shard map ', err);
          resolve(configTree);
        });
    }).catch(err => {
      console.log('cant run get shard map command ', err);
    });
  }

  getAllShards() {
    return new Promise(resolve => {
      const collection = this.driver
        .db(MongoShardsInspector.CONFIG_DB)
        .collection(MongoShardsInspector.SHARDS_COLLECTION);
      collection
        .find({})
        .toArray((err, docs) => {
          const shardsTree = {
            text: 'Shards'
          };
          shardsTree.children = [];
          _.map(docs, doc => {
            const shards = doc
              .host
              .split(',');
            if (shards && shards.length > 1) {
              let shardRepName = '';
              const nameSplit = shards[0].split('/');
              if (nameSplit.length > 1) {
                shardRepName = nameSplit[0];
                shards[0] = nameSplit[1];
              }
              const shardTree = {
                text: shardRepName
              };
              shardTree.children = _.map(shards, shard => {
                return {text: shard, type: TreeNodeTypes.SHARD};
              });
              shardsTree
                .children
                .push(shardTree);
            } else {
              shardsTree
                .children
                .push({text: shards});
            }
          });
          return resolve(shardsTree);
        });
    }).catch(err => {
      console.error('get all shards error', err);
      throw new errors.BadRequest(err);
    });
  }

  getAllMongos() {
    return new Promise(resolve => {
      const collection = this.driver
        .db(MongoShardsInspector.CONFIG_DB)
        .collection(MongoShardsInspector.MONGOS_COLLECTION);
      collection
        .find({})
        .toArray((err, docs) => {
          const shardsTree = {
            text: 'Routers',
            children: []
          };
          _.map(docs, doc => {
            shardsTree
              .children
              .push({text: doc._id, type: TreeNodeTypes.MONGOS});
          });
          resolve(shardsTree);
        });
    }).catch(err => {
      console.error('get all mongos error', err);
      throw new errors.BadRequest(err);
    });
  }
}

module.exports = TreeInspector;
