const {MongoClient} = require('mongodb');
const TreeBuilder = require('./builder');

const connect = (url, options) => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, options, (err, driver) => {
      if(err) {
        reject(err);
        return null;
      }
      const builder = new TreeBuilder(driver);
      resolve(builder);
    });
  });
};

module.exports = {
  connect
};
