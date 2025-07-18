#!/usr/bin/env bash
set -e

file_env() {
	local var="$1"
	local fileVar="${var}_FILE"
	local def="${2:-}"
	if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
		echo "Both $var and $fileVar are set (but are exclusive)"
	fi
	local val="$def"
	if [ "${!var:-}" ]; then
		val="${!var}"
	elif [ "${!fileVar:-}" ]; then
		val="$(< "${!fileVar}")"
	fi
	if [ ! -z "$val" ]; then
	  export "$var"="$val"
    unset "$fileVar"
  fi

	unset "$fileVar"
}

file_env 'CUBEJS_DB_NAME'
file_env 'CUBEJS_DB_HOST'
file_env 'CUBEJS_DB_PORT'
file_env 'CUBEJS_DB_USER'
file_env 'CUBEJS_DB_PASS'
file_env 'CUBEJS_DB_EVENTS_NAME'
file_env 'CUBEJS_DB_EVENTS_USER'
file_env 'CUBEJS_DB_EVENTS_PASS'