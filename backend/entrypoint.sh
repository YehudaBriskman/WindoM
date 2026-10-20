#!/bin/sh
set -e

# Migrations deliberately do NOT run here.
#
# They previously ran as a hard precondition for the server starting, which meant a
# read-only database exited the container and Fly crash-looped it to its 10-attempt
# limit - turning a database write problem into a total API outage (incident #307).
#
# Migrations now run once per deploy via `release_command` in fly.toml. A failing
# migration fails the *deploy*, which is correct, instead of crash-looping a *running*
# app, which is not. See issue #303.
exec node dist/index.js
