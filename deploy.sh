#!/usr/bin/env bash
set -euo pipefail
ssh moolah@do2.symphonious.net mkdir -p versions/incoming
rsync -r --delete-after --quiet ~/project/ moolah@do2.symphonious.net:versions/incoming
ssh moolah@do2.symphonious.net ./deployIncoming.sh "${CIRCLE_SHA1}" "${CIRCLE_BUILD_NUM}" "${CIRCLE_BUILD_URL}"