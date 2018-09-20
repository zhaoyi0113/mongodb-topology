const {MongoClient, ObjectID} = require('mongodb');

const mongodbTopology = require('../src');

const options = {auth: {user: 'testuser1', password: '123456'}};
mongodbTopology.connect('mongodb://localhost:27017/test')
.then((inspector) => {
    // inspector.addTreeChangedListener((e) => {
    //     console.log('get new data:', e);
    // })
    return inspector.simpleQuery('test', 'test', {'price': 1});
})
.then((data) => {
    console.log((JSON.stringify(data)));
});



// MongoClient.connect('mongodb://localhost:27017', (err, driver) => {
//     if(err) {
//       reject(err);
//       return null;
//     }
//     driver.db('report').collection('test').find({}, {limit: 20}).toArray()
//     .then(d => console.log(d));
//   });