const mongodbTopology = require('../src');

const options = {};
mongodbTopology.connect('mongodb://localhost:1111/test', options)
.then((inspector) => {
    return inspector.inspect();
})
.then((data) => {
    console.log((JSON.stringify(data)));
});
