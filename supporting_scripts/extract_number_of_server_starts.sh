#!/bin/bash

if [ ! -f tests.log ]; then
  echo "Die Datei tests.log wurde nicht gefunden!"
  exit 1
fi

numberOfStarts=$(grep ":: Powered by Spring Boot[^:]* ::" tests.log | wc -l)
echo "Number of Server Starts: $numberOfStarts"

echo "Log-Datei Inhalt (Anfang):"
head -n 100 tests.log

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
