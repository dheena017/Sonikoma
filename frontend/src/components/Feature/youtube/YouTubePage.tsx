import React, { useState } from "react";
import {
  Youtube,
  Sparkles,
  Loader2,
  ArrowLeft,
  Sliders,
  Key,
  FileText,
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Metadata Config Form & Navigation Tabs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Real-time SEO Auditor Score Banner */}
            <SeoAuditor seoScore={seoScore} seoChecks={seoChecks} />

            {/* Premium Glassmorphic Tab Selector */}
            <div className="flex bg-neutral-950/40 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-900/60 gap-1.5 shadow-inner">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all duration-300 cursor-pointer select-none ${
                  activeTab === "details"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-950/40 scale-[1.01]"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Details & Content</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all duration-300 cursor-pointer select-none ${
                  activeTab === "settings"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-950/40 scale-[1.01]"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
                }`}
              >
                <Sliders className="h-4 w-4" />
                <span>Publish Settings</span>
              </button>

              <button
                onClick={() => setActiveTab("integrations")}
                className={`flex-grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all duration-300 cursor-pointer select-none ${
                  activeTab === "integrations"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-950/40 scale-[1.01]"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
                }`}
              >
                <Key className="h-4 w-4" />
                <span>Profiles & Keys</span>
              </button>
            </div>

            {/* Tab Content Container */}
            <div className="bg-neutral-950/10 backdrop-blur-sm border border-neutral-900 rounded-3xl p-6 shadow-xl relative min-h-[420px] transition-all duration-300">
              {activeTab === "details" && (
                <div className="space-y-6 animate-fade-in animate-duration-300">
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                    <h3 className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono">
                      Video Details
                    </h3>
                    <button
                      onClick={handleGenerateMetadata}
                      disabled={isAiGenerating || isPublishing}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-950/25 border border-purple-900/40 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-98 shadow-sm"
                    >
                      {isAiGenerating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 animate-pulse text-purple-400" />
                          <span>Generate with AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-6">
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
                  <div className="border-b border-neutral-900 pb-3.5">
                    <h3 className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono">
                      Publish & Audience Settings
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {/* Category and Privacy Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-neutral-400 font-bold block">
                          Video Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-4 py-3 text-xs text-neutral-300 focus:outline-none transition-all cursor-pointer shadow-inner"
                        >
                          <option value="1" className="bg-neutral-950">Film & Animation</option>
                          <option value="24" className="bg-neutral-950">Entertainment</option>
                          <option value="20" className="bg-neutral-950">Gaming</option>
                          <option value="23" className="bg-neutral-950">Comedy</option>
                          <option value="22" className="bg-neutral-950">People & Blogs</option>
                          <option value="27" className="bg-neutral-950">Education</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-mono text-neutral-400 font-bold block">
                          Privacy Status
                        </label>
                        <select
                          value={privacy}
                          onChange={(e) => setPrivacy(e.target.value)}
                          className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-4 py-3 text-xs text-neutral-300 focus:outline-none transition-all cursor-pointer shadow-inner"
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

                    {/* Shorts Toggle */}
                    <div className="flex items-center justify-between p-4.5 bg-neutral-950/20 backdrop-blur-sm rounded-2xl border border-neutral-900 transition-all hover:border-neutral-800">
                      <div className="space-y-1 pr-4">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                          <span>YouTube Shorts Format</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-red-950/25 text-red-400 rounded-md border border-red-900/40 uppercase">
                            Beta
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-relaxed font-sans">
                          Optimize video format description and hashtag
                          indicators suited for vertical mobile feeds.
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
                  <div className="border-b border-neutral-900 pb-3.5">
                    <h3 className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono">
                      Profiles, Keys & Integrations
                    </h3>
                  </div>

                  <div className="space-y-6">
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
