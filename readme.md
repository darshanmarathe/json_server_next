# json_server_next

# **How to start working**

clone repository

npm install
npm run start

Check Which DataStore you like and start using it.


Get All
http://localhost:3000/rest/users/

Get All with Pageing
http://localhost:3000/rest/users?\_page=1&\_pageSize=2

Get By id
http://localhost:3000/rest/users/1

Post
http://localhost:3000/rest/users/ // body as json

Put
http://localhost:3000/rest/users/1 // body as json

Delete
http://localhost:3000/rest/users/1

## DataStore

    - FileSystem (Default)
    - neDb
    - mongodb
        - ENV: DB_NAME (default : mjserverDB)
        - ENV: CONNECTION_STRING (default : mongodb://localhost:27017)
    - redis
        - ENV: REDIS_URL (default : redis://localhost:6379)
        - ENV: REDIS_USERNAME=default (default : default)
        - ENV: REDIS_PWD (default : null)
    - postgrs 
        - ENV: CONNECTION_STRING  (default :'postgresql://localhost:5432');
    - sql server 
        - ENV: CONNECTION_STRING  (default :'');


## Features

    - Caching layer (ENV: CACHE_TTL=100, or soon api level)
    - Reverse Proxy
    - Webhooks
    - RealTime  /Realtime Implemented with socket.io
    - Hypermedia API

## Roadmap
    - validations
    - Special routes
    - admin Area service
    - admin panel
    - Search....
    - transformations
    - security (JWT)
    - clients (client keys)
    - schemas
    - headless cms
    - GraphQL (When schema available)
