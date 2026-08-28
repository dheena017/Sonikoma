import React, { useEffect, useMemo, useState } from "react";
import { useCropEditorStore } from "@/features/editor_image/hooks/useImageEditorState";
import { useImageEditor } from "@/features/editor_image/hooks/useImageEditor";
import { useAppLogic } from "@/shared/hooks/useAppLogic";
import { ImageEditorHeader } from "@/features/editor_image/components/ImageEditorHeader";
import ImageEditorCanvasContainer from "@/features/editor_image/components/ImageEditorCanvasContainer";
import ImageEditorToolsPanel from "@/features/editor_image/components/ImageEditorToolsPanel";
import ImageEditorSidebar from "@/features/editor_image/components/ImageEditorSidebar";
import { ImageEditorLayout } from "@/features/editor_image/components/ImageEditorLayout";
import { ImageEditorEmptyState } from "@/features/editor_image/components/ImageEditorEmptyState";
import { GeneratedPanel } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageEditorPageProps {
  appLogic: ReturnType<typeof useAppLogic>;
  themeMode?: "dark" | "light";
  toggleThemeMode?: () => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (val: boolean) => void;
  navigateTo?: (path: string) => void;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
}

const ImageEditorPage = React.memo(
  ({
    appLogic,
    themeMode,
    toggleThemeMode,
    isSidebarOpen,
    setIsSidebarOpen,
    navigateTo,
    seriesSlug,
    chapterSlug,
  }: ImageEditorPageProps) => {
    const { editingImageIdx, setEditingImageIdx } = appLogic;
    const { activeTool, setActiveTool } = useCropEditorStore();
    const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(true);

    const [localSidebarOpen, setLocalSidebarOpen] = useState(false);
    const sidebarOpen =
      isSidebarOpen !== undefined ? isSidebarOpen : localSidebarOpen;
    const handleToggleSidebar = () => {
      if (setIsSidebarOpen) {
        setIsSidebarOpen(!isSidebarOpen);
      } else {
        setLocalSidebarOpen((prev) => !prev);
      }
    };

    // Lock body scrolling when sidebar drawer overlay is open
    useEffect(() => {
      if (sidebarOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [sidebarOpen]);

    // Auto-select the first image if the user opens the editor but hasn't picked one yet
    useEffect(() => {
      if (editingImageIdx === null && appLogic.scrapedImages?.length > 0) {
        setEditingImageIdx(0);
      }
    }, [editingImageIdx, appLogic.scrapedImages, setEditingImageIdx]);

    // Fallback sync: If scrapedImages is empty but panels exist, populate scrapedImages from panels
    useEffect(() => {
      if (
        (!appLogic.scrapedImages || appLogic.scrapedImages.length === 0) &&
        appLogic.panels &&
        appLogic.panels.length > 0
      ) {
        const extracted = appLogic.panels
          .map((p: any) => p.image_url || p.original_image_url)
          .filter(Boolean);
        if (extracted.length > 0) {
          appLogic.setScrapedImages(extracted);
          if (editingImageIdx === null) {
            setEditingImageIdx(0);
          }
        }
      }
    }, [
      appLogic.scrapedImages,
      appLogic.panels,
      appLogic.setScrapedImages,
      editingImageIdx,
      setEditingImageIdx,
    ]);

    // Load the editor logic
    const editorProps = useImageEditor({ appLogic });

    // Keyboard Arrow navigation for Previous / Next Image
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        if (e.key === "ArrowLeft") {
          editorProps.handlePrevImage();
        } else if (e.key === "ArrowRight") {
          editorProps.handleNextImage();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [editorProps]);

    const activeStoryboardPanel = useMemo(() => {
      if (editingImageIdx === null) return null;
      return (
        appLogic.panels?.find(
          (p: any) => p.image_url === appLogic.scrapedImages[editingImageIdx]
        ) || null
      );
    }, [appLogic.panels, appLogic.scrapedImages, editingImageIdx]);

    // Memoize the Heavy Canvas to prevent lag
    const canvasSubtree = useMemo(() => {
      if (editingImageIdx === null) return null;
      return (
        <ImageEditorCanvasContainer
          key={editorProps.imageUrl || undefined}
          activeStoryboardPanel={activeStoryboardPanel as unknown as GeneratedPanel}
          handleAiCrop={editorProps.handleAiCrop}
          isAiDetecting={editorProps.isAiDetecting}
          editingImageIdx={editingImageIdx}
          scrapedImages={appLogic.scrapedImages}
          setPanels={appLogic.setPanels}
          containerRef={editorProps.containerRef}
          editCropTop={appLogic.editCropTop}
          editCropBottom={appLogic.editCropBottom}
          editCropLeft={appLogic.editCropLeft}
          editCropRight={appLogic.editCropRight}
          slices={editorProps.slices}
          selectedSliceId={editorProps.selectedSliceId}
          showSplitPosition={editorProps.showSplitPosition}
          splitPosition={editorProps.splitPosition}
          splitLines={editorProps.splitLines}
          handleStart={editorProps.handleStart}
          handleMove={editorProps.handleMove}
          handleEnd={editorProps.handleEnd}
          isPointInsideSelection={editorProps.isPointInsideSelection}
          handleSelectSlice={editorProps.handleSelectSlice}
          handleDeleteSlice={editorProps.handleDeleteSlice}
          handleRemoveSplitLine={editorProps.handleRemoveSplitLine}
          dragType={editorProps.dragType}
          onResizeStart={editorProps.onResizeStart}
          handleSelectAndDragSlice={editorProps.handleSelectAndDragSlice}
          zoom={editorProps.zoom}
          editMode={editorProps.editMode}
          detectedBubbles={editorProps.detectedBubbles}
          selectedBubbleIdx={editorProps.selectedBubbleIdx}
          setSelectedBubbleIdx={editorProps.setSelectedBubbleIdx}
          brushSize={editorProps.brushSize}
          brushAction={editorProps.brushAction}
          canvasMaskRef={editorProps.canvasMaskRef}
          setSplitPosition={editorProps.setSplitPosition}
          setShowSplitPosition={editorProps.setShowSplitPosition}
          setEditCropTop={appLogic.setEditCropTop}
          setEditCropBottom={appLogic.setEditCropBottom}
          setEditCropLeft={appLogic.setEditCropLeft}
          setSelectedSliceId={editorProps.setSelectedSliceId}
          activeTab={editorProps.activeTab}
          aspectRatio={appLogic.aspectRatio}
          fillColor={editorProps.fillColor}
          textBgColor="#ffffff"
          handleUndo={editorProps.handleUndo}
          historyLength={editorProps.history.length}
          handleRedo={editorProps.handleRedo}
          redoHistoryLength={editorProps.redoHistory.length}
          handleDeleteCurrentImage={editorProps.handleDeleteCurrentImage}
          isPipMode={false}
          setIsPipMode={() => { } }
          isToolsPanelOpen={isToolsPanelOpen}
          setIsToolsPanelOpen={setIsToolsPanelOpen}
          setEditCropRight={appLogic.setEditCropRight}
          handleExecuteSave={editorProps.handleExecuteSave}
          navigateTo={navigateTo}
          seriesSlug={seriesSlug}
          chapterSlug={chapterSlug}
          setEditingImageIdx={appLogic.setEditingImageIdx}
          isSavingEdit={appLogic.isSavingEdit}
        />
      );
    }, [
      editorProps.imageUrl,
      editingImageIdx,
      editorProps.activeTab,
      appLogic.scrapedImages,
      editorProps.slices,
      editorProps.selectedSliceId,
      editorProps.showSplitPosition,
      editorProps.splitPosition,
      editorProps.splitLines,
      editorProps.zoom,
      editorProps.editMode,
      editorProps.detectedBubbles,
      editorProps.selectedBubbleIdx,
      editorProps.brushSize,
      editorProps.brushAction,
      editorProps.fillColor,
      appLogic.aspectRatio,
      appLogic.editCropTop,
      appLogic.editCropBottom,
      appLogic.editCropLeft,
      appLogic.editCropRight,
      editorProps.handleExecuteSave,
      navigateTo,
      seriesSlug,
      chapterSlug,
      appLogic.setEditingImageIdx,
      appLogic.isSavingEdit,
    ]);

    // Empty State if no images exist in the project yet
    if (!appLogic.scrapedImages || appLogic.scrapedImages.length === 0) {
      return (
        <ImageEditorEmptyState
          onImagesUploaded={(urls) => {
            appLogic.setScrapedImages(urls);
            setEditingImageIdx(0);
          }}
          onLoadSample={(dataUrl) => {
            appLogic.setScrapedImages([dataUrl]);
            setEditingImageIdx(0);
          }}
          navigateTo={navigateTo}
        />
      );
    }

    // Render standard inline layout (No Modal/Fixed overlays!)
    return (
      <ImageEditorLayout
        onToggleSidebar={handleToggleSidebar}
        navigateTo={navigateTo}
        projectId={
          new URLSearchParams(window.location.search).get("id") || null
        }
        seriesSlug={seriesSlug}
        chapterSlug={chapterSlug}
        scrapedCount={appLogic.scrapedImages?.length || 0}
        panelsCount={appLogic.panels?.length || 0}
        header={
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
            activeTab={activeTool}
            isPipMode={false}
            setIsPipMode={() => {}}
            slices={editorProps.slices}
            isToolsPanelOpen={isToolsPanelOpen}
            setIsToolsPanelOpen={setIsToolsPanelOpen}
            handleExecuteSave={editorProps.handleExecuteSave}
            user={appLogic.user}
            notifications={appLogic.notifications}
            markNotificationAsRead={appLogic.markNotificationAsRead}
            markAllNotificationsAsRead={appLogic.markAllNotificationsAsRead}
            deleteNotification={appLogic.deleteNotification}
            clearAllNotifications={appLogic.clearAllNotifications}
            notificationsMuted={appLogic.notificationsMuted}
            setNotificationsMuted={appLogic.setNotificationsMuted}
            themeMode={themeMode}
            toggleThemeMode={toggleThemeMode}
            onToggleSidebar={handleToggleSidebar}
            isSidebarOpen={sidebarOpen}
            navigateTo={navigateTo}
            seriesSlug={seriesSlug}
            chapterSlug={chapterSlug}
          />
        }
      >
        {/* Full Expanded Navigation Sidebar Drawer Overlay */}
        <ImageEditorSidebar
          isCollapsed={!sidebarOpen}
          setIsCollapsed={() => handleToggleSidebar()}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          scrapedCount={appLogic.scrapedImages?.length || 0}
          panelsCount={appLogic.panels?.length || 0}
          navigateTo={navigateTo}
          projectId={
            new URLSearchParams(window.location.search).get("id") || null
          }
          seriesSlug={seriesSlug}
          chapterSlug={chapterSlug}
        />

        <div className="flex-1 flex flex-row overflow-hidden w-full relative">
          {/* Left Tools Sidebar */}
          <aside
            className={`h-full bg-[#0a0b10] border-r border-white/8 flex-shrink-0 z-20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isToolsPanelOpen
                ? "w-[360px] lg:w-[420px] opacity-100"
                : "w-0 opacity-0 border-none"
            }`}
          >
            <div className="w-[360px] lg:w-[420px] h-full flex flex-col min-h-0 overflow-hidden">
              <ImageEditorToolsPanel
                setActiveTab={setActiveTool}
                slices={editorProps.slices}
                setSlices={editorProps.setSlices}
                editingImageIdx={editingImageIdx ?? 0}
                scrapedImages={appLogic.scrapedImages}
                isMerging={editorProps.isMerging}
                handleMergeWithNext={editorProps.handleMergeWithNext}
                editCropTop={appLogic.editCropTop}
                editCropBottom={appLogic.editCropBottom}
                editCropLeft={appLogic.editCropLeft}
                editCropRight={appLogic.editCropRight}
                setEditCropTop={appLogic.setEditCropTop}
                setEditCropBottom={appLogic.setEditCropBottom}
                setEditCropLeft={appLogic.setEditCropLeft}
                setEditCropRight={appLogic.setEditCropRight}
                zoom={editorProps.zoom}
                setZoom={editorProps.setZoom}
                isTransforming={editorProps.isTransforming}
                handleTransform={(action, param) =>
                  editorProps.handleTransform(
                    action as "rotate" | "flip",
                    param
                  )
                }
                handleResetCropBounds={editorProps.handleResetCropBounds}
                activeStoryboardPanel={
                  appLogic.panels?.find(
                    (p: any) =>
                      p.image_url === appLogic.scrapedImages[editingImageIdx!]
                  ) || null
                }
                handleModifyBrightness={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) =>
                      p.id === panelId ? { ...p, brightness: val } : p
                    )
                  )
                }
                handleModifyContrast={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) =>
                      p.id === panelId ? { ...p, contrast: val } : p
                    )
                  )
                }
                handleModifySaturation={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) =>
                      p.id === panelId ? { ...p, saturation: val } : p
                    )
                  )
                }
                handleModifyFilterPreset={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) =>
                      p.id === panelId ? { ...p, filter_preset: val } : p
                    )
                  )
                }
                handleModifyGrayscale={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) =>
                      p.id === panelId ? { ...p, grayscale: val } : p
                    )
                  )
                }
                handleModifyDuration={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) =>
                      p.id === panelId ? { ...p, duration: val } : p
                    )
                  )
                }
                handleModifyMotionType={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) =>
                      p.id === panelId ? { ...p, motion_type: val } : p
                    )
                  )
                }
                handleModifySpeechText={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) =>
                      p.id === panelId ? { ...p, speech_text: val } : p
                    )
                  )
                }
                handleModifyNarrative={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) =>
                      p.id === panelId ? { ...p, narrative: val } : p
                    )
                  )
                }
                handleModifyVisualDescription={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) =>
                      p.id === panelId ? { ...p, visual_description: val } : p
                    )
                  )
                }
                handleModifySfx={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) => (p.id === panelId ? { ...p, sfx: val } : p))
                  )
                }
                handleModifyCropPadding={(panelId, val) =>
                  appLogic.setPanels?.((prev: any[]) =>
                    prev.map((p) =>
                      p.id === panelId ? { ...p, crop_padding: val } : p
                    )
                  )
                }
                setScrapedImages={appLogic.setScrapedImages}
                setPanels={appLogic.setPanels}
                addNotification={appLogic.addNotification}
                fetchWithInterceptor={appLogic.fetchWithInterceptor}
                setConsoleLogs={appLogic.setConsoleLogs}
                editMode={editorProps.editMode}
                setEditMode={editorProps.setEditMode}
                brushSize={editorProps.brushSize}
                setBrushSize={editorProps.setBrushSize}
                brushAction={editorProps.brushAction}
                setBrushAction={editorProps.setBrushAction}
                handleClearBrushMask={editorProps.handleClearBrushMask}
                detectionStyle={editorProps.detectionStyle}
                setDetectionStyle={editorProps.setDetectionStyle}
                eraseMethod={editorProps.eraseMethod}
                setEraseMethod={editorProps.setEraseMethod}
                sensitivity={editorProps.sensitivity}
                setSensitivity={editorProps.setSensitivity}
                dilation={editorProps.dilation}
                setDilation={editorProps.setDilation}
                inpaintRadius={editorProps.inpaintRadius}
                setInpaintRadius={editorProps.setInpaintRadius}
                debugMode={editorProps.debugMode}
                setDebugMode={editorProps.setDebugMode}
                fillColor={editorProps.fillColor}
                setFillColor={editorProps.setFillColor}
                textBgColor="#ffffff"
                setTextBgColor={() => {}}
                ocrLang={editorProps.ocrLang}
                setOcrLang={editorProps.setOcrLang}
                gpu={editorProps.gpu}
                setGpu={editorProps.setGpu}
                morphKernelSize={editorProps.morphKernelSize}
                setMorphKernelSize={editorProps.setMorphKernelSize}
                morphShape={editorProps.morphShape}
                setMorphShape={editorProps.setMorphShape}
                useCustomColorTarget={editorProps.useCustomColorTarget}
                setUseCustomColorTarget={editorProps.setUseCustomColorTarget}
                customColorTarget={editorProps.customColorTarget}
                setCustomColorTarget={editorProps.setCustomColorTarget}
                customColorTolerance={editorProps.customColorTolerance}
                setCustomColorTolerance={editorProps.setCustomColorTolerance}
                splitPosition={editorProps.splitPosition}
                setSplitPosition={editorProps.setSplitPosition}
                splitLines={editorProps.splitLines}
                setSplitLines={editorProps.setSplitLines}
                showSplitPosition={editorProps.showSplitPosition}
                setShowSplitPosition={editorProps.setShowSplitPosition}
                setSelectedSliceId={editorProps.setSelectedSliceId}
                handleAddSplitLine={editorProps.handleAddSplitLine}
                handleRemoveSplitLine={editorProps.handleRemoveSplitLine}
                handleExecuteHorizontalSplit={
                  editorProps.handleExecuteHorizontalSplit
                }
                isSavingEdit={appLogic.isSavingEdit}
                imageUrl={editorProps.imageUrl}
                magneticSnap={editorProps.magneticSnap}
                setMagneticSnap={editorProps.setMagneticSnap}
                detectedGutters={editorProps.detectedGutters}
                setDetectedGutters={editorProps.setDetectedGutters}
                selectedSliceId={editorProps.selectedSliceId}
                editAutoTrim={appLogic.editAutoTrim}
                handlePushToSlices={editorProps.handlePushToSlices}
                autoPushOnDraw={editorProps.autoPushOnDraw}
                setAutoPushOnDraw={editorProps.setAutoPushOnDraw}
                handleClearAllSlices={editorProps.handleClearAllSlices}
                handleNudge={editorProps.handleNudge}
                handleSelectSlice={editorProps.handleSelectSlice}
                handleDeleteSlice={editorProps.handleDeleteSlice}
                handleCropSingleSlice={editorProps.handleCropSingleSlice}
                isCroppingSlice={editorProps.isCroppingSlice}
                handleDetectPanels={editorProps.handleDetectPanels}
                handleCancelDetect={editorProps.handleCancelDetect}
                isDetecting={editorProps.isDetecting}
                handleCommitDetectedBoxes={
                  editorProps.handleCommitDetectedBoxes
                }
                detectedBoxes={editorProps.detectedBoxes}
                handleClearDetectedBoxes={editorProps.handleClearDetectedBoxes}
                handleExecuteSave={editorProps.handleExecuteSave}
                handleSaveTrainingData={editorProps.handleSaveTrainingData}
                activeTab={activeTool as any}
              />
            </div>
          </aside>

          {/* Floating Sidebar Collapse/Expand Tab Button on the Border */}
          <button
            type="button"
            onClick={() => setIsToolsPanelOpen((prev) => !prev)}
            aria-label={
              isToolsPanelOpen ? "Collapse Tools Panel" : "Expand Tools Panel"
            }
            className={`absolute top-1/2 -translate-y-1/2 z-30 w-5 h-16 rounded-r-xl bg-[#141522]/95 hover:bg-[#202236] border-y border-r border-white/20 text-neutral-400 hover:text-white flex items-center justify-center shadow-[4px_0_16px_rgba(0,0,0,0.7)] transition-all duration-300 cursor-pointer group active:scale-95 ${
              isToolsPanelOpen ? "left-[360px] lg:left-[420px]" : "left-0"
            }`}
            title={
              isToolsPanelOpen ? "Collapse Tools Panel" : "Expand Tools Panel"
            }
          >
            {isToolsPanelOpen ? (
              <ChevronLeft className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-300 transition-transform group-hover:-translate-x-0.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-300 transition-transform group-hover:translate-x-0.5" />
            )}
          </button>

          {/* Center Canvas */}
          <main className="flex-1 h-full relative overflow-hidden bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#a855f7 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative w-full h-full z-10 flex items-center justify-center p-4">
              {canvasSubtree}
            </div>
          </main>
        </div>
      </ImageEditorLayout>
    );
  }
);

export default ImageEditorPage;
