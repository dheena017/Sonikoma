import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  Sliders,
  Key,
  FileText,
  Youtube,
  Tags,
  BookOpenText,
} from "lucide-react";
import { GeneratedPanel } from "@/types";

// Import modular sub-components
import SeoAuditor from "@/features/creative_youtube/components/SeoAuditor";
import ProfileManager from "@/features/creative_youtube/components/ProfileManager";
import CredentialsConfig from "@/features/creative_youtube/components/CredentialsConfig";
import TitleOptimizer from "@/features/creative_youtube/components/TitleOptimizer";
import TagManager from "@/features/creative_youtube/components/TagManager";
import DescriptionEditor from "@/features/creative_youtube/components/DescriptionEditor";
import ChaptersTuner from "@/features/creative_youtube/components/ChaptersTuner";
import SocialsCustomizer from "@/features/creative_youtube/components/SocialsCustomizer";
import SelfRatingForm from "@/features/creative_youtube/components/SelfRatingForm";
import AdvancedSettings from "@/features/creative_youtube/components/AdvancedSettings";
import PublishMonitor from "@/features/creative_youtube/components/PublishMonitor";
import UploadHistory from "@/features/creative_youtube/components/UploadHistory";
import PlaylistSelector from "@/features/creative_youtube/components/PlaylistSelector";
import WebtoonMetadata from "@/features/creative_youtube/components/WebtoonMetadata";
import SubtitleConfig from "@/features/creative_youtube/components/SubtitleConfig";

// Import custom hook
import { useYouTubePublisher } from "@/features/creative_youtube/hooks/useYouTubePublisher";

import { useProjectStore } from "@/store/useProjectStore";

interface YouTubePageProps {
  panels: GeneratedPanel[];
  videoUrl: string | null;
  scrapedTitle?: string;
  scrapedGenre?: string;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

const YouTubePage = React.memo(
  ({
    panels = [],
    videoUrl,
    scrapedTitle = "",
    scrapedGenre = "",
    onNavigateHome,
    addNotification,
  }: YouTubePageProps) => {
    const activeProjectData = useProjectStore((state) => state.activeProjectData);
    const storePanels = activeProjectData?.panels || [];
    const safePanels = (panels && panels.length > 0) ? panels : (Array.isArray(storePanels) ? storePanels : []);
    const effectiveTitle = scrapedTitle || activeProjectData?.project?.title || "";
    const effectiveGenre = scrapedGenre || activeProjectData?.project?.genre || "";
    const effectiveVideoUrl = videoUrl || activeProjectData?.project?.video_url || null;
    const [activeTab, setActiveTab] = useState<
      "details" | "chapters_tags" | "comic_subtitles" | "settings" | "integrations"
    >("details");

    if (safePanels.length === 0) {
      return (
        <div className="flex-1 w-full px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
          <Youtube className="h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-neutral-450 font-mono text-sm font-semibold mb-1">
            No Panels Available
          </h3>
          <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
            Please import a series or add panels to your storyboard timeline to start publishing to YouTube.
          </p>
        </div>
      );
    }

    // Leverage custom logic hook
    const {
      title,
      setTitle,
      description,
      setDescription,
      tags,
      tagInput,
      setTagInput,
      category,
      setCategory,
      privacy,
      setPrivacy,
      isShort,
      setIsShort,
      showAdvanced,
      setShowAdvanced,
      madeForKids,
      setMadeForKids,
      paidPromotion,
      setPaidPromotion,
      license,
      setLicense,
      videoLanguage,
      setVideoLanguage,
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
      isScheduled,
      setIsScheduled,
      scheduleDate,
      setScheduleDate,
      scheduleTime,
      setScheduleTime,
      showSelfRating,
      setShowSelfRating,
      ratings,
      setRatings,
      suggestedTags,
      seoScore,
      seoChecks,
      isPublishing,
      publishLogs,
      youtubeUrl,
      isAiGenerating,
      selectedFile,
      localPreviewUrl,
      selectedThumbnail,
      thumbnailPreviewUrl,
      videoDuration,
      videoAspectRatio,
      activeVideoUrl,
      channelLink,
      setChannelLink,
      discordLink,
      setDiscordLink,
      patreonLink,
      setPatreonLink,
      playlist,
      setPlaylist,
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
      subtitlesType,
      setSubtitlesType,
      subtitlesLanguage,
      setSubtitlesLanguage,
      showSocialsConfig,
      setShowSocialsConfig,
      profiles,
      currentProfileName,
      uploadHistory,
      hasCustomCredentials,
      customClientId,
      customProjectId,
      showCredentialsConfig,
      setShowCredentialsConfig,
      handleSaveProfile,
      handleLoadProfile,
      handleDeleteProfile,
      handleClearForm,
      handleSaveCredentials,
      handleDeleteCredentials,
      handleAddTag,
      handleAddSuggestedTag,
      handleRemoveTag,
      handleFileChange,
      handleClearSelectedFile,
      handleThumbnailChange,
      handleClearThumbnail,
      handleInsertDisclaimer,
      handleInsertSocials,
      handleCompileChapters,
      handleApplyPresetTemplate,
      handleGenerateMetadata,
      handlePublish,
      handleInjectPowerWord,
      handleInsertMusicCredit,
      handleAppendTunedChapters,
      handleThumbnailSelect,
    } = useYouTubePublisher({
      panels: safePanels,
      videoUrl,
      scrapedTitle,
      scrapedGenre,
      addNotification,
    });

    return (
      <div className="flex-1 w-full space-y-6 animate-fade-in rounded-[24px] border border-white/10 bg-[#0b0b0e] p-5 sm:p-7 shadow-2xl">
        {/* PAGE HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-850 pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 shadow-lg shadow-red-950/30">
              <Youtube className="h-6 w-6 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-500/10 text-red-300 border border-red-500/20">
                  DISTRIBUTION • PUBLISHER
                </span>
                <span className="text-xs text-neutral-400 font-mono">• SEO Audit Score: {seoScore}/100</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                YouTube Publisher
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Direct YouTube channel publishing, automated metadata optimization, chapter compilation, and SEO auditing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-full bg-neutral-950 border border-neutral-850 text-neutral-300 text-xs font-mono flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPublishing ? "bg-amber-400 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
              <span>{isPublishing ? "Publishing Active" : "Publisher Ready"}</span>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN DIRECT PUBLISHER WORKSPACE GRID (5 : 7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* COLUMN 1 (LEFT - 5 COLS): STICKY VIDEO MONITOR */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4 self-start">
            {/* Video Monitor & Publish Execution */}
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
              onClearSelectedFile={handleClearSelectedFile}
              onClearThumbnail={handleClearThumbnail}
              onFileChange={handleFileChange}
              onThumbnailChange={handleThumbnailChange}
              onThumbnailSelect={handleThumbnailSelect}
              onPublish={handlePublish}
              isScheduled={isScheduled}
              setIsScheduled={setIsScheduled}
              scheduleDate={scheduleDate}
              setScheduleDate={setScheduleDate}
              scheduleTime={scheduleTime}
              setScheduleTime={setScheduleTime}
            />
          </div>

          {/* COLUMN 2 (RIGHT - 7 COLS): METADATA & CONFIGURATION CANVAS */}
          <div className="lg:col-span-7 rounded-2xl border border-neutral-850 bg-neutral-900/60 p-5 sm:p-6 shadow-xl flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-850 pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-bold">
                  DIRECT VIDEO PUBLISHER
                </p>
                <h4 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-400" /> YouTube Video Metadata & Details
                </h4>
              </div>
            </div>

            {/* Real-time SEO Auditor Score Banner */}
            <SeoAuditor seoScore={seoScore} seoChecks={seoChecks} />

            {/* Segmented 5-Tab Navigation Controller */}
            <div className="grid grid-cols-2 sm:grid-cols-5 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 shadow-inner gap-1">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer select-none text-center ${
                  activeTab === "details"
                    ? "bg-red-600 text-white shadow-md shadow-red-950/40"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                }`}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Details</span>
              </button>

              <button
                onClick={() => setActiveTab("chapters_tags")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer select-none text-center ${
                  activeTab === "chapters_tags"
                    ? "bg-red-600 text-white shadow-md shadow-red-950/40"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                }`}
              >
                <Tags className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Chapters &amp; Tags</span>
              </button>

              <button
                onClick={() => setActiveTab("comic_subtitles")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer select-none text-center ${
                  activeTab === "comic_subtitles"
                    ? "bg-red-600 text-white shadow-md shadow-red-950/40"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                }`}
              >
                <BookOpenText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Comic &amp; Captions</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer select-none text-center ${
                  activeTab === "settings"
                    ? "bg-red-600 text-white shadow-md shadow-red-950/40"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                }`}
              >
                <Sliders className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Settings</span>
              </button>

              <button
                onClick={() => setActiveTab("integrations")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer select-none text-center ${
                  activeTab === "integrations"
                    ? "bg-red-600 text-white shadow-md shadow-red-950/40"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                }`}
              >
                <Key className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Keys</span>
              </button>
            </div>

            {/* Tab Body Content */}
            <div className="space-y-4">
              {/* TAB 1: DETAILS (Title & Description) */}
              {activeTab === "details" && (
                <div className="space-y-4 animate-fade-in animate-duration-300">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <h3 className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono">
                      Title &amp; Video Description
                    </h3>
                    <button
                      onClick={handleGenerateMetadata}
                      disabled={isAiGenerating || isPublishing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-98 shadow-sm"
                    >
                      {isAiGenerating ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-red-400" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 animate-pulse text-red-400" />
                          <span>Generate with AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <TitleOptimizer
                      title={title}
                      setTitle={setTitle}
                      scrapedTitle={scrapedTitle}
                      scrapedGenre={scrapedGenre}
                      onInjectPowerWord={handleInjectPowerWord}
                    />

                    <DescriptionEditor
                      description={description}
                      setDescription={setDescription}
                      panels={safePanels}
                      onApplyPresetTemplate={handleApplyPresetTemplate}
                      onCompileChapters={handleCompileChapters}
                      onInsertDisclaimer={handleInsertDisclaimer}
                      onInsertSocials={handleInsertSocials}
                      onInsertMusicCredit={handleInsertMusicCredit}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: CHAPTERS & TAGS (Chapters Tuner & Tag Chip Manager) */}
              {activeTab === "chapters_tags" && (
                <div className="space-y-4 animate-fade-in animate-duration-300">
                  <div className="border-b border-neutral-800 pb-2">
                    <h3 className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono">
                      Chapters Timestamps &amp; SEO Tags
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <ChaptersTuner
                      panels={safePanels}
                      onInsertChapters={handleAppendTunedChapters}
                      addNotification={addNotification}
                    />

                    <TagManager
                      tags={tags}
                      tagInput={tagInput}
                      setTagInput={setTagInput}
                      onAddTag={handleAddTag}
                      onRemoveTag={handleRemoveTag}
                      onAddSuggestedTag={handleAddSuggestedTag}
                      suggestedTags={suggestedTags}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: COMIC & CAPTIONS (Webtoon Credits, Playlist, Subtitles) */}
              {activeTab === "comic_subtitles" && (
                <div className="space-y-4 animate-fade-in animate-duration-300">
                  <div className="border-b border-neutral-800 pb-2">
                    <h3 className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono">
                      Webtoon Metadata, Playlist &amp; Subtitles
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <WebtoonMetadata
                      authorName={authorName}
                      setAuthorName={setAuthorName}
                      artistName={artistName}
                      setArtistName={setArtistName}
                      webtoonPlatform={webtoonPlatform}
                      setWebtoonPlatform={setWebtoonPlatform}
                      customPlatform={customPlatform}
                      setCustomPlatform={setCustomPlatform}
                      chapterStart={chapterStart}
                      setChapterStart={setChapterStart}
                      chapterEnd={chapterEnd}
                      setChapterEnd={setChapterEnd}
                      chapterValidationError={chapterValidationError}
                    />

                    <PlaylistSelector
                      playlist={playlist}
                      setPlaylist={setPlaylist}
                      hasCustomCredentials={hasCustomCredentials}
                    />

                    <SubtitleConfig
                      subtitlesType={subtitlesType}
                      setSubtitlesType={setSubtitlesType}
                      subtitlesLanguage={subtitlesLanguage}
                      setSubtitlesLanguage={setSubtitlesLanguage}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: SETTINGS (Category, Privacy, Shorts, Self Rating, Advanced) */}
              {activeTab === "settings" && (
                <div className="space-y-4 animate-fade-in animate-duration-300">
                  <div className="border-b border-neutral-800 pb-2">
                    <h3 className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono">
                      Publish &amp; Audience Settings
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-neutral-400 font-bold block">
                          Video Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-neutral-950/40 border border-neutral-900 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 rounded-xl px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none transition-all cursor-pointer shadow-inner"
                        >
                          <option value="1" className="bg-neutral-950">Film &amp; Animation</option>
                          <option value="24" className="bg-neutral-950">Entertainment</option>
                          <option value="20" className="bg-neutral-950">Gaming</option>
                          <option value="23" className="bg-neutral-950">Comedy</option>
                          <option value="22" className="bg-neutral-950">People &amp; Blogs</option>
                          <option value="27" className="bg-neutral-950">Education</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-mono text-neutral-400 font-bold block">
                          Privacy Status
                        </label>
                        <select
                          value={privacy}
                          onChange={(e) => setPrivacy(e.target.value)}
                          className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 rounded-xl px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none transition-all cursor-pointer shadow-inner"
                        >
                          <option value="unlisted" className="bg-neutral-950">
                            Unlisted (Review First)
                          </option>
                          <option value="private" className="bg-neutral-950">Private</option>
                          <option value="public" className="bg-neutral-950">
                            Public (Immediate Publish)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-neutral-950/20 backdrop-blur-sm rounded-xl border border-neutral-900 transition-all hover:border-neutral-800">
                      <div className="space-y-0.5 pr-4">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                          <span>YouTube Shorts Format</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-red-950/25 text-red-400 rounded-md border border-red-900/40 uppercase">
                            Beta
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-relaxed font-sans">
                          Optimize video format description and hashtag indicators suited for vertical mobile feeds.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsShort(!isShort)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 shrink-0 ${
                          isShort ? "bg-[#FF0000]" : "bg-neutral-800"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                            isShort ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <SelfRatingForm
                      ratings={ratings}
                      setRatings={setRatings}
                      showSelfRating={showSelfRating}
                      setShowSelfRating={setShowSelfRating}
                    />

                    <AdvancedSettings
                      madeForKids={madeForKids}
                      setMadeForKids={setMadeForKids}
                      paidPromotion={paidPromotion}
                      setPaidPromotion={setPaidPromotion}
                      license={license}
                      setLicense={setLicense}
                      videoLanguage={videoLanguage}
                      setVideoLanguage={setVideoLanguage}
                      showAdvanced={showAdvanced}
                      setShowAdvanced={setShowAdvanced}
                      ageRestriction={ageRestriction}
                      setAgeRestriction={setAgeRestriction}
                      shortsRemixing={shortsRemixing}
                      setShortsRemixing={setShortsRemixing}
                      commentsMode={commentsMode}
                      setCommentsMode={setCommentsMode}
                      showLikes={showLikes}
                      setShowLikes={setShowLikes}
                      allowEmbedding={allowEmbedding}
                      setAllowEmbedding={setAllowEmbedding}
                      notifySubscribers={notifySubscribers}
                      setNotifySubscribers={setNotifySubscribers}
                      recordingDate={recordingDate}
                      setRecordingDate={setRecordingDate}
                      videoLocation={videoLocation}
                      setVideoLocation={setVideoLocation}
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: KEYS (Profiles, OAuth Credentials, Socials) */}
              {activeTab === "integrations" && (
                <div className="space-y-4 animate-fade-in animate-duration-300">
                  <div className="border-b border-neutral-800 pb-2">
                    <h3 className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono">
                      Profiles, Keys &amp; Integrations
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <ProfileManager
                      currentProfileName={currentProfileName}
                      profiles={profiles}
                      onSaveProfile={handleSaveProfile}
                      onLoadProfile={handleLoadProfile}
                      onDeleteProfile={handleDeleteProfile}
                      addNotification={addNotification}
                    />

                    <CredentialsConfig
                      hasCustomCredentials={hasCustomCredentials}
                      customClientId={customClientId}
                      customProjectId={customProjectId}
                      showCredentialsConfig={showCredentialsConfig}
                      setShowCredentialsConfig={setShowCredentialsConfig}
                      onSaveCredentials={handleSaveCredentials}
                      onDeleteCredentials={handleDeleteCredentials}
                    />

                    <SocialsCustomizer
                      channelLink={channelLink}
                      setChannelLink={setChannelLink}
                      discordLink={discordLink}
                      setDiscordLink={setDiscordLink}
                      patreonLink={patreonLink}
                      setPatreonLink={setPatreonLink}
                      showSocialsConfig={showSocialsConfig}
                      setShowSocialsConfig={setShowSocialsConfig}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Database Upload History */}
            <div className="pt-4 border-t border-neutral-850">
              <UploadHistory history={uploadHistory} />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default YouTubePage;
