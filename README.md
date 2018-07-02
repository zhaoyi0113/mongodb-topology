# MongoDB Tree

This project is used to load tree topology tree from MongoDB server in NodeJS. It works with MongoDB single instance, Replica Set as well as Shard Cluster. The tree includes Database List, Collection List, Index, ReplicaSet Members, Shard Cluster Memebers, Users, Roles.

## Demo

- Connect to a singole MongoDB instance

```javascript
const mongodbTopology = require('mongodb-topology');

const options = {};
mongodbTopology.connect('mongodb://localhost:27017', options)
.then((inspector) => {
    return inspector.inspect();
})
.then((data) => {
    console.log((JSON.stringify(data)));
});
```

It will print the topology tree for this instance as below:

```json
{
    "databases": [
        {
            "name": "admin",
            "type": "database",
            "children": [
                {
                    "name": "system.version",
                    "type": "collection"
                }
            ]
        },
        {
            "name": "config",
            "type": "database",
            "children": [
                {
                    "name": "system.sessions",
                    "type": "collection",
                    "children": [
                        {
                            "name": "lsidTTLIndex",
                            "type": "index"
                        }
                    ]
                }
            ]
        },
        {
            "name": "local",
            "type": "database",
            "children": [
                {
                    "name": "startup_log",
                    "type": "collection"
                }
            ]
        }
    ],
    "users": [],
    "roles": []
}
```

