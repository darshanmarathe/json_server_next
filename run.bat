@echo off
cls
@echo starting server......
set PROVIDER=sql
set CONNECTION_STRING=Server^=tcp:minjsonserv.database.windows.net,1433;Initial Catalog^=JSONSERV;Persist Security Info^=False;User ID^=servsa;Password^=Admin@123;MultipleActiveResultSets^=False;Encrypt^=True;TrustServerCertificate^=False;Connection Timeout^=30;

npm run watch


