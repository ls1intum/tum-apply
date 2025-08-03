#!/bin/sh
set -e
TEMPLATE=/opt/clearflask/config-selfhost.cfg.template
TARGET=/opt/clearflask/config-selfhost.cfg

cp $TEMPLATE $TARGET

for VAR in $(env | cut -d= -f1); do
  VALUE=$(printenv $VAR)
  ESCAPED=$(printf '%s\n' "$VALUE" | sed -e 's/[\/&]/\\&/g')
  sed -i "s|\${$VAR}|$ESCAPED|g" $TARGET
done

exec catalina.sh run
