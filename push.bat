@echo off
title Push CampusConnect to GitHub
echo ========================================================
echo  Pushing CampusConnect to GitHub Repository:
echo  https://github.com/78000-pallavik/campus-connect
echo ========================================================
echo.
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo  SUCCESS! Pushed to GitHub successfully!
    echo ========================================================
) else (
    echo.
    echo If prompted to sign in, please complete the browser login.
)
echo.
pause
