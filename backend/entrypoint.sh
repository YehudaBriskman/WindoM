#!/bin/sh
set -e

node dist/db/migrate.js
exec node dist/index.js
