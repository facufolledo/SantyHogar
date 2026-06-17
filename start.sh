#!/bin/bash
cd "$(dirname "$0")/backend" || exit 1
export PYTHONPATH="$(pwd):$PYTHONPATH"
python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
