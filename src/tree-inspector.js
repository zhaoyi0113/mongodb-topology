const _ = require('lodash');
const mongodb = require('mongodb');

const { inspectUsers } = require('./user-inspector');

const {treeNodeTypes} = require('./tree-types');

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
        const dbs = _.find(results, i => i.databases !== undefined) || {databases:[]};
        const users = _.find(results, i => i.users !== undefined) || {users:[]};
        const roles = _.find(results, i => i.roles !== undefined) || {roles: []};
        resolve({
          databases: dbs.databases,
          users: users.users,
          roles: roles.roles,
        })
      }).catch(err => {
        reject(err);
      });
    });
  }

  /**
   * discover all databases in a mongodb instance
   */
  inspectDatabases() {
    const adminDb = this.driver.db('admin').admin();
    return new Promise((resolve, _reject) => {
      const inspectResult = {
        databases: []
      };
      adminDb
        .listDatabases()
        .then(dbs => {
          const promises = [];
          // inspect into each database
          dbs
            .databases
            .map(database => {
              promises.push(this.inspectDatabase(this.driver, database.name));
            });
          Promise
            .all(promises)
            .then(values => {
              inspectResult.databases = _.sortBy(values, 'name');
              resolve(inspectResult);
            })
            .catch(err => {
              console.error('failed to inspect database ', err);
            });
        })
        .catch(err => {
          console.warn(err.message);
          this
            .inspectDatabase(this.driver, adminDb.databaseName)
            .then(value => {
              inspectResult.children = [value];
              resolve(inspectResult);
            });
        });
    }).catch(err => {
      console.error('get error ', err);
      return new Error(err);
    });
  }

  /**
   * inspect the given database
   *
   * @param db  the database driver instance
   * @param name  the name of the database need to be inspected.
   * @returns {Promise} resolve the databse json object
   */
  inspectDatabase(db, name) {
    return new Promise(resolve => {
      db
        .db(name)
        .collections()
        .then(collections => {
          const dbData = {
            name,
            type: treeNodeTypes.DATABASE
          };
          dbData.children = _.map(collections, col => {
            return {name: col.collectionName, type: treeNodeTypes.COLLECTION};
          });
          dbData.children = _.sortBy(dbData.children, 'name');
          return {dbData, collections};
        })
        .then(value => {
          const promises = [];
          const {dbData} = value;
          value
            .collections
            .map(col => {
              promises.push(this.inspectIndex(col, _.find(dbData.children, {name: col.collectionName})));
            });
          return Promise
            .all(promises)
            .then(() => {
              resolve(dbData);
            });
        });
    });
  }

  /**
   * inspect the index under a collection
   *
   * @param db  db driver instance
   * @param col the collection instance
   */
  inspectIndex(col, data) {
    return new Promise(resolve => {
      col.indexes((err, indexes) => {
        if (!indexes) {
          resolve();
          return;
        }
        const idx = indexes.filter(index => {
          return index.name !== '_id_';
        });
        const result = idx.map(index => {
          return {name: index.name, type: treeNodeTypes.INDEX};
        });
        if (result.length === 0) {
          resolve(null);
        } else {
          data.children = result;
        }
        resolve();
      });
    }).catch(err => {
      console.error('failed to get index', err);
    });
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
    const adminDb = this.driver.db('admin').admin();
    const allRoles = {
      text: 'Roles',
      children: []
    };
    return new Promise(resolve => {
      const promises = [];
      adminDb
        .listDatabases()
        .then(dbs => {
          _.map(dbs.databases, currentDb => {
            promises.push(this.inspectDBRoles(this.driver, currentDb));
          });
          Promise
            .all(promises)
            .then(values => {
              allRoles.roles = values
                .filter(roles => {
                  return !roles.roles.length <= 0;
                });
              resolve(allRoles);
            });
        })
        .catch(err => {
          console.warn(err.message);
          resolve(allRoles);
        });
    }).catch(err => {
      console.error('get error ', err);
      return allRoles;
    });
  }

  inspectDBRoles(driver, currentDb) {
    return new Promise(resolve => {
      const dbName = currentDb.name;
      const showBuiltin = dbName === 'admin';
      driver
        .db(dbName)
        .command({rolesInfo: 1, showBuiltinRoles: showBuiltin})
        .then(roleList => {
          const roles = {
            db: dbName,
            roles: [],
            type: treeNodeTypes.ROLES
          };
          if (!roleList || roleList.length <= 0) {
            resolve(roles);
            return roles;
          }
          if (showBuiltin) {
            roles.roles[0] = {
              name: 'Built-In',
              roles: []
            };
          }
          _.each(roleList.roles, role => {
            if (showBuiltin && role.isBuiltin) {
              roles
                .roles[0]
                .roles
                .push({name: role.role, db: role.db, type: treeNodeTypes.DEFAULT_ROLE});
            } else {
              roles
                .roles
                .push({name: role.role, db: role.db, type: treeNodeTypes.ROLE});
            }
          });
          resolve(roles);
        })
        .catch(err => {
          console.error('inspectDBRoles error ', err);
          resolve();
        });
    });
  }

  getMemberState(member) {
    if (member.state == 0) {
      return '(STARTUP)'; // startup
    }
    if (member.state == 1) {
      return '(P)'; // primary
    }
    if (member.state == 2) {
      return '(S)'; // secondary
    }
    if (member.state == 3) {
      return '(R)'; // recovering
    }
    if (member.state == 5) {
      return '(STARTUP2)';
    }
    if (member.state == 7) {
      return '(A)'; // arbiter
    }
    if (member.state == 8) {
      return '(D)'; // down
    }
    if (member.state == 9) {
      return '(ROLLBACK)';
    }
    if (member.state == 10) {
      return '(REMOVED)';
    }
    return '(UNKNOWN)';
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
                .push({text: conf, type: treeNodeTypes.CONFIG});
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
                return {text: shard, type: treeNodeTypes.SHARD};
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
              .push({text: doc._id, type: treeNodeTypes.MONGOS});
          });
          resolve(shardsTree);
        });
    }).catch(err => {
      console.error('get all mongos error', err);
      throw new errors.BadRequest(err);
    });
  }
  /**
   * discover members under replica set
   *
   * @param db
   */
  inspectReplicaMembers() {
    const adminDb = this.driver.db('admin').admin();
    const replica = {
      text: 'Replica Set',
      children: []
    };
    return new Promise(resolve => {
      adminDb
        .command({
          replSetGetStatus: 1
        }, (err, result) => {
          if (!result) {
            resolve(null);
            return;
          }
          if (result && result.members && result.members.length > 0) {
            replica.children = _.map(result.members, member => {
              const memberState = this.getMemberState(member);
              let treeNodeType;
              switch (memberState) {
                case '(P)':
                  treeNodeType = treeNodeTypes.PRIMARY;
                  break;
                case '(S)':
                  treeNodeType = treeNodeTypes.SECONDARY;
                  break;
                case '(A)':
                  treeNodeType = treeNodeTypes.ARBITER;
                  break;
                default:
                  treeNodeType = treeNodeTypes.REPLICA_MEMBER;
              }
              return {
                text: member.name + ' ' + memberState,
                type: treeNodeType
              };
            });
          }
          resolve(replica);
        });
    }).catch(err => {
      console.error('failed to get replica set ', err);
    });
  }
}

module.exports = TreeInspector;
