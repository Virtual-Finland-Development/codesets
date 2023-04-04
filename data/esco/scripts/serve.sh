#!/usr/bin/env bash
SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
SERVER_PATH=${SCRIPTPATH}/../server
BINARY_PATH=ESCO_Local_API_v1.1.0/tomcat-esp-api-v03_94

if [ ! -d "${SERVER_PATH}/${BINARY_PATH}" ]; then
    echo "Server not found"
    echo "Download server binary from: https://esco.ec.europa.eu/en/use-esco/download"
    exit 1
fi

${SERVER_PATH}/${BINARY_PATH}/bin/startup.sh
SERVER_PID=$(ps axf | grep ${BINARY_PATH} | grep -v grep | awk '{print $1 }')

echo "Server PID: $SERVER_PID"
touch ${SERVER_PATH}/${BINARY_PATH}/logs/catalina.out

function stop_server() {
    echo "Stopping Server PID: $SERVER_PID\n"
    kill $SERVER_PID
    exit 0
}

trap stop_server SIGINT
tail -f ${SERVER_PATH}/${BINARY_PATH}/logs/catalina.out
