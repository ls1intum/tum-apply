#!/bin/bash

if [ ! -f tests.log ]; then
  echo "❌ File tests.log not found!"
  exit 1
fi

# Count the number of times the ApplicationContext was started (printed by ContextStartCounter)
numberOfStarts=$(grep "📦 ApplicationContext started" tests.log | wc -l)

echo "ℹ️ Number of ApplicationContext Starts: $numberOfStarts"

if [[ $numberOfStarts -lt 1 ]]; then
  echo "❌ No ApplicationContext starts detected! Something may be wrong with the test setup."
  exit 1
fi

if [[ $numberOfStarts -gt 3 ]]; then
  echo "❌ Too many ApplicationContext starts ($numberOfStarts)! This may indicate excessive context bootstrapping."
  exit 1
fi

echo "✅ ApplicationContext start count is within acceptable limits."
