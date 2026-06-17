#!/bin/bash
set -e
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/backend"
export PYTHONPATH="$SCRIPT_DIR/backend:$PYTHONPATH"
exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

