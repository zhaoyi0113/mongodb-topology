const {MongoClient} = require('mongodb');

const mongodbTopology = require('../src');

const options = {};
// mongodbTopology.connect('mongodb://localhost:1111/test', options)
// .then((inspector) => {
//     return inspector.inspect();
// })
// .then((data) => {
//     console.log((JSON.stringify(data)));
// });



MongoClient.connect('mongodb://localhost:27017', (err, driver) => {
    if(err) {
      reject(err);
      return null;
    }
    driver.db('admin').command({serverStatus: 1})
    .then(d => console.log(d));
  });