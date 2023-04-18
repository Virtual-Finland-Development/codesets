#!/usr/bin/env bash
ESCO_VERSION=${ESCO_VERSION:-v1.1.1}

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
SERVER_PATH=${SCRIPTPATH}/../server

LOCAL_API_FOLDER=ESCO_Local_API_${ESCO_VERSION}
SERVER_FOLDER=tomcat-esp-api-v03_94
BINARY_PATH=${LOCAL_API_FOLDER}/${SERVER_FOLDER}

if [ ! -d "${SERVER_PATH}/${BINARY_PATH}" ]; then

    if [ -d "${SERVER_PATH}/${LOCAL_API_FOLDER}" ]; then
        echo "> Server base path found: ${SERVER_PATH}/${LOCAL_API_FOLDER}",
        echo "> but not the server binary: ${SERVER_FOLDER}"
        exit 1
    fi

    echo "Server not found"
    echo "Download server binary from: https://esco.ec.europa.eu/en/use-esco/download"
    echo "Unzip as path: ${BINARY_PATH}"
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
