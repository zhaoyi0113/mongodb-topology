const mongodbTopology = require('../src');

const options = {};
mongodbTopology.connect('mongodb://localhost:27017/admin', options)
.then((inspector) => {
    return inspector.inspect();
})
.then((data) => {
    console.log(((data)));
});
