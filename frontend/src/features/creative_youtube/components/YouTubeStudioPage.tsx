import React, { useState } from "react";
import { Youtube, Check } from "lucide-react";
import type { GeneratedPanel } from "@/types";
import YouTubeOfficialLogo from "./YouTubeOfficialLogo";
import PublishMonitor from "./PublishMonitor";
import YouTubeChannelHeader from "./YouTubeChannelHeader";
import StudioDetailsTab from "./studio/StudioDetailsTab";
import StudioElementsTab from "./studio/StudioElementsTab";
import StudioChecksTab from "./studio/StudioChecksTab";
import StudioVisibilityTab from "./studio/StudioVisibilityTab";

interface YouTubeStudioPageProps {
  // Video & File state
  activeVideoUrl: string | null;
  videoUrl: string | null;
  selectedFile: File | null;
  selectedThumbnail: File | null;
  thumbnailPreviewUrl: string | null;
  videoDuration: number | null;
  videoAspectRatio: string | null;
  isShort: boolean;
  setIsShort: (val: boolean) => void;

  // Metadata state
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  tags: string[];
  tagInput: string;
  setTagInput: (val: string) => void;
  suggestedTags: string[];
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  handleAddSuggestedTag: (tag: string) => void;
  category: string;
  setCategory: (val: string) => void;
  privacy: string;
  setPrivacy: (val: string) => void;

  // Scheduling
  isScheduled: boolean;
  setIsScheduled: (val: boolean) => void;
  scheduleDate: string;
  setScheduleDate: (val: string) => void;
  scheduleTime: string;
  setScheduleTime: (val: string) => void;

  // Webtoon Metadata
  authorName: string;
  setAuthorName: (val: string) => void;
  artistName: string;
  setArtistName: (val: string) => void;
  webtoonPlatform: string;
  setWebtoonPlatform: (val: string) => void;
  customPlatform: string;
  setCustomPlatform: (val: string) => void;
  chapterStart: string;
  setChapterStart: (val: string) => void;
  chapterEnd: string;
  setChapterEnd: (val: string) => void;
  chapterValidationError: string | null;

  // Subtitles & Playlist
  playlist: string;
  setPlaylist: (val: string) => void;
  subtitlesType: string;
  setSubtitlesType: (val: string) => void;
  subtitlesLanguage: string;
  setSubtitlesLanguage: (val: string) => void;

  // Ratings & Advanced
  ratings: {
    noLanguage: boolean;
    noViolence: boolean;
    noAdultContent: boolean;
    noHarmfulActs: boolean;
  };
  setRatings: React.Dispatch<
    React.SetStateAction<{
      noLanguage: boolean;
      noViolence: boolean;
      noAdultContent: boolean;
      noHarmfulActs: boolean;
    }>
  >;
  showSelfRating: boolean;
  setShowSelfRating: (val: boolean) => void;
  madeForKids: string;
  setMadeForKids: (val: string) => void;
  paidPromotion: boolean;
  setPaidPromotion: (val: boolean) => void;
  license: string;
  setLicense: (val: string) => void;
  videoLanguage: string;
  setVideoLanguage: (val: string) => void;
  showAdvanced: boolean;
  setShowAdvanced: (val: boolean) => void;
  ageRestriction: boolean;
  setAgeRestriction: (val: boolean) => void;
  shortsRemixing: string;
  setShortsRemixing: (val: string) => void;
  commentsMode: string;
  setCommentsMode: (val: string) => void;
  showLikes: boolean;
  setShowLikes: (val: boolean) => void;
  allowEmbedding: boolean;
  setAllowEmbedding: (val: boolean) => void;
  notifySubscribers: boolean;
  setNotifySubscribers: (val: boolean) => void;
  recordingDate: string;
  setRecordingDate: (val: string) => void;
  videoLocation: string;
  setVideoLocation: (val: string) => void;

  // SEO
  seoScore: number;
  seoChecks: any;

  // Publishing
  isPublishing: boolean;
  publishLogs: string[];
  youtubeUrl: string | null;
  isAiGenerating: boolean;
  hasCustomCredentials: boolean;

  // Handlers
  onClearSelectedFile: () => void;
  onClearThumbnail: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailSelect: (fileOrUrl: File | string, previewUrl?: string) => void;
  onPublish: () => void;
  onResetUploadState?: () => void;
  handleGenerateMetadata: () => void;
  handleInjectPowerWord: (word: string) => void;
  handleApplyPresetTemplate: (type: "recap" | "trailer") => void;
  handleCompileChapters: () => void;
  handleAppendTunedChapters: (text: string) => void;
  handleInsertDisclaimer: () => void;
  handleInsertSocials: () => void;
  handleInsertMusicCredit: (musicType: string) => void;

  // Context & UI
  safePanels: GeneratedPanel[];
  scrapedTitle?: string;
  scrapedGenre?: string;
  headerRefreshKey: number;
  setIsChannelModalOpen: (val: boolean) => void;
  addNotification?: (msg: string, type: any) => void;
}

type StudioStep = "details" | "elements" | "checks" | "visibility";

export default function YouTubeStudioPage({
  activeVideoUrl,
  videoUrl,
  selectedFile,
  selectedThumbnail,
  thumbnailPreviewUrl,
  videoDuration,
  videoAspectRatio,
  isShort,
  setIsShort,
  title,
  setTitle,
  description,
  setDescription,
  tags,
  tagInput,
  setTagInput,
  suggestedTags,
  handleAddTag,
  handleRemoveTag,
  handleAddSuggestedTag,
  category,
  setCategory,
  privacy,
  setPrivacy,
  isScheduled,
  setIsScheduled,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  authorName,
  setAuthorName,
  artistName,
  setArtistName,
  webtoonPlatform,
  setWebtoonPlatform,
  customPlatform,
  setCustomPlatform,
  chapterStart,
  setChapterStart,
  chapterEnd,
  setChapterEnd,
  chapterValidationError,
  playlist,
  setPlaylist,
  subtitlesType,
  setSubtitlesType,
  subtitlesLanguage,
  setSubtitlesLanguage,
  ratings,
  setRatings,
  showSelfRating,
  setShowSelfRating,
  madeForKids,
  setMadeForKids,
  paidPromotion,
  setPaidPromotion,
  license,
  setLicense,
  videoLanguage,
  setVideoLanguage,
  showAdvanced,
  setShowAdvanced,
  ageRestriction,
  setAgeRestriction,
  shortsRemixing,
  setShortsRemixing,
  commentsMode,
  setCommentsMode,
  showLikes,
  setShowLikes,
  allowEmbedding,
  setAllowEmbedding,
  notifySubscribers,
  setNotifySubscribers,
  recordingDate,
  setRecordingDate,
  videoLocation,
  setVideoLocation,
  seoScore,
  seoChecks,
  isPublishing,
  publishLogs,
  youtubeUrl,
  isAiGenerating,
  hasCustomCredentials,
  onClearSelectedFile,
  onClearThumbnail,
  onFileChange,
  onThumbnailChange,
  onThumbnailSelect,
  onPublish,
  onResetUploadState,
  handleGenerateMetadata,
  handleInjectPowerWord,
  handleApplyPresetTemplate,
  handleCompileChapters,
  handleAppendTunedChapters,
  handleInsertDisclaimer,
  handleInsertSocials,
  handleInsertMusicCredit,
  safePanels,
  scrapedTitle,
  scrapedGenre,
  headerRefreshKey,
  setIsChannelModalOpen,
  addNotification,
}: YouTubeStudioPageProps) {
  const [currentStep, setCurrentStep] = useState<StudioStep>("details");

  // Calculate step completeness
  const isDetailsDone = title.trim().length > 0;
  const isElementsDone =
    (safePanels && safePanels.length > 0) || authorName.trim().length > 0;
  const isChecksDone = seoScore >= 60 || tags.length > 0;

  const STEPS = [
    { id: "details", label: "Details", isDone: isDetailsDone, num: 1 },
    { id: "elements", label: "Video elements", isDone: isElementsDone, num: 2 },
    { id: "checks", label: "Checks", isDone: isChecksDone, num: 3 },
    { id: "visibility", label: "Visibility", isDone: false, num: 4 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. STUDIO TOP HEADER ── */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#14141E] border border-white/[0.08] rounded-2xl shadow-lg shadow-red-600/15 flex items-center justify-center">
            <YouTubeOfficialLogo className="w-6 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white font-sans tracking-tight">
                Upload video
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold uppercase">
                Studio
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              {title ? title : "Untitled video draft"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. CHANNEL INTEGRATION BANNER CARD ── */}
      <YouTubeChannelHeader
        key={headerRefreshKey}
        seoScore={seoScore}
        isPublishing={isPublishing}
        onOpenChannelModal={() => setIsChannelModalOpen(true)}
        addNotification={addNotification}
      />

      {/* ── 2. OFFICIAL YOUTUBE STUDIO HORIZONTAL STEPPER BAR ── */}
      <div className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-3xl mx-auto relative">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isCompleted = step.isDone && !isActive;

            return (
              <React.Fragment key={step.id}>
                {/* Step Node */}
                <button
                  onClick={() => setCurrentStep(step.id as StudioStep)}
                  className="flex items-center gap-2.5 group cursor-pointer focus:outline-none z-10"
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono transition-all duration-300 ${
                      isActive
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/50 ring-4 ring-red-600/20"
                        : isCompleted
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                        : "bg-neutral-800 text-neutral-400 group-hover:bg-neutral-700 group-hover:text-white"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span
                      className={`text-xs font-bold font-sans transition-colors block ${
                        isActive
                          ? "text-white"
                          : isCompleted
                          ? "text-emerald-400"
                          : "text-neutral-400 group-hover:text-neutral-200"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </button>

                {/* Connecting Line */}
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-[2px] mx-2 sm:mx-4 bg-neutral-800 relative overflow-hidden rounded-full">
                    <div
                      className={`h-full transition-all duration-500 ${
                        STEPS[idx + 1].isDone || isActive
                          ? "w-full bg-gradient-to-r from-red-600 to-rose-500"
                          : "w-0 bg-neutral-800"
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── 3. TWO-COLUMN WORKSPACE (Left: Sticky Video Monitor, Right: Step Content) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMN 1: Sticky Live Video Station & Preview Card */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4 self-start">
          <PublishMonitor
            activeVideoUrl={activeVideoUrl}
            videoUrl={videoUrl}
            selectedFile={selectedFile}
            selectedThumbnail={selectedThumbnail}
            thumbnailPreviewUrl={thumbnailPreviewUrl}
            videoDuration={videoDuration}
            videoAspectRatio={videoAspectRatio}
            isShort={isShort}
            privacy={privacy}
            publishLogs={publishLogs}
            isPublishing={isPublishing}
            youtubeUrl={youtubeUrl}
            title={title}
            onClearSelectedFile={onClearSelectedFile}
            onClearThumbnail={onClearThumbnail}
            onFileChange={onFileChange}
            onThumbnailChange={onThumbnailChange}
            onThumbnailSelect={onThumbnailSelect}
            onPublish={onPublish}
            onResetUploadState={onResetUploadState}
            onOpenChannelModal={() => setIsChannelModalOpen(true)}
            isScheduled={isScheduled}
            setIsScheduled={setIsScheduled}
            scheduleDate={scheduleDate}
            setScheduleDate={setScheduleDate}
            scheduleTime={scheduleTime}
            setScheduleTime={setScheduleTime}
          />
        </div>

        {/* COLUMN 2: Studio Step Content Canvas */}
        <div className="lg:col-span-7 rounded-3xl border border-neutral-800/80 bg-neutral-900/60 p-5 sm:p-7 shadow-2xl flex flex-col space-y-6">
          {/* ── STEP 1: DETAILS ── */}
          {currentStep === "details" && (
            <StudioDetailsTab
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              playlist={playlist}
              setPlaylist={setPlaylist}
              category={category}
              setCategory={setCategory}
              videoLanguage={videoLanguage}
              setVideoLanguage={setVideoLanguage}
              madeForKids={madeForKids}
              setMadeForKids={setMadeForKids}
              thumbnailPreviewUrl={thumbnailPreviewUrl}
              onThumbnailChange={onThumbnailChange}
              onThumbnailDirectSelect={(file, previewUrl) =>
                onThumbnailSelect(previewUrl)
              }
              onClearThumbnail={onClearThumbnail}
              hasCustomCredentials={hasCustomCredentials}
              isAiGenerating={isAiGenerating}
              isPublishing={isPublishing}
              handleGenerateMetadata={handleGenerateMetadata}
              handleCompileChapters={handleCompileChapters}
              handleInsertDisclaimer={handleInsertDisclaimer}
              handleInsertSocials={handleInsertSocials}
              onNext={() => setCurrentStep("elements")}
              addNotification={addNotification}
            />
          )}

          {/* ── STEP 2: VIDEO ELEMENTS ── */}
          {currentStep === "elements" && (
            <StudioElementsTab
              description={description}
              handleCompileChapters={handleCompileChapters}
              authorName={authorName}
              setAuthorName={setAuthorName}
              artistName={artistName}
              setArtistName={setArtistName}
              webtoonPlatform={webtoonPlatform}
              setWebtoonPlatform={setWebtoonPlatform}
              chapterStart={chapterStart}
              setChapterStart={setChapterStart}
              chapterEnd={chapterEnd}
              setChapterEnd={setChapterEnd}
              chapterValidationError={chapterValidationError}
              subtitlesType={subtitlesType}
              setSubtitlesType={setSubtitlesType}
              subtitlesLanguage={subtitlesLanguage}
              setSubtitlesLanguage={setSubtitlesLanguage}
              onBack={() => setCurrentStep("details")}
              onNext={() => setCurrentStep("checks")}
            />
          )}

          {/* ── STEP 3: CHECKS ── */}
          {currentStep === "checks" && (
            <StudioChecksTab
              seoScore={seoScore}
              tags={tags}
              tagInput={tagInput}
              setTagInput={setTagInput}
              suggestedTags={suggestedTags}
              handleAddTag={handleAddTag}
              handleRemoveTag={handleRemoveTag}
              handleAddSuggestedTag={handleAddSuggestedTag}
              ratings={ratings}
              setRatings={setRatings}
              onBack={() => setCurrentStep("elements")}
              onNext={() => setCurrentStep("visibility")}
            />
          )}

          {/* ── STEP 4: VISIBILITY ── */}
          {currentStep === "visibility" && (
            <StudioVisibilityTab
              privacy={privacy}
              setPrivacy={setPrivacy}
              isScheduled={isScheduled}
              setIsScheduled={setIsScheduled}
              scheduleDate={scheduleDate}
              setScheduleDate={setScheduleDate}
              scheduleTime={scheduleTime}
              setScheduleTime={setScheduleTime}
              isShort={isShort}
              setIsShort={setIsShort}
              isPublishing={isPublishing}
              activeVideoUrl={activeVideoUrl}
              title={title}
              onPublish={onPublish}
              onBack={() => setCurrentStep("checks")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
