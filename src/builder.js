const _ = require('lodash');
const treeNodeTypes = {
  DATABASE: 'database',
  COLLECTION: 'collection',
  INDEX: 'index',
  SHARD: 'shard',
  CONFIG: 'config',
  MONGOS: 'mongos',
  USERS: 'user',
  DEFAULT_ROLE: 'default_role',
  ROLE: 'role',
  ROLES: 'roles',
  REPLICA_MEMBER: 'replica_member',
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  ARBITER: 'arbiter'
};

class TreeBuilder {
  inspect(driver) {
    const db = driver.db('admin').admin();
    return new Promise((resolve, reject) => {
      Promise.all([
        this.inspectDatabases(driver, db),
        this.inspectUsers(driver),
        this.inspectAllRoles(driver, db),
        this.inspectReplicaMembers(db)
      ]).then(value => {
        console.log('generate tree topology ', value);
        resolve(value.filter(v => {
          return v !== null && v !== undefined;
        }));
      }).catch(err => {
        reject(err);
      });
    });
  }

  /**
   * discover all databases in a mongodb instance
   */
  inspectDatabases(driver, adminDb) {
    return new Promise((resolve, _reject) => {
      const inspectResult = {
        text: 'Databases',
        children: []
      };
      adminDb
        .listDatabases()
        .then(dbs => {
          const promises = [];
          // inspect into each database
          dbs
            .databases
            .map(database => {
              promises.push(this.inspectDatabase(driver, database.name));
            });
          Promise
            .all(promises)
            .then(values => {
              inspectResult.children = _.sortBy(values, 'text');
              // inspectResult = _.sortBy(inspectResult, 'text');
              resolve(inspectResult);
            })
            .catch(err => {
              console.error('failed to inspect database ', err);
            });
        })
        .catch(err => {
          log.warn(err.message);
          this
            .inspectDatabase(driver, adminDb.databaseName)
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
            text: name,
            type: treeNodeTypes.DATABASE
          };
          dbData.children = _.map(collections, col => {
            return {text: col.collectionName, type: treeNodeTypes.COLLECTION};
          });
          dbData.children = _.sortBy(dbData.children, 'text');
          return {dbData, collections};
        })
        .then(value => {
          const promises = [];
          const {dbData} = value;
          value
            .collections
            .map(col => {
              promises.push(this.inspectIndex(col, _.find(dbData.children, {text: col.collectionName})));
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
          return {text: index.name, type: treeNodeTypes.INDEX};
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
  inspectUsers(driver) {
    const users = {
      text: 'Users',
      children: []
    };
    return new Promise(resolve => {
      const userCollection = driver
        .db('admin')
        .collection('system.users');
      if (!userCollection) {
        resolve(users);
        return;
      }
      userCollection.find({}, {
        _id: 1,
        user: 1,
        db: 1
      }).toArray((err, items) => {
        if (err || !items || items.length <= 0) {
          resolve(users);
          return;
        }
        const children = items.map(item => {
          return {text: item._id, user: item.user, db: item.db, type: treeNodeTypes.USERS};
        });
        users.children = _.uniqBy(children, e => {
          return e.text;
        });
        resolve(users);
      });
    }).catch(err => {
      console.error('get error ', err);
      return users;
    });
  }

  inspectAllRoles(driver, adminDb) {
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
            promises.push(this.inspectRoles(driver, currentDb));
          });
          Promise
            .all(promises)
            .then(values => {
              values = values.filter(value => {
                return value;
              });
              allRoles.children = values;
              allRoles.children = allRoles
                .children
                .filter(roles => {
                  return !roles.children.length <= 0;
                });
              resolve(allRoles);
            });
        })
        .catch(err => {
          log.warn(err.message);
          resolve(allRoles);
        });
    }).catch(err => {
      log.error('get error ', err);
      return allRoles;
    });
  }

  inspectRoles(driver, currentDb) {
    return new Promise(resolve => {
      const dbName = currentDb.name;
      const showBuiltin = dbName === 'admin';
      driver
        .db(dbName)
        .command({rolesInfo: 1, showBuiltinRoles: showBuiltin})
        .then(roleList => {
          const roles = {
            text: dbName,
            children: [],
            type: treeNodeTypes.ROLES
          };
          if (!roleList || roleList.length <= 0) {
            resolve(roles);
            return roles;
          }
          if (showBuiltin) {
            roles.children[0] = {
              text: 'Built-In',
              children: []
            };
          }
          _.each(roleList.roles, role => {
            if (showBuiltin && role.isBuiltin) {
              roles
                .children[0]
                .children
                .push({text: role.role, db: role.db, type: treeNodeTypes.DEFAULT_ROLE});
            } else {
              roles
                .children
                .push({text: role.role, db: role.db, type: treeNodeTypes.ROLE});
            }
          });
          resolve(roles);
        })
        .catch(err => {
          console.error('inspectRoles error ', err);
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

  getAllConfigs(db) {
    return new Promise(resolve => {
      const adminDB = db.db(MongoShardsInspector.ADMIN_DB);
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
          l.error('failed to get shard map ', err);
          resolve(configTree);
        });
    }).catch(err => {
      l.info('cant run get shard map command ', err);
    });
  }

  getAllShards(driver) {
    return new Promise(resolve => {
      const collection = driver
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
      l.error('get all shards error', err);
      throw new errors.BadRequest(err);
    });
  }

  getAllMongos(db) {
    return new Promise(resolve => {
      const collection = db
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
      l.error('get all mongos error', err);
      throw new errors.BadRequest(err);
    });
  }
  /**
   * discover members under replica set
   *
   * @param db
   */
  inspectReplicaMembers(db) {
    const replica = {
      text: 'Replica Set',
      children: []
    };
    return new Promise(resolve => {
      db
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

module.exports = TreeBuilder;
