#!/bin/sh
set -e

# Nix Python uses a patched dynamic linker that doesn't search Ubuntu apt library
# paths by default. Adding /usr/lib/x86_64-linux-gnu makes libcurl.so.4 and other
# apt-installed GDAL dependencies findable when ctypes loads libgdal.so.
export LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"

python manage.py migrate --noinput
python manage.py seed --skip-if-seeded

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers 2 \
  --timeout 60 \
  --access-logfile -
