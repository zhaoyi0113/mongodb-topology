const {launchSingleInstance, getRandomPort, killMongoInstance} = require('mlaunch-node');
const assert = require('assert');
const {connect} = require('../src');
const {MongoClient} = require('mongodb');
const _ = require('lodash');

describe('test build database tree', () => {

  const mongoDbPort = getRandomPort();
  const url = `mongodb://localhost:${mongoDbPort}/test`;

  beforeAll((done) => {
    launchSingleInstance(mongoDbPort);
    setTimeout(() => {
      MongoClient.connect(url, (err, driver) => {
        if (err) {
          reject(err);
          return null;
        }
        const proms = [];
        proms.push(driver.db('testdb1').createCollection('testcol1_1'));
        proms.push(driver.db('testdb1').createCollection('testcol1_2'));
        proms.push(driver.db('testdb2').createCollection('testcol2_1'));
        proms.push(driver.db('testdb2').createCollection('testcol2_2'));
        Promise
          .all(proms)
          .then((res) => {
            done();
          });
      });
    }, 3000);
  }, 10000);

  afterAll(() => {
    killMongoInstance(mongoDbPort);
  });

  it('test build database tree', (done) => {
    connect(url).then((inspector) => {
      return inspector.inspectDatabases();
    }).then((dbs) => {
      console.log(dbs);
      const myDbs = _.filter(dbs.databases, db => db.name.indexOf('testdb') >= 0);
      assert.equal(myDbs[0].name, 'testdb1');
      assert.equal(myDbs[0].type, 'database');
      assert.equal(myDbs[1].name, 'testdb2');
      assert.equal(myDbs[1].type, 'database');
      assert.equal(myDbs[0].children[0].name, 'testcol1_1');
      assert.equal(myDbs[0].children[0].type, 'collection');
      assert.equal(myDbs[0].children[1].name, 'testcol1_2');
      assert.equal(myDbs[0].children[1].type, 'collection');
      assert.equal(myDbs[1].children[0].name, 'testcol2_1');
      assert.equal(myDbs[1].children[0].type, 'collection');
      assert.equal(myDbs[1].children[1].name, 'testcol2_2');
      assert.equal(myDbs[1].children[1].type, 'collection');
      done();
    }).catch(err => {
      console.error(err);
      assert.equal(err, undefined);
      done();
    });
  });
});
