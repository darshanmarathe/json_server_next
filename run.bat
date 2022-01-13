@echo off
cls
@echo starting server......
set PROVIDER=postgres
set CONNECTION_STRING=postgres://ykqeaogj:ZeEjD72l6u0rNoL0uCdrygBijRc_SpPH@rosie.db.elephantsql.com/ykqeaogj
set CACHE_TTL=100
npm run watch
