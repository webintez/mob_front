import os
import re

VERSION = "1769841025"
DIRECTORIES = [
    "/home/u934861248/domains/mobitez.com/public_html",
    "/home/u934861248/domains/mobitez.com/public_html/public"
]

def update_html_files(directory):
    for root, dirs, files in os.walk(directory):
        # Don't go deeper into subdirectories (like node_modules) unless it's the root itself
        if root != directory and directory == DIRECTORIES[0] and "public" not in root:
             continue
        
        for file in files:
            if file.endswith(".html"):
                filepath = os.path.join(root, file)
                print(f"Processing {filepath}...")
                
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Regex to find <script src="/js/..."> tags
                # It handles both ' and " quotes, and checks if ?v= is already present
                
                def replace_script(match):
                    full_tag = match.group(0)
                    src = match.group(2)
                    
                    # Only version local JS files starting with /js/ or js/
                    if src.startswith("/js/") or src.startswith("js/"):
                        # Remove existing version param if present
                        base_src = src.split('?')[0]
                        new_src = f"{base_src}?v={VERSION}"
                        return full_tag.replace(src, new_src)
                    
                    return full_tag

                # Pattern matches <script ... src=["']...["'] ...>
                pattern = r'<script\b[^>]*?\bsrc\s*=\s*(["\'])(.*?)\1[^>]*?>'
                new_content = re.sub(pattern, replace_script, content)
                
                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"  Updated script tags in {file}")

if __name__ == "__main__":
    for directory in DIRECTORIES:
        if os.path.exists(directory):
            update_html_files(directory)
    print("Done!")
