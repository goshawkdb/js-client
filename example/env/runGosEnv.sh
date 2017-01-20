#!/usr/bin/env bash

DIRECTORY=`dirname $0`
GOS=/path/to/goshawkdb

$GOS -config $DIRECTORY/config.json -wss -cert $DIRECTORY/clusterKeyPair.pem -dir $DIRECTORY/data
