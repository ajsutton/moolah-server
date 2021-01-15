#!/usr/bin/env bash
ssh moolah@do2.symphonious.net mkdir -p versions/incoming
rsync -r --delete-after --quiet "${CIRCLE_WORKING_DIRECTORY}/" moolah@do2.symphonious.net:versions/incoming
ssh moolah@do2.symphonious.net ./deployIncoming.sh "${CIRCLE_SHA1}" "${CIRCLE_BUILD_NUM}" "${CIRCLE_BUILD_URL}"