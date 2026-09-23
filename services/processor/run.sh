#!/usr/bin/env bash
# pm2 entrypoint for the SkillsGap processor: build, then run.
#
# `exec` replaces this shell with the compiled server so pm2 supervises the Go
# process directly. That matters because the server handles SIGINT/SIGTERM for
# graceful shutdown (see main.go); `go run .` would leave pm2 watching the `go`
# tool instead of the server process.
set -euo pipefail
cd "$(dirname "$0")"

echo "[run.sh] go build -o ./skillsgap-processor ."
go build -o ./skillsgap-processor .

echo "[run.sh] exec ./skillsgap-processor"
exec ./skillsgap-processor
