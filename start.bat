@echo off
title CampusConnect (UniGraph)
echo ========================================================
echo  Starting CampusConnect (UniGraph) Local Web Server...
echo ========================================================
echo.
echo Launching server on http://localhost:8000
start "" "http://localhost:8000"
python -m http.server 8000
pause
