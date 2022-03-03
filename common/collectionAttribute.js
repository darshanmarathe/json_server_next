function GetDefaultScrema(collectionName) {
    return {
        "name": collectionName,
        "secured": false,
        "rev-proxy": false,
        "proxies": {
          "GET": "",
          "PUT": "",
          "POST": "",
          "DELETE": ""
        },
        "validations": "function (obj) {return true}",
        "transformation_in": "function (obj) {return obj}",
        "transformation_out": "function (obj) {return obj}",
        "queue" : {
          "provider": "RabbitMQ/Kafka/Azure/SNS"
        },
        "WebHooks": {
          "PUT": "",
          "POST": "",
          "DELETE": ""
        },
        "schemna": {},
        "users": []
      }
      
}


module.exports =  GetDefaultScrema;