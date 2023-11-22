function GetDefaultScrema(collectionName) {
    return {
        "name": collectionName,
        "secured": false,
        "rev-proxy": false,
        'realtime': false ,
        'hypermedia': false,
        "proxies": {
          "GET": "",
          "GETBYID" : "",
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
        "webhooks": {
          "PUT": "",
          "POST": "",
          "DELETE": ""
        },
        "schemna": {},
        "users": []
      }
      
}


module.exports =  GetDefaultScrema;