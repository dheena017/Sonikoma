from pathlib import Path
import os

base = Path('frontend/src/components/crop')
move_map = {
    'AutoSlicer': 'auto/AutoSlicer',
    'AutoSlicerCanny': 'auto/AutoSlicerCanny',
    'AutoSlicerSettings': 'auto/AutoSlicerSettings',
    'bubblePresets': 'auto/bubblePresets',
    'CanvasBrushLayer': 'canvas/CanvasBrushLayer',
    'CanvasBubbleBoxes': 'canvas/CanvasBubbleBoxes',
    'CanvasCropSelection': 'canvas/CanvasCropSelection',
    'CanvasSplitLines': 'canvas/CanvasSplitLines',
    'CropCanvas': 'canvas/CropCanvas',
    'CleanBubblesAdvanced': 'clean/CleanBubblesAdvanced',
    'CleanBubblesHistory': 'clean/CleanBubblesHistory',
    'CleanBubblesManual': 'clean/CleanBubblesManual',
    'CleanBubblesModes': 'clean/CleanBubblesModes',
    'CleanBubblesPanel': 'clean/CleanBubblesPanel',
    'CleanBubblesPresets': 'clean/CleanBubblesPresets',
    'CropEditorCanvasContainer': 'editor/CropEditorCanvasContainer',
    'CropEditorFooter': 'editor/CropEditorFooter',
    'CropEditorHeader': 'editor/CropEditorHeader',
    'CropEditorSidebar': 'editor/CropEditorSidebar',
    'CropToolsPanel': 'editor/CropToolsPanel',
    'CutsRegistry': 'cuts/CutsRegistry',
    'CutsRegistryFineTune': 'cuts/CutsRegistryFineTune',
    'CutsRegistryHeader': 'cuts/CutsRegistryHeader',
    'CutsRegistryList': 'cuts/CutsRegistryList',
    'CutsRegistrySelector': 'cuts/CutsRegistrySelector',
    'EnhancementsAudio': 'enhancements/EnhancementsAudio',
    'EnhancementsCinematic': 'enhancements/EnhancementsCinematic',
    'EnhancementsColors': 'enhancements/EnhancementsColors',
    'EnhancementsPanel': 'enhancements/EnhancementsPanel',
    'EnhancementsPresets': 'enhancements/EnhancementsPresets',
    'gutterScanner': 'utils/gutterScanner',
    'HorizontalSplitter': 'horizontal/HorizontalSplitter',
    'HorizontalSplitterControls': 'horizontal/HorizontalSplitterControls',
    'HorizontalSplitterPresets': 'horizontal/HorizontalSplitterPresets',
    'HorizontalSplitterPreview': 'horizontal/HorizontalSplitterPreview',
    'MergePanel': 'merge/MergePanel',
    'MergePanelList': 'merge/MergePanelList',
    'MergePanelOptions': 'merge/MergePanelOptions',
    'RangeSlider': 'shared/RangeSlider',
    'SectionTitle': 'shared/SectionTitle',
    'types': 'shared/types',
}

root_stubs = {
    'CropEditorHeader.tsx': 'export { default } from "./editor/CropEditorHeader";\n',
    'CropEditorFooter.tsx': 'export { default } from "./editor/CropEditorFooter";\n',
    'CropEditorCanvasContainer.tsx': 'export { default } from "./editor/CropEditorCanvasContainer";\n',
    'CropEditorSidebar.tsx': 'export { default } from "./editor/CropEditorSidebar";\n',
    'CropToolsPanel.tsx': 'export { default } from "./editor/CropToolsPanel";\n',
    'SectionTitle.tsx': 'export { default } from "./shared/SectionTitle";\n',
    'types.ts': 'export * from "./shared/types";\n',
}

# Update imports in moved files
for filepath in sorted(base.rglob('*')):
    if filepath.is_file() and filepath.suffix in {'.ts', '.tsx'} and filepath.parent != base:
        text = filepath.read_text(encoding='utf-8')
        original = text
        for old_name, new_rel in move_map.items():
            for quote in ['"', "'"]:
                for ext in ['', '.js', '.tsx', '.ts']:
                    old_path = f'from {quote}./{old_name}{ext}{quote}'
                    if old_path in text:
                        target = base / new_rel
                        rel_path = os.path.relpath(target, filepath.parent).replace('\\', '/')
                        if not rel_path.startswith('.'):
                            rel_path = './' + rel_path
                        new_import = f'from {quote}{rel_path}{ext}{quote}'
                        text = text.replace(old_path, new_import)
                for prefix in ['..', '../..', '../../..']:
                    old_path = f'from {quote}{prefix}/{old_name}{quote}'
                    if old_path in text:
                        target = base / new_rel
                        rel_path = os.path.relpath(target, filepath.parent).replace('\\', '/')
                        if not rel_path.startswith('.'):
                            rel_path = './' + rel_path
                        text = text.replace(old_path, f'from {quote}{rel_path}{quote}')
                    old_path = f'from {quote}{prefix}/{old_name}.js{quote}'
                    if old_path in text:
                        target = base / new_rel
                        rel_path = os.path.relpath(target, filepath.parent).replace('\\', '/')
                        if not rel_path.startswith('.'):
                            rel_path = './' + rel_path
                        text = text.replace(old_path, f'from {quote}{rel_path}.js{quote}')
        if text != original:
            filepath.write_text(text, encoding='utf-8')

# Create root stub files for external imports
for stub_name, stub_content in root_stubs.items():
    stub_path = base / stub_name
    stub_path.write_text(stub_content, encoding='utf-8')

print('Update complete')
