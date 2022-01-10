@echo off
cls
@echo starting server......
set PROVIDER=redis
set REDIS_URL=redis://redis-14275.c212.ap-south-1-1.ec2.cloud.redislabs.com:14275
set REDIS_USERNAME=default
set REDIS_PWD=qUqXVFMyaALnpPTTGWXc64LPg4gqVaQJ
set TTL=3000
npm run watch
