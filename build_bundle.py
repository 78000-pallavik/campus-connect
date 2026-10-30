import re

# Read files in dependency order
files_order = [
    'js/Graph.js',
    'js/algorithms/BFS.js',
    'js/algorithms/DFS.js',
    'js/algorithms/SetOperations.js',
    'js/algorithms/RecommendationEngine.js',
    'js/algorithms/EvaluatorSuite.js',
    'js/data/presets.js',
    'js/components/CanvasManager.js',
    'js/components/PlaybackController.js',
    'js/components/QuadFeed.js',
    'js/components/StudentModal.js',
    'js/app.js'
]

bundle_parts = [
    "/**\n * CampusConnect (UniGraph) - Standalone Universal Bundle\n * Supports both file:// and http:// execution without CORS restrictions\n */\n(function() {\n'use strict';\n"
]

for f in files_order:
    content = open(f, 'r', encoding='utf-8').read()
    # Strip imports
    content = re.sub(r'import\s+[\s\S]*?from\s+[\'"][^\'"]+[\'"];?', '', content)
    # Strip exports
    content = re.sub(r'export\s+(class|const|function|let|var)', r'\1', content)
    content = re.sub(r'export\s+default\s+', '', content)
    content = re.sub(r'export\s*\{[\s\S]*?\};?', '', content)
    bundle_parts.append(f"// ================================\n// Source: {f}\n// ================================\n" + content + "\n")

bundle_parts.append("\n})();\n")

bundle_code = "\n".join(bundle_parts)

with open('js/bundle.js', 'w', encoding='utf-8') as out:
    out.write(bundle_code)

print("Created js/bundle.js with length:", len(bundle_code))
