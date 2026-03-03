#!/bin/sh
# Gera config.js a partir de variáveis de ambiente (-e) e inicia o servidor
# Uso: docker run -e API_URL=http://backend:8000/api ...
#      ou docker run -e VITE_API_URL=http://backend:8000/api ...
API_URL="${API_URL:-${VITE_API_URL:-http://localhost:8000/api}}"
cat > /app/dist/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  API_URL: "${API_URL}"
};
EOF
exec serve -s dist -l 8080
