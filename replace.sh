#!/bin/bash

OLD="mobitez"
NEW="mobitez"

echo "🚀 Starting replace: '$OLD' → '$NEW'"
echo "--------------------------------------"

# 1. Replace inside file contents
echo "🔍 Updating file contents..."
grep -rl --exclude-dir=.git "$OLD" . | while read -r file; do
    echo "✏️  Updating content in: $file"
    sed -i "s/${OLD}/${NEW}/g" "$file"
done

echo "--------------------------------------"

# 2. Rename files
echo "📁 Renaming files..."
find . -type f -name "*${OLD}*" | while read -r file; do
    newfile=$(echo "$file" | sed "s/${OLD}/${NEW}/g")
    echo "🔁 File: $file → $newfile"
    mv "$file" "$newfile"
done

echo "--------------------------------------"

# 3. Rename directories
echo "📂 Renaming directories..."
find . -depth -type d -name "*${OLD}*" | while read -r dir; do
    newdir=$(echo "$dir" | sed "s/${OLD}/${NEW}/g")
    echo "🔁 Dir: $dir → $newdir"
    mv "$dir" "$newdir"
done

echo "--------------------------------------"
echo "✅ Done! All '$OLD' replaced with '$NEW'"
