@echo off
rem Ruft start-dev.ps1 auf, unabhaengig von der PowerShell-Ausfuehrungsrichtlinie.
rem   start-dev.cmd            starten, was noch nicht laeuft
rem   start-dev.cmd -Rebuild   alle Container neu aufsetzen
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1" %*
