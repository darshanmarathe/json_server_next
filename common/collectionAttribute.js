function GetDefaultScrema(collectionName) {
    return {
        "name": collectionName,
        "secured": false,
        "rev-proxy": false,
        "proxys": {
          "get": "",
          "put": "",
          "post": "",
          "delete": ""
        },
        "validations": "function (obj) {return true}",
        "transformation_in": "function (obj) {return obj}",
        "transformation_out": "function (obj) {return obj}",
        "queue" : {
          "provider": "RabbitMQ/Kafka/Azure/SNS"
        },
        "WebHooks": {
          "put": "",
          "post": "",
          "delete": ""
        },
        "schemna": {},
        "users": []
      }
      
}


module.exports =  GetDefaultScrema;