#!/bin/bash

if [ ! -f tests.log ]; then
  echo "Die Datei tests.log wurde nicht gefunden!"
  exit 1
fi

# Erweiterte Suche nach verschiedenen Boot-Nachrichten
numberOfStarts=$(grep -E "(:: Powered by Spring Boot|:: Spring Boot ::|Application 'TUMApply' is running!|Started TUMApplyApplication)" tests.log | wc -l)
echo "Number of Server Starts: $numberOfStarts"

# Ausgabe für Diagnose
echo "Log-Datei Inhalt (Anfang):"
head -n 20 tests.log

# Suche nach Boot-Log in der gesamten Datei
echo "Suche nach Boot-Log in der gesamten Datei:"
grep -E "(:: Powered by Spring Boot|:: Spring Boot ::|Application 'TUMApply' is running!|Started TUMApplyApplication)" tests.log || echo "Keine Boot-Nachrichten gefunden"


if [[ $numberOfStarts -lt 1 ]]
then
  echo "Something went wrong, there should be at least one Server Start!"
  exit 1
fi

if [[ $numberOfStarts -gt 3 ]]
then
  echo "The number of Server Starts should be lower than/equals 2! Please adapt this check if the change is intended or try to fix the underlying issue causing a different number of server starts!"
  exit 1
fi
