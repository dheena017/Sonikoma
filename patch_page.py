import re

with open('frontend/src/components/Feature/editor/Tools/ImageEditor/ImageEditorPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("> {}} onApply={() => {}}>", ">")
content = content.replace("    <ImageEditorLayout \n      onClose={() => {}} \n      onApply={() => {}}\n      rightSidebar={", "    <ImageEditorLayout \n      onClose={() => {}} \n      onApply={() => {}}\n      rightSidebar={")

with open('frontend/src/components/Feature/editor/Tools/ImageEditor/ImageEditorPage.tsx', 'w') as f:
    f.write(content)
print("Patched ImageEditorPage.tsx successfully.")
