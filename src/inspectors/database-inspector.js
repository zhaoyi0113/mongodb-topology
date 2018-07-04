const _ = require('lodash');
const {TreeNodeTypes} = require('../tree-types');

/**
* inspect the index under a collection
*
* @param db  db driver instance
* @param col the collection instance
*/
const inspectIndex = (col, data) => {
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
                return { name: index.name, type: TreeNodeTypes.INDEX };
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
};

/**
  * inspect the given database
  *
  * @param db  the database driver instance
  * @param name  the name of the database need to be inspected.
  * @returns {Promise} resolve the databse json object
  */
const inspectDatabase = (db, name) => {
    return new Promise(resolve => {
        db
            .db(name)
            .collections()
            .then(collections => {
                const dbData = {
                    name,
                    type: TreeNodeTypes.DATABASE
                };
                dbData.children = _.map(collections, col => {
                    return { name: col.collectionName, type: TreeNodeTypes.COLLECTION };
                });
                dbData.children = _.sortBy(dbData.children, 'name');
                return { dbData, collections };
            })
            .then(value => {
                const promises = [];
                const { dbData } = value;
                value
                    .collections
                    .map(col => {
                        promises.push(inspectIndex(col, _.find(dbData.children, { name: col.collectionName })));
                    });
                return Promise
                    .all(promises)
                    .then(() => {
                        resolve(dbData);
                    });
            });
    });
};

module.exports = {
    /**
   * discover all databases in a mongodb instance
   */
    inspectDatabases(driver) {
        const adminDb = driver.db('admin').admin();
        return new Promise((resolve, _reject) => {
            const inspectResult = {
                databases: [],
                type: TreeNodeTypes.DATABASE
            };
            adminDb
                .listDatabases()
                .then(dbs => {
                    const promises = [];
                    // inspect into each database
                    dbs
                        .databases
                        .map(database => {
                            promises.push(inspectDatabase(driver, database.name));
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
                    inspectDatabase(driver, adminDb.databaseName)
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
};
