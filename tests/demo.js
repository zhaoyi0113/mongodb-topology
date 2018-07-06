const {MongoClient} = require('mongodb');

const mongodbTopology = require('../src');

const options = {};
mongodbTopology.connect('mongodb://localhost:27017/test', options)
.then((inspector) => {
    return inspector.getCollectionAttributes('report', 'test');
})
.then((data) => {
    console.log(((data)));
});



// MongoClient.connect('mongodb://localhost:27017', (err, driver) => {
//     if(err) {
//       reject(err);
//       return null;
//     }
//     driver.db('report').collection('test').find({}, {limit: 20}).toArray()
//     .then(d => console.log(d));
//   });