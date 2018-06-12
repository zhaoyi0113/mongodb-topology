const {MongoClient} = require('mongodb');
const TreeInspector = require('./tree-inspector');

const connect = (url, options) => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, options, (err, driver) => {
      if(err) {
        reject(err);
        return null;
      }
      const builder = new TreeInspector(driver);
      resolve(builder);
    });
  });
};

module.exports = {
  connect
};
