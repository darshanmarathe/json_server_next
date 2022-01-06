@echo off
cls
echo http://localhost:3000/
call curl http://localhost:3000/
echo  
echo http://localhost:3000/users/
call curl http://localhost:3000/users
echo  
echo http://localhost:3000/users/1
call curl http://localhost:3000/users/1
echo  