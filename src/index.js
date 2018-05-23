const {MongoClient} = require('mongodb');
const TreeBuilder = require('./builder');

const connect = (url, options) => {
  MongoClient.connect(url, options, (err, driver) => {
    const builder = new TreeBuilder();
    builder.inspect(driver).then((dbs) => {
      console.log(dbs);
    })
  });
};


connect('mongodb://localhost');