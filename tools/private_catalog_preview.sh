#!/usr/bin/env bash
set -euo pipefail

source_root="${1:-${COURSES_SOURCE_ROOT:-}}"
port="${PORTFOLIO_PREVIEW_PORT:-4173}"

if [[ -z "$source_root" || ! -d "$source_root" ]]; then
  echo "Uso: $0 /ruta/al/repositorio-privado-cursos" >&2
  exit 2
fi

for required in \
  "$source_root/tools/export_portfolio_content.py" \
  "$source_root/products/portfolio/courses"; do
  test -e "$required" || {
    echo "Falta la ruta requerida: $required" >&2
    exit 2
  }
done

preview_root="$(mktemp -d "${TMPDIR:-/tmp}/portfolio-preview.XXXXXX")"
cleanup() {
  rm -rf "$preview_root"
}
trap cleanup EXIT INT TERM

git archive HEAD | tar -x -C "$preview_root"
mkdir -p "$preview_root/posts/academy"
python3 "$source_root/tools/export_portfolio_content.py" \
  --root "$source_root/products/portfolio/courses" \
  --kind courses \
  --output "$preview_root/posts/academy"

(
  cd "$preview_root"
  python3 build_index.py >/dev/null
  exec python3 -m http.server "$port" --directory public
)
