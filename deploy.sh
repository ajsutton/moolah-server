#!/usr/bin/env bash
ssh moolah@do2.symphonious.net mkdir -p versions/incoming
rsync -r --delete-after --quiet $TRAVIS_BUILD_DIR/ moolah@do2.symphonious.net:versions/incoming
ssh moolah@do2.symphonious.net ./deployIncoming.sh "${TRAVIS_COMMIT}" "${TRAVIS_BUILD_NUMBER}" "${TRAVIS_BUILD_ID}"