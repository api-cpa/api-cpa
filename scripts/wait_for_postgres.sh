#!/bin/bash

set -e

host="${1}"
shift
cmd="${@}"

until psql -h "${host}" -U "postgres" -c '\l'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 2
done

>&2 echo "Postgres is up - executing command"
exec ${cmd}
