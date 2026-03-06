#!/bin/sh
# Gera config.js a partir de variáveis de ambiente (-e) e inicia o servidor
# Uso: docker run -e API_URL=http://backend:8000/api ...
#      ou docker run -e VITE_API_URL=http://backend:8000/api ...
#      ou docker run -e BASE_PATH=/app ... (quando atrás de proxy em subpath)
API_URL="${API_URL:-${VITE_API_URL:-http://localhost:8000/api}}"
BASE_PATH="${BASE_PATH:-}"
# Escapa aspas para JSON
API_URL_ESC=$(echo "$API_URL" | sed 's/"/\\"/g')
BASE_PATH_ESC=$(echo "$BASE_PATH" | sed 's/"/\\"/g')
if [ -n "$BASE_PATH_ESC" ]; then
  cat > /app/dist/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  API_URL: "${API_URL_ESC}",
  BASE_PATH: "${BASE_PATH_ESC}"
};
EOF
else
  cat > /app/dist/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  API_URL: "${API_URL_ESC}"
};
EOF
fi
exec serve -s dist -l 8080
