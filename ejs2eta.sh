#!/bin/bash

# Set -e to exit immediately if a command fails
set -e

# Set -o pipefail to catch errors in pipes
set -o pipefail

# Find all .ejs files, handle spaces/special chars, and rename
find . -type f -name "*.ejs" -print0 | while IFS= read -r -d $'\0' file; do
    new_file="${file%.ejs}.eta"

    # Check if the destination file already exists (prevent overwrites)
    if [[ -f "$new_file" ]]; then
        echo "Error: Destination file '$new_file' already exists. Skipping." >&2 # Send error to stderr
        continue # Skip to the next file
    fi

    # Rename the file and handle potential errors
    if mv "$file" "$new_file"; then
        echo "Renamed: '$file' -> '$new_file'"
    else
        echo "Error: Failed to rename '$file' to '$new_file'" >&2
    fi
done

echo "Finished processing files."