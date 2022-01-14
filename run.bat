@echo off
cls
@echo starting server......
<<<<<<< HEAD
set PROVIDER=sql
set CONNECTION_STRING=Server^=tcp:minjsonserv.database.windows.net,1433;Initial Catalog^=JSONSERV;Persist Security Info^=False;User ID^=servsa;Password^=Admin@123;MultipleActiveResultSets^=False;Encrypt^=True;TrustServerCertificate^=False;Connection Timeout^=30;

=======
set PROVIDER=postgres
set CONNECTION_STRING=postgres://ykqeaogj:ZeEjD72l6u0rNoL0uCdrygBijRc_SpPH@rosie.db.elephantsql.com/ykqeaogj
set CACHE_TTL=100
>>>>>>> main
npm run watch

