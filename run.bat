@echo off
setlocal
title Месть королю - запуск
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 (
  py -3 launcher.py
  goto :end
)

where python >nul 2>nul
if not errorlevel 1 (
  python launcher.py
  goto :end
)

echo Python не найден.
echo Установите Python 3.10+ и включите Add Python to PATH.
echo https://www.python.org/downloads/
pause

:end
endlocal
