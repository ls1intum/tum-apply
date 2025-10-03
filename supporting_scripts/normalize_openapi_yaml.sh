#!/bin/bash
set -e

# Requires yq (v4+)
echo "🔧 Sorting openapi.yaml keys for deterministic output..."
yq eval '... comments="" | sort_keys(..)' openapi/openapi.yaml > openapi/openapi.sorted.yaml
mv openapi/openapi.sorted.yaml openapi/openapi.yaml
