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

It will print the topology tree for this instance as below. 
```json
{
    "databases": [
        {
            "name": "admin",
            "type": "database",
            "children": [
                {
                    "name": "system.roles",
                    "type": "collection",
                    "children": [
                        {
                            "name": "role_1_db_1",
                            "type": "index"
                        }
                    ]
                },
                {
                    "name": "system.users",
                    "type": "collection",
                    "children": [
                        {
                            "name": "user_1_db_1",
                            "type": "index"
                        }
                    ]
                },
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
        },
        {
            "name": "report",
            "type": "database",
            "children": [
                {
                    "name": "test",
                    "type": "collection"
                }
            ]
        },
        {
            "name": "test",
            "type": "database",
            "children": [
                {
                    "name": "test",
                    "type": "collection"
                }
            ]
        }
    ],
    "users": [
        {
            "name": "admin.admin",
            "user": "admin",
            "db": "admin",
            "type": "user"
        },
        {
            "name": "admin.test",
            "user": "test",
            "db": "admin",
            "type": "user"
        }
    ],
    "roles": [
        {
            "db": "admin",
            "roles": [
                {
                    "name": "Built-In",
                    "roles": [
                        {
                            "name": "__queryableBackup",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "__system",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "backup",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "clusterAdmin",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "clusterManager",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "clusterMonitor",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "dbAdmin",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "dbAdminAnyDatabase",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "dbOwner",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "enableSharding",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "hostManager",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "read",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "readAnyDatabase",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "readWrite",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "readWriteAnyDatabase",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "restore",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "root",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "userAdmin",
                            "db": "admin",
                            "type": "default_role"
                        },
                        {
                            "name": "userAdminAnyDatabase",
                            "db": "admin",
                            "type": "default_role"
                        }
                    ]
                }
            ],
            "type": "roles"
        },
        {
            "db": "test",
            "roles": [
                {
                    "name": "role1",
                    "db": "test",
                    "type": "role"
                }
            ],
            "type": "roles"
        }
    ]
}
```

It includes basically `databases`, `collections list` under each datbase, `users` under the system and `roles`.

