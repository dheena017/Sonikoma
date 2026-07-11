import re

with open('frontend/src/components/Feature/editor/Tools/ImageEditor/ImageEditorPage.tsx', 'r') as f:
    content = f.read()

# Add ImageEditorLayout import
if 'import { ImageEditorLayout }' not in content:
    content = content.replace(
        'import { ImageEditorHeader } from "./ImageEditorHeader";',
        'import { ImageEditorHeader } from "./ImageEditorHeader";\nimport { ImageEditorLayout } from "./ImageEditorLayout";'
    )

old_layout_str = """  // Render standard inline layout (No Modal/Fixed overlays!)
  return (
    <div className="w-full h-full bg-[#0B0F19] text-white flex flex-col overflow-hidden relative">
      <ImageEditorHeader
        editingImageIdx={editingImageIdx ?? 0}
        scrapedImages={appLogic.scrapedImages}
        handlePrevImage={editorProps.handlePrevImage}
        handleNextImage={editorProps.handleNextImage}
        handleUndo={editorProps.handleUndo}
        historyLength={editorProps.history.length}
        handleRedo={editorProps.handleRedo}
        redoHistoryLength={editorProps.redoHistory.length}
        handleDeleteCurrentImage={editorProps.handleDeleteCurrentImage}
        setEditingImageIdx={setEditingImageIdx}
        activeTab={editorProps.activeTab}
        isPipMode={false}
        setIsPipMode={() => {}}
        slices={editorProps.slices}
        isToolsPanelOpen={isToolsPanelOpen}
        setIsToolsPanelOpen={setIsToolsPanelOpen}
      />

      <div className="flex-1 flex flex-row overflow-hidden w-full relative">

        {/* Left Column: Mini Sidebar */}
        <aside className="w-20 h-full bg-[#121826] border-r border-gray-800 flex-shrink-0 z-10">
          <ImageEditorMiniSidebar />
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 h-full relative overflow-hidden bg-black/50 flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(#374151 1px, transparent 0)", backgroundSize: "20px 20px" }}
          />
          <div className="relative w-full h-full z-10 flex items-center justify-center p-4">
            {canvasSubtree}
          </div>
        </main>

        {/* Right Tools Sidebar */}
        <aside
          className={`h-full bg-[#121826] border-l border-gray-800 flex-shrink-0 z-20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isToolsPanelOpen ? "w-[360px] lg:w-[420px] opacity-100" : "w-0 opacity-0 border-none"
          }`}
        >
          <div className="w-[360px] lg:w-[420px] h-full overflow-y-auto custom-scrollbar p-5">
              <ImageEditorSidebar"""

new_layout_str = """  // Render standard inline layout using ImageEditorLayout
  return (
    <ImageEditorLayout onClose={() => {}} onApply={() => {}}>
      <div className="absolute inset-0 flex flex-col z-10">
        <ImageEditorHeader
          editingImageIdx={editingImageIdx ?? 0}
          scrapedImages={appLogic.scrapedImages}
          handlePrevImage={editorProps.handlePrevImage}
          handleNextImage={editorProps.handleNextImage}
          handleUndo={editorProps.handleUndo}
          historyLength={editorProps.history.length}
          handleRedo={editorProps.handleRedo}
          redoHistoryLength={editorProps.redoHistory.length}
          handleDeleteCurrentImage={editorProps.handleDeleteCurrentImage}
          setEditingImageIdx={setEditingImageIdx}
          activeTab={editorProps.activeTab}
          isPipMode={false}
          setIsPipMode={() => {}}
          slices={editorProps.slices}
          isToolsPanelOpen={isToolsPanelOpen}
          setIsToolsPanelOpen={setIsToolsPanelOpen}
        />
        <div className="flex-1 w-full h-full relative flex items-center justify-center p-4">
          {canvasSubtree}
        </div>
      </div>

      {/*
        Note: The ImageEditorLayout expects its children to just be the canvas content,
        and it renders ImageEditorMiniSidebar and ImageEditorRightSidebar internally.
        However, since ImageEditorPage passes many props to ImageEditorSidebar,
        and we need to preserve that logic, we will replace ImageEditorLayout's internal RightSidebar
        by rendering ImageEditorSidebar here in a hidden portal or pass it directly.
        Let's instead update ImageEditorLayout to accept a right sidebar prop or we just override the layout structure.
      */}
      {/* Right Sidebar logic handled inline to preserve props until a refactor */}
      <ImageEditorSidebar"""

if old_layout_str in content:
    content = content.replace(old_layout_str, new_layout_str)

    closing_tags = """          </div>
        </aside>
      </div>
    </div>
  );
});"""
    new_closing_tags = """
    </ImageEditorLayout>
  );
});"""
    content = content.replace(closing_tags, new_closing_tags)

    with open('frontend/src/components/Feature/editor/Tools/ImageEditor/ImageEditorPage.tsx', 'w') as f:
        f.write(content)
    print("Patched ImageEditorPage.tsx")
else:
    print("Could not find layout string")
