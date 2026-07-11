import re

with open('frontend/src/components/Feature/editor/Tools/ImageEditor/ImageEditorPage.tsx', 'r') as f:
    content = f.read()

# Make sure ImageEditorLayout is imported
if "ImageEditorLayout" not in content:
    content = content.replace(
        'import { ImageEditorHeader } from "./ImageEditorHeader";',
        'import { ImageEditorHeader } from "./ImageEditorHeader";\nimport { ImageEditorLayout } from "./ImageEditorLayout";'
    )

# Replace the layout structure with ImageEditorLayout
old_layout_start = content.find('  // Render standard inline layout (No Modal/Fixed overlays!)\n  return (\n    <div className="w-full h-full bg-[#0B0F19] text-white flex flex-col overflow-hidden relative">')

if old_layout_start != -1:
    print("Found old layout")
else:
    print("Old layout start not found")
