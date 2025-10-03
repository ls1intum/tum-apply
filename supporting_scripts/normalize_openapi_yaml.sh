#!/bin/bash
set -e

# Sort JSON keys using jq for deterministic output
jq --sort-keys . openapi/openapi.yaml > openapi/openapi.normalized.json

# Overwrite the original
mv openapi/openapi.normalized.json openapi/openapi.yaml
