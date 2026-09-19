const fs = require('fs');
const path = require('path');

const VERSION = "1773128101";
const DIRECTORIES = [
    "/home/u934861248/domains/mobitez.com/public_html"
];

function updateHtmlFiles(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
        const filepath = path.join(directory, file);
        const stat = fs.statSync(filepath);
        
        if (stat.isDirectory()) {
            // Only recurse into public/ if needed, or stay at root level to avoid node_modules
            if (file === 'public') {
                updateHtmlFiles(filepath);
            }
        } else if (file.endsWith('.html')) {
            console.log(`Processing ${filepath}...`);
            let content = fs.readFileSync(filepath, 'utf8');
            
            // Regex to match <script ... src=["']...["'] ...>
            const pattern = /<script\b[^>]*?\bsrc\s*=\s*(["'])(.*?)\1[^>]*?>/gi;
            
            let updated = false;
            const newContent = content.replace(pattern, (match, quote, src) => {
                if (src.startsWith('/js/') || src.startsWith('js/')) {
                    const baseSrc = src.split('?')[0];
                    const newSrc = `${baseSrc}?v=${VERSION}`;
                    updated = true;
                    return match.replace(src, newSrc);
                }
                return match;
            });
            
            if (updated && newContent !== content) {
                fs.writeFileSync(filepath, newContent, 'utf8');
                console.log(`  Updated script tags in ${file}`);
            }
        }
    }
}

for (const dir of DIRECTORIES) {
    if (fs.existsSync(dir)) {
        updateHtmlFiles(dir);
    }
}
console.log("Done!");
