const {launchSingleInstance, getRandomPort, killMongoInstance} = require('mlaunch-node');
const assert = require('assert');
const {connect} = require('../src');

describe('test build database tree', () => {

  const mongoDbPort = getRandomPort();

  beforeAll((done) => {
    launchSingleInstance(mongoDbPort);
    setTimeout(() => done(), 3000);
  }, 10000);

  afterAll(() => {
    killMongoInstance(mongoDbPort);
  });

  it('test build database tree', (done) => {
    connect(`mongodb://localhost:${mongoDbPort}/test`).then((inspector) => {
      return inspector.inspectDatabases();
    }).then((dbs) => {
      console.log(dbs);
      assert.equal(dbs.text, 'Databases');
      done();
    }).catch(err => {
      console.error(err);
      assert.equal(err, undefined);
      done();
    });
  });
});
