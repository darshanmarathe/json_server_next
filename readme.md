# min_json_server

#**How to start working**

clone repository

npm install
npm run start

go to data folder
add any folder for example "users"
add 1.json file with some json data
now this data is avaible

Get All
http://localhost:3000/users/


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
    - mongodb (not implemented yet)
    - redis (not implemented yet)
    - sql server (not implemented yet)

## Roadmap 

    - Add support for 
    - validations
    - transformations 
    - Webhook 

May Be
GraphQL