#!/usr/bin/env bash
set -euo pipefail

pdf_source="${1:-source.pdf}"
out_dir="${2:-notes}"
pages_arg="${3:-all}"
end_page_arg=""
quality_arg="high"

if [ "$#" -ge 4 ]; then
  if [ "$pages_arg" = "all" ] && [[ "${4}" =~ ^(low|medium|high|ultra|[0-9]+)$ ]]; then
    quality_arg="${4}"
  else
    end_page_arg="${4}"
  fi
fi

if [ "$#" -ge 5 ]; then
  quality_arg="${5}"
fi

if [ "$pages_arg" != "all" ] && [ -n "$end_page_arg" ]; then
  if [[ "$pages_arg" =~ ^[0-9]+$ ]] && [[ "$end_page_arg" =~ ^[0-9]+$ ]]; then
    pages="${pages_arg}-${end_page_arg}"
  else
    echo "Error: invalid page selection '$pages_arg $end_page_arg'. Use 'all', a page number, or a page range like '2-5'." >&2
    exit 1
  fi
else
  pages="$pages_arg"
fi

# ---- Quality / DPI resolution ----------------------------------------
# Accepts: low | medium | high | ultra | a raw integer DPI (e.g. 300)
resolve_dpi() {
  case "$quality_arg" in
    low)
      dpi=100
      ;;
    medium)
      dpi=150
      ;;
    high)
      dpi=200
      ;;
    ultra)
      dpi=300
      ;;
    ''|*[!0-9]*)
      echo "Error: invalid quality '$quality_arg'. Use low, medium, high, ultra, or a numeric DPI (e.g. 250)." >&2
      exit 1
      ;;
    *)
      dpi="$quality_arg"
      ;;
  esac

  if [ "$dpi" -lt 50 ] || [ "$dpi" -gt 600 ]; then
    echo "Error: DPI '$dpi' out of sane range (50-600)." >&2
    exit 1
  fi
}
resolve_dpi
echo "Using quality preset/DPI: $quality_arg -> ${dpi} DPI"

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

if [[ "$pdf_source" =~ ^https?:// ]]; then
  pdf_file="$tmp_dir/source.pdf"
  if command -v curl >/dev/null 2>&1; then
    curl -L -o "$pdf_file" "$pdf_source"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$pdf_file" "$pdf_source"
  else
    echo "Error: curl or wget is required to download PDF from URL." >&2
    exit 1
  fi
else
  pdf_file="$pdf_source"
fi

mkdir -p "$out_dir"

manifest_file="$out_dir/.pdf-to-slides-state.json"
next_slide_index=1
slide_offset=0

load_state() {
  if [ ! -f "$manifest_file" ]; then
    return
  fi

  local stored
  stored=$(grep -o '"next_slide_index"[[:space:]]*:[[:space:]]*[0-9]\+' "$manifest_file" | grep -o '[0-9]\+' | tail -n1 || true)
  if [[ "$stored" =~ ^[0-9]+$ ]] && [ "$stored" -ge 1 ]; then
    next_slide_index="$stored"
  fi
}

write_state() {
  printf '{\n  "next_slide_index": %s\n}\n' "$next_slide_index" > "$manifest_file"
}

load_state
slide_offset=$((next_slide_index - 1))

parse_pages() {
  if [ "$pages" = "all" ]; then
    start=1
    end=0
    return
  fi

  if [[ "$pages" =~ ^([0-9]+)-([0-9]+)$ ]]; then
    start=${BASH_REMATCH[1]}
    end=${BASH_REMATCH[2]}
  elif [[ "$pages" =~ ^([0-9]+)$ ]]; then
    start=${BASH_REMATCH[1]}
    end=$start
  else
    echo "Error: unsupported page selection '$pages'. Use 'all', a page number, or a page range like '2-5'." >&2
    exit 1
  fi

  if [ "$end" -ne 0 ] && [ "$end" -lt "$start" ]; then
    echo "Error: invalid page range '$pages'." >&2
    exit 1
  fi
}

get_total_pages() {
  if [ "$pages" = "all" ]; then
    if command -v pdfinfo >/dev/null 2>&1; then
      local page_count
      page_count=$(pdfinfo "$pdf_file" 2>/dev/null | awk '/^Pages:/ {print $2}')
      if [[ "$page_count" =~ ^[0-9]+$ ]]; then
        total_pages="$page_count"
      else
        total_pages=0
      fi
    else
      total_pages=0
    fi
  else
    total_pages=$((end - start + 1))
  fi
}

move_converted_slides() {
  local seq=0
  local img
  copied_count=0
  last_output_index=$slide_offset

  while IFS= read -r -d '' img; do
    seq=$((seq + 1))
    local output_index=$((slide_offset + seq))
    local output_file="$out_dir/slide${output_index}.png"
    cp -f "$img" "$output_file"
    copied_count=$((copied_count + 1))
    last_output_index=$output_index
  done < <(find "$tmp_dir" -maxdepth 1 -type f -name 'slide*.png' -print0 | sort -z -V)
}

to_native_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$1"
  else
    printf '%s' "$1"
  fi
}

is_imagemagick_convert() {
  command -v convert >/dev/null 2>&1 && convert -version 2>/dev/null | grep -qi imagemagick
}

# ---- ImageMagick hardening against cache-exhaustion -------------------
# Large/high-DPI PDFs can blow past ImageMagick's default resource limits
# ("cache resources exhausted", "IDAT: Too much image data"). Raise the
# limits and give it a roomy, explicit temp dir for its pixel cache.
harden_imagemagick_env() {
  im_tmp="$tmp_dir/im-cache"
  mkdir -p "$im_tmp"
  export MAGICK_TMPDIR="$im_tmp"
  export MAGICK_TEMPORARY_PATH="$im_tmp"
  # Generous but bounded limits; raise further here if you still hit caps.
  export MAGICK_AREA_LIMIT="${MAGICK_AREA_LIMIT:-1GP}"
  export MAGICK_MEMORY_LIMIT="${MAGICK_MEMORY_LIMIT:-4GiB}"
  export MAGICK_MAP_LIMIT="${MAGICK_MAP_LIMIT:-8GiB}"
  export MAGICK_DISK_LIMIT="${MAGICK_DISK_LIMIT:-8GiB}"
  export MAGICK_WIDTH_LIMIT="${MAGICK_WIDTH_LIMIT:-60KP}"
  export MAGICK_HEIGHT_LIMIT="${MAGICK_HEIGHT_LIMIT:-60KP}"
}

parse_pages
get_total_pages

convert_pages_one_by_one() {
  local page
  for ((page=start; page<=end; page++)); do
    echo "Converting page $page..."
    convert_single_page "$page"
  done
}

convert_single_page() {
  local page="$1"
  if command -v pdftoppm >/dev/null 2>&1; then
    convert_single_page_with_pdftoppm "$page"
  elif command -v magick >/dev/null 2>&1; then
    harden_imagemagick_env
    convert_single_page_with_imagemagick "$page"
  elif is_imagemagick_convert; then
    harden_imagemagick_env
    magick() { convert "$@"; }
    convert_single_page_with_imagemagick "$page"
  elif command -v gs >/dev/null 2>&1; then
    convert_single_page_with_ghostscript "$page"
  else
    error_no_rasterizer
  fi
}

convert_all_pages() {
  if command -v pdftoppm >/dev/null 2>&1; then
    convert_with_pdftoppm
  elif command -v magick >/dev/null 2>&1; then
    harden_imagemagick_env
    convert_with_imagemagick
  elif is_imagemagick_convert; then
    harden_imagemagick_env
    magick() { convert "$@"; }
    convert_with_imagemagick
  elif command -v gs >/dev/null 2>&1; then
    convert_with_ghostscript
  else
    error_no_rasterizer
  fi
}

convert_with_pdftoppm() {
  local args=( -png -r "$dpi" )
  if [ "$pages" != "all" ]; then
    args+=( -f "$start" -l "$end" )
  fi
  local native_pdf_file
  native_pdf_file=$(to_native_path "$pdf_file")
  local native_output_prefix
  native_output_prefix=$(to_native_path "$tmp_dir/slide")
  args+=( "$native_pdf_file" "$native_output_prefix" )
  pdftoppm "${args[@]}"
}

convert_single_page_with_pdftoppm() {
  local page="$1"
  local native_pdf_file
  native_pdf_file=$(to_native_path "$pdf_file")
  local output_prefix
  output_prefix=$(to_native_path "$tmp_dir/slide-${page}")
  pdftoppm -png -r "$dpi" -singlefile -f "$page" -l "$page" "$native_pdf_file" "$output_prefix"
}

convert_with_imagemagick() {
  local range=""
  if [ "$pages" != "all" ]; then
    if [ "$start" -eq "$end" ]; then
      range="[$((start - 1))]"
    else
      range="[$((start - 1))-$((end - 1))]"
    fi
  fi
  local native_pdf_file
  native_pdf_file=$(to_native_path "$pdf_file")
  local native_output_file
  native_output_file=$(to_native_path "$tmp_dir/slide-%03d.png")
  magick -limit thread 1 -density "$dpi" "$native_pdf_file$range" -define png:compression-level=6 "$native_output_file"
}

convert_single_page_with_imagemagick() {
  local page="$1"
  local native_pdf_file
  native_pdf_file=$(to_native_path "$pdf_file")
  local native_output_file
  native_output_file=$(to_native_path "$tmp_dir/slide-${page}.png")
  magick -limit thread 1 -density "$dpi" "$native_pdf_file[$((page - 1))]" -define png:compression-level=6 "$native_output_file"
}

convert_with_ghostscript() {
  local gs_args=( -dNOPAUSE -dBATCH -sDEVICE=pngalpha -r"$dpi" )
  if [ "$pages" != "all" ]; then
    gs_args+=( -dFirstPage="$start" -dLastPage="$end" )
  fi
  local native_pdf_file
  native_pdf_file=$(to_native_path "$pdf_file")
  local native_output_file
  native_output_file=$(to_native_path "$tmp_dir/slide-%03d.png")
  gs "${gs_args[@]}" -sOutputFile="$native_output_file" "$native_pdf_file"
}

convert_single_page_with_ghostscript() {
  local page="$1"
  local native_pdf_file
  native_pdf_file=$(to_native_path "$pdf_file")
  local native_output_file
  native_output_file=$(to_native_path "$tmp_dir/slide-${page}.png")
  gs -dNOPAUSE -dBATCH -sDEVICE=pngalpha -r"$dpi" -dFirstPage="$page" -dLastPage="$page" -sOutputFile="$native_output_file" "$native_pdf_file"
}

error_no_rasterizer() {
  if command -v convert >/dev/null 2>&1; then
    echo "Error: found Windows built-in 'convert' command, which is not ImageMagick. Install 'pdftoppm' (poppler), ImageMagick, or Ghostscript." >&2
  else
    echo "Error: no PDF rasterizer found. Install 'pdftoppm' (poppler), ImageMagick, or Ghostscript." >&2
  fi
  exit 1
}

if [ "$pages" = "all" ]; then
  convert_all_pages
else
  convert_pages_one_by_one
fi

move_converted_slides
next_slide_index=$((last_output_index + 1))
write_state

echo "Created ${copied_count:-0} slide images in '$out_dir' from '$pdf_file', starting at slide $((slide_offset + 1)) at ${dpi} DPI."