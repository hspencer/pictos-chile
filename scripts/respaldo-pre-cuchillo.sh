#!/usr/bin/env bash
# respaldo-pre-cuchillo.sh
# Crea un respaldo de la versión actual de la presentación antes de
# reestructurarla para una audiencia de potenciales participantes.
#
# Uso: bash scripts/respaldo-pre-cuchillo.sh
#
# Qué hace:
#   1. Limpia un eventual lock residual de git
#   2. Confirma que estamos en la rama main
#   3. Hace commit del logo MICARE (si está pendiente)
#   4. Crea la rama respaldo/audiencia-academica apuntando al commit actual
#   5. Empuja la rama de respaldo al remoto
#
# Dónde se utiliza: una sola vez, antes de empezar los cambios mayores
# de estructura. Después de correrlo, main queda con el commit del logo
# y la rama respaldo/audiencia-academica conserva exactamente este estado.

set -e

cd "$(dirname "$0")/.."

echo "==> Limpiando lock residual (si existe)"
rm -f .git/index.lock

echo "==> Rama actual:"
git rev-parse --abbrev-ref HEAD

echo "==> Estado:"
git status --short

echo "==> Commiteando cambios pendientes"
git add -A
if ! git diff --cached --quiet; then
  git commit -m "Agregar logo MICARE a la portada

Estado previo a la reestructuración para audiencia
de potenciales participantes."
else
  echo "    (no hay cambios staged, se omite commit)"
fi

echo "==> Creando rama de respaldo: respaldo/audiencia-academica"
if git rev-parse --verify respaldo/audiencia-academica >/dev/null 2>&1; then
  echo "    La rama ya existe localmente, se reposiciona al HEAD actual"
  git branch -f respaldo/audiencia-academica
else
  git branch respaldo/audiencia-academica
fi

echo "==> Empujando rama de respaldo al remoto"
git push -u origin respaldo/audiencia-academica

echo "==> Listo. Estado final:"
git log --oneline -3
echo
git branch -a
