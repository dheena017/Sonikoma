import re

with open('frontend/src/components/Feature/editor/Tools/ImageEditor/ImageEditorLayout.tsx', 'r') as f:
    content = f.read()

content = content.replace('interface ImageEditorLayoutProps {', 'interface ImageEditorLayoutProps {\n  rightSidebar?: React.ReactNode;')
content = content.replace('onApply \n}) => {', 'onApply,\n  rightSidebar \n}) => {')
content = content.replace('<ImageEditorRightSidebar />', '{rightSidebar || <ImageEditorRightSidebar />}')

with open('frontend/src/components/Feature/editor/Tools/ImageEditor/ImageEditorLayout.tsx', 'w') as f:
    f.write(content)
