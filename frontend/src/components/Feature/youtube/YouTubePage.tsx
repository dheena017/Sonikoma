import React, { useState } from "react";
import {
  Youtube,
  Sparkles,
  Loader2,
  ArrowLeft,
  Sliders,
  Key,
  FileText,
  Trash2,
} from "lucide-react";
import { GeneratedPanel } from "../../../types.js";

// Import modular sub-components
import SeoAuditor from "./SeoAuditor.js";
import ProfileManager from "./ProfileManager.js";
import CredentialsConfig from "./CredentialsConfig.js";
import TitleOptimizer from "./TitleOptimizer.js";
import TagManager from "./TagManager.js";
import DescriptionEditor from "./DescriptionEditor.js";
import ChaptersTuner from "./ChaptersTuner.js";
import SocialsCustomizer from "./SocialsCustomizer.js";
import SelfRatingForm from "./SelfRatingForm.js";
import AdvancedSettings from "./AdvancedSettings.js";
import PublishMonitor from "./PublishMonitor.js";
import UploadHistory from "./UploadHistory.js";
import PlaylistSelector from "./PlaylistSelector.js";
import WebtoonMetadata from "./WebtoonMetadata.js";
import SubtitleConfig from "./SubtitleConfig.js";

// Import custom hook
import { useYouTubePublisher } from "./hooks/useYouTubePublisher.js";

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
    panels,
    videoUrl,
    scrapedTitle = "",
    scrapedGenre = "",
    onNavigateHome,
    addNotification,
  }: YouTubePageProps) => {
    const [activeTab, setActiveTab] = useState<
      "details" | "settings" | "integrations"
    >("details");

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
      panels,
      videoUrl,
      scrapedTitle,
      scrapedGenre,
      addNotification,
    });

    return (
      <div className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in animate-duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-855 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all hover:bg-neutral-855 cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              title="Back to Workspace"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Youtube className="h-6 w-6 text-[#FF0000]" />
                YouTube Publisher Studio
              </h2>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Customize video tags, title descriptions, and configure direct
                exports
              </p>
            </div>
          </div>

          <button
            onClick={handleClearForm}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-855 text-neutral-400 hover:text-rose-455 hover:border-rose-900/50 hover:bg-rose-955/20 rounded-xl text-xs font-bold font-mono transition-all hover:scale-102 active:scale-98 shadow-sm cursor-pointer self-start md:self-center"
            title="Clear all form fields"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Form</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Metadata Config Form & Navigation Tabs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Real-time SEO Auditor Score Banner */}
            <SeoAuditor seoScore={seoScore} seoChecks={seoChecks} />

            {/* Premium Glassmorphic Tab Selector */}
            <div className="flex bg-neutral-950/80 p-1.5 rounded-2xl border border-neutral-850 gap-1.5 shadow-inner">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-grow flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all duration-305 cursor-pointer select-none ${
                  activeTab === "details"
                    ? "bg-purple-605 text-white shadow-lg shadow-purple-950/50 scale-[1.02]"
                    : "text-neutral-400 hover:text-neutral-205 hover:bg-neutral-900/40"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Details & Content</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-grow flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all duration-305 cursor-pointer select-none ${
                  activeTab === "settings"
                    ? "bg-purple-650 text-white shadow-lg shadow-purple-950/50 scale-[1.02]"
                    : "text-neutral-400 hover:text-neutral-205 hover:bg-neutral-900/40"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Publish Settings</span>
              </button>

              <button
                onClick={() => setActiveTab("integrations")}
                className={`flex-grow flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all duration-305 cursor-pointer select-none ${
                  activeTab === "integrations"
                    ? "bg-purple-650 text-white shadow-lg shadow-purple-950/50 scale-[1.02]"
                    : "text-neutral-400 hover:text-neutral-205 hover:bg-neutral-900/40"
                }`}
              >
                <Key className="h-3.5 w-3.5" />
                <span>Profiles & Keys</span>
              </button>
            </div>

            {/* Tab Content Container */}
            <div className="bg-neutral-900/20 border border-neutral-850 rounded-3xl p-6 shadow-xl relative min-h-[420px] transition-all duration-300">
              {activeTab === "details" && (
                <div className="space-y-6 animate-fade-in animate-duration-300">
                  <div className="flex items-center justify-between border-b border-neutral-850/60 pb-3">
                    <h3 className="text-sm font-bold text-white tracking-wider uppercase font-mono">
                      Video Details
                    </h3>
                    <button
                      onClick={handleGenerateMetadata}
                      disabled={isAiGenerating || isPublishing}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-950/40 border border-purple-850 text-purple-300 hover:text-purple-200 hover:bg-purple-900/40 text-[11px] font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isAiGenerating ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          <span>Generate with AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-5">
                    {/* Title field with Clickbait Power Words & Title Optimizer suggestions */}
                    <TitleOptimizer
                      title={title}
                      setTitle={setTitle}
                      scrapedTitle={scrapedTitle}
                      scrapedGenre={scrapedGenre}
                      onInjectPowerWord={handleInjectPowerWord}
                    />

                    {/* Description field sub-component */}
                    <DescriptionEditor
                      description={description}
                      setDescription={setDescription}
                      panels={panels}
                      onApplyPresetTemplate={handleApplyPresetTemplate}
                      onCompileChapters={handleCompileChapters}
                      onInsertDisclaimer={handleInsertDisclaimer}
                      onInsertSocials={handleInsertSocials}
                      onInsertMusicCredit={handleInsertMusicCredit}
                    />

                    {/* Playlist selection */}
                    <PlaylistSelector
                      playlist={playlist}
                      setPlaylist={setPlaylist}
                      hasCustomCredentials={hasCustomCredentials}
                    />

                    {/* Webtoon Source Metadata */}
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

                    {/* Subtitle / Caption Tracks */}
                    <SubtitleConfig
                      subtitlesType={subtitlesType}
                      setSubtitlesType={setSubtitlesType}
                      subtitlesLanguage={subtitlesLanguage}
                      setSubtitlesLanguage={setSubtitlesLanguage}
                    />

                    {/* Chapters timeline offset tuner */}
                    <ChaptersTuner
                      panels={panels}
                      onInsertChapters={handleAppendTunedChapters}
                      addNotification={addNotification}
                    />

                    {/* Tag chip manager sub-component */}
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

              {activeTab === "settings" && (
                <div className="space-y-6 animate-fade-in animate-duration-300">
                  <div className="border-b border-neutral-850/60 pb-3">
                    <h3 className="text-sm font-bold text-white tracking-wider uppercase font-mono">
                      Publish & Audience Settings
                    </h3>
                  </div>

                  <div className="space-y-5">
                    {/* Category and Privacy Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono text-neutral-400 font-bold block">
                          Video Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-black/50 border border-neutral-855 rounded-xl px-4 py-3 text-xs text-neutral-305 focus:outline-none focus:border-purple-500/80 transition-all cursor-pointer"
                        >
                          <option value="1">Film & Animation</option>
                          <option value="24">Entertainment</option>
                          <option value="20">Gaming</option>
                          <option value="23">Comedy</option>
                          <option value="22">People & Blogs</option>
                          <option value="27">Education</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-mono text-neutral-400 font-bold block">
                          Privacy Status
                        </label>
                        <select
                          value={privacy}
                          onChange={(e) => setPrivacy(e.target.value)}
                          className="w-full bg-black/50 border border-neutral-855 rounded-xl px-4 py-3 text-xs text-neutral-305 focus:outline-none focus:border-purple-500/80 transition-all cursor-pointer"
                        >
                          <option value="unlisted">
                            Unlisted (Review First)
                          </option>
                          <option value="private">Private</option>
                          <option value="public">
                            Public (Immediate Publish)
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Shorts Toggle */}
                    <div className="flex items-center justify-between p-4 bg-neutral-950/60 rounded-xl border border-neutral-900/60 transition-all hover:border-neutral-800">
                      <div className="space-y-0.5 pr-4">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                          <span>YouTube Shorts Format</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-955 text-red-400 rounded border border-red-900/60 uppercase">
                            Beta
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-450 leading-relaxed font-sans">
                          Optimize video format description and hashtag
                          indicators suited for vertical mobile feeds.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsShort(!isShort)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                          isShort ? "bg-[#FF0000]" : "bg-neutral-800"
                        }`}
                      >
                        <div
                          className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                            isShort ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Monetization Self-Rating Checklist */}
                    <SelfRatingForm
                      ratings={ratings}
                      setRatings={setRatings}
                      showSelfRating={showSelfRating}
                      setShowSelfRating={setShowSelfRating}
                    />

                    {/* Advanced Settings Accordion */}
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

              {activeTab === "integrations" && (
                <div className="space-y-6 animate-fade-in animate-duration-300">
                  <div className="border-b border-neutral-850/60 pb-3">
                    <h3 className="text-sm font-bold text-white tracking-wider uppercase font-mono">
                      Profiles, Keys & Integrations
                    </h3>
                  </div>

                  <div className="space-y-5">
                    {/* Profile Manager defaults saver */}
                    <ProfileManager
                      currentProfileName={currentProfileName}
                      profiles={profiles}
                      onSaveProfile={handleSaveProfile}
                      onLoadProfile={handleLoadProfile}
                      onDeleteProfile={handleDeleteProfile}
                      addNotification={addNotification}
                    />

                    {/* Custom Credentials Configuration Module */}
                    <CredentialsConfig
                      hasCustomCredentials={hasCustomCredentials}
                      customClientId={customClientId}
                      customProjectId={customProjectId}
                      showCredentialsConfig={showCredentialsConfig}
                      setShowCredentialsConfig={setShowCredentialsConfig}
                      onSaveCredentials={handleSaveCredentials}
                      onDeleteCredentials={handleDeleteCredentials}
                    />

                    {/* Custom Channel & Socials Link presets */}
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
          </div>

          {/* RIGHT COLUMN: Video Monitor, Custom Thumbnail Upload & Upload History (Sticky) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto pr-1 scrollbar-thin">
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

            {/* Database History List */}
            <UploadHistory history={uploadHistory} />
          </div>
        </div>
      </div>
    );
  }
);

export default YouTubePage;
