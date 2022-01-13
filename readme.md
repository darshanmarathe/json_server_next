# min_json_server

# **How to start working**

clone repository

npm install
npm run start

go to data folder
add any folder for example "users"
add 1.json file with some json data
now this data is avaible

Get All
http://localhost:3000/users/

Get All with Pageing
http://localhost:3000/users?\_page=1&\_pageSize=2

Get By id
http://localhost:3000/users/1

Post
http://localhost:3000/users/ // body as json

Put
http://localhost:3000/users/1 // body as json

Delete
http://localhost:3000/users/1

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
    - sql server (not implemented yet)

## Roadmap

    - Hypermedia API
    - Caching layer
    - admin panel
    - validations
    - transformations
    - Webhook
    - security (JWT)
    - clients (client keys)
    - Reverse Proxy
    - schemas
    - headless cms
    - GraphQL (When schema available)
