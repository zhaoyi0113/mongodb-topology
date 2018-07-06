# MongoDB Tree

This project is used to load tree topology tree from MongoDB server in NodeJS. It works with MongoDB single instance, Replica Set as well as Shard Cluster. The tree includes Database List, Collection List, Index, ReplicaSet Members, Shard Cluster Memebers, Users, Roles.

## Database Inspector

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
      "collections": [
        {
          "name": "system.roles",
          "type": "collection",
          "dbName": "admin",
          "indexes": [{ "name": "role_1_db_1", "type": "index" }]
        },
        {
          "name": "system.users",
          "type": "collection",
          "dbName": "admin",
          "indexes": [{ "name": "user_1_db_1", "type": "index" }]
        },
        { "name": "system.version", "type": "collection", "dbName": "admin" }
      ]
    },
    {
      "name": "config",
      "type": "database",
      "collections": [
        {
          "name": "system.sessions",
          "type": "collection",
          "dbName": "config",
          "indexes": [{ "name": "lsidTTLIndex", "type": "index" }]
        }
      ]
    },
    {
      "name": "local",
      "type": "database",
      "collections": [
        { "name": "startup_log", "type": "collection", "dbName": "local" }
      ]
    },
    {
      "name": "report",
      "type": "database",
      "collections": [
        { "name": "test", "type": "collection", "dbName": "report" }
      ]
    },
    {
      "name": "test",
      "type": "database",
      "collections": [
        {
          "name": "test",
          "type": "collection",
          "dbName": "test",
          "indexes": [{ "name": "name_1", "type": "index" }]
        }
      ]
    }
  ],
  "users": [
    { "name": "admin.admin", "user": "admin", "db": "admin", "type": "user" },
    { "name": "admin.test", "user": "test", "db": "admin", "type": "user" }
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
            { "name": "__system", "db": "admin", "type": "default_role" },
            { "name": "backup", "db": "admin", "type": "default_role" },
            { "name": "clusterAdmin", "db": "admin", "type": "default_role" },
            { "name": "clusterManager", "db": "admin", "type": "default_role" },
            { "name": "clusterMonitor", "db": "admin", "type": "default_role" },
            { "name": "dbAdmin", "db": "admin", "type": "default_role" },
            {
              "name": "dbAdminAnyDatabase",
              "db": "admin",
              "type": "default_role"
            },
            { "name": "dbOwner", "db": "admin", "type": "default_role" },
            { "name": "enableSharding", "db": "admin", "type": "default_role" },
            { "name": "hostManager", "db": "admin", "type": "default_role" },
            { "name": "read", "db": "admin", "type": "default_role" },
            {
              "name": "readAnyDatabase",
              "db": "admin",
              "type": "default_role"
            },
            { "name": "readWrite", "db": "admin", "type": "default_role" },
            {
              "name": "readWriteAnyDatabase",
              "db": "admin",
              "type": "default_role"
            },
            { "name": "restore", "db": "admin", "type": "default_role" },
            { "name": "root", "db": "admin", "type": "default_role" },
            { "name": "userAdmin", "db": "admin", "type": "default_role" },
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
      "roles": [{ "name": "role1", "db": "test", "type": "role" }],
      "type": "roles"
    }
  ]
}


```

It includes basically `databases`, `collections list` under each datbase, `users` under the system and `roles`.

## Database/Collection Inspector

Collection list is defined as an array element under `database`. Each collection has its name and children. Collection children can be `index` as below example.

```javascript

connect(url, {auth: {user, password}}).then((inspector) => {
      return inspector.inspectDatabases();
}).then((dbs) => console.log(dbs));

{
  "databases": [
    {
      "name": "admin",
      "type": "database",
      "collections": [
        {
          "name": "system.roles",
          "type": "collection",
          "dbName": "admin",
          "indexes": [{ "name": "role_1_db_1", "type": "index" }]
        },
        {
          "name": "system.users",
          "type": "collection",
          "dbName": "admin",
          "indexes": [{ "name": "user_1_db_1", "type": "index" }]
        },
        { "name": "system.version", "type": "collection", "dbName": "admin" }
      ]
    },
    {
      "name": "config",
      "type": "database",
      "collections": [
        {
          "name": "system.sessions",
          "type": "collection",
          "dbName": "config",
          "indexes": [{ "name": "lsidTTLIndex", "type": "index" }]
        }
      ]
    },
    {
      "name": "local",
      "type": "database",
      "collections": [
        { "name": "startup_log", "type": "collection", "dbName": "local" }
      ]
    },
    {
      "name": "report",
      "type": "database",
      "collections": [
        { "name": "test", "type": "collection", "dbName": "report" }
      ]
    },
    {
      "name": "test",
      "type": "database",
      "collections": [
        {
          "name": "test",
          "type": "collection",
          "dbName": "test",
          "indexes": [{ "name": "name_1", "type": "index" }]
        }
      ]
    }
  ],
  "type": "database"
}

```

## ReplicaSet Members

The replica set members json format is defined:

```javascript

connect(url, {auth: {user, password}}).then((inspector) => {
      return inspector.inspectReplicaMembers();
}).then((replica) => console.log(replica));


"replicaset": [
    {
      "text": "localhost:1111 (P)",
      "type": "primary"
    },
    {
      "text": "localhost:1112 (S)",
      "type": "secondary"
    },
    {
      "text": "localhost:1113 (S)",
      "type": "secondary"
    }
]
```

## Inspect Users

```javascript
connect(url, {auth: {user, password}}).then((inspector) => {
      return inspector.inspectUserss();
}).then((users) => console.log(users));

{
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
    ]
}
```

