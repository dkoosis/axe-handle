#!/bin/bash

find . -type f -print0 | while IFS= read -r -d $'\0' file; do
  # Get the relative path (optional, but good habit)
  actual_path=$(realpath --relative-to=. "$file")

  # macOS (BSD) sed command:
  # -i '': Edit in place with no backup (careful!)
  # -E: Extended regular expressions
  # s#...#...#: Substitution
  # ^//[[:space:]]+: Matches // followed by one or more spaces
  # ([a-zA-Z0-9_/.]+): Captures the path (NO escapes on parentheses)
  # // Path: \1: Replaces with // Path: and the captured path
  sed -i '' -E 's#^//[[:space:]]+([a-zA-Z0-9_/.]+)#// Path: \1#' "$file"

  # Check the exit status of the sed command
  if [ $? -eq 0 ]; then
    echo "Successfully updated: $file"
  else
    echo "Failed to update: $file"
  fi

done