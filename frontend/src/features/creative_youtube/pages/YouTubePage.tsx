import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Loader2,
  Sliders,
  FileText,
  Youtube,
  Tags,
  BookOpenText,
} from "lucide-react";
import { GeneratedPanel } from "@/types";

import YouTubeChannelModal from "@/features/creative_youtube/components/YouTubeChannelModal";

// ── App Components ────────────────────────────────────────────────────────────
import YouTubeAppNavBar from "@/features/creative_youtube/components/YouTubeAppNavBar";
import YouTubeChannelHome, {
  YouTubeVideoItem,
} from "@/features/creative_youtube/components/YouTubeChannelHome";
import YouTubeVideosPanel from "@/features/creative_youtube/components/YouTubeVideosPanel";
import YouTubeShortsPanel from "@/features/creative_youtube/components/YouTubeShortsPanel";
import YouTubeTheaterPlayer from "@/features/creative_youtube/components/YouTubeTheaterPlayer";
import YouTubeAnalyticsDashboard from "@/features/creative_youtube/components/YouTubeAnalyticsDashboard";
import YouTubePlaylistsManager from "@/features/creative_youtube/components/YouTubePlaylistsManager";
import YouTubeTopProgressBar from "@/features/creative_youtube/components/YouTubeTopProgressBar";
import YouTubeCreatePlaylistPanel from "@/features/creative_youtube/components/YouTubeCreatePlaylistPanel";
import YouTubeStudioPage from "@/features/creative_youtube/components/YouTubeStudioPage";

// ── Hook ──────────────────────────────────────────────────────────────────────
import { useYouTubePublisher } from "@/features/creative_youtube/hooks/useYouTubePublisher";
import { useProjectStore } from "@/shared/hooks/useProjectStore";

// ── Types ─────────────────────────────────────────────────────────────────────
interface YouTubePageProps {
  panels: GeneratedPanel[];
  videoUrl: string | null;
  scrapedTitle?: string;
  scrapedGenre?: string;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

type AppTab =
  | "home"
  | "videos"
  | "shorts"
  | "playlists"
  | "analytics"
  | "studio";
type StudioSubTab =
  | "details"
  | "chapters_tags"
  | "comic_subtitles"
  | "settings";

interface ChannelOverview {
  id?: string;
  title?: string;
  custom_url?: string;
  thumbnail?: string;
  authenticated?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
const YouTubePage = React.memo(
  ({
    panels = [],
    videoUrl,
    scrapedTitle = "",
    scrapedGenre = "",
    onNavigateHome,
    addNotification,
  }: YouTubePageProps) => {
    const activeProjectData = useProjectStore(
      (state) => state.activeProjectData
    );
    const storePanels = activeProjectData?.panels || [];
    const safePanels = (
      panels && panels.length > 0
        ? panels
        : Array.isArray(storePanels)
        ? storePanels
        : []
    ) as unknown as GeneratedPanel[];
    const effectiveTitle =
      scrapedTitle || activeProjectData?.project?.title || "";
    const effectiveGenre =
      scrapedGenre || activeProjectData?.project?.genre || "";
    const effectiveVideoUrl =
      videoUrl || activeProjectData?.project?.video_url || null;

    // ── App Navigation State ──────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<AppTab>("home");
    const [visitedTabs, setVisitedTabs] = useState<Set<AppTab>>(
      new Set(["home"])
    );
    const [isNavigating, setIsNavigating] = useState<boolean>(false);
    const [studioSubTab, setStudioSubTab] = useState<StudioSubTab>("details");
    const [isChannelModalOpen, setIsChannelModalOpen] =
      useState<boolean>(false);
    const [headerRefreshKey, setHeaderRefreshKey] = useState<number>(0);

    const handleTabChange = useCallback(
      (tab: AppTab) => {
        if (tab === activeTab) return;
        setIsNavigating(true);
        setActiveTab(tab);
        setVisitedTabs((prev) => new Set([...prev, tab]));
        setWatchingVideo(null);
        setWatchingPlaylistId(undefined);
        const timer = setTimeout(() => setIsNavigating(false), 200);
        return () => clearTimeout(timer);
      },
      [activeTab]
    );

    // ── Theater Player State ──────────────────────────────────────────────────
    const [watchingVideo, setWatchingVideo] = useState<YouTubeVideoItem | null>(
      null
    );
    const [watchingPlaylistId, setWatchingPlaylistId] = useState<
      string | undefined
    >(undefined);

    // ── Channel Header State ──────────────────────────────────────────────────
    const [navChannel, setNavChannel] = useState<ChannelOverview | null>(null);

    useEffect(() => {
      const fetchNavChannel = async () => {
        try {
          const token =
            localStorage.getItem("sonikoma_token") ||
            localStorage.getItem("token") ||
            "";
          const res = await fetch("/api/export/youtube/channel/details", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setNavChannel(data);
          }
        } catch {
          // Gracefully ignore
        }
      };
      fetchNavChannel();

      const handleChannelChanged = () => {
        fetchNavChannel();
      };
      window.addEventListener("youtube_channel_changed", handleChannelChanged);
      return () => {
        window.removeEventListener(
          "youtube_channel_changed",
          handleChannelChanged
        );
      };
    }, [headerRefreshKey]);

    // Handle OAuth redirect query param
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("select_channel") === "true") {
        setIsChannelModalOpen(true);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }, []);

    // ── Navigation Handlers ───────────────────────────────────────────────────
    const handleWatchVideo = useCallback(
      (videoId: string, video: YouTubeVideoItem, playlistId?: string) => {
        setWatchingVideo(video);
        setWatchingPlaylistId(playlistId);
      },
      []
    );

    const handleViewComments = useCallback((videoId: string) => {
      setWatchingVideo({
        id: videoId,
        title: "YouTube Video",
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        view_count: "--",
        like_count: "--",
        comment_count: "--",
        privacy_status: "public",
        youtube_url: `https://youtube.com/watch?v=${videoId}`,
      });
    }, []);

    const handleQuickPublish = useCallback(() => {
      handleTabChange("studio");
    }, [handleTabChange]);

    // ── Publisher Hook ────────────────────────────────────────────────────────
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
      handleResetUploadState,
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
      videoUrl: effectiveVideoUrl,
      scrapedTitle: effectiveTitle,
      scrapedGenre: effectiveGenre,
      addNotification,
    });

    return (
      <div className="flex-1 w-full space-y-4 animate-fade-in relative">
        {/* ── YOUTUBE RED TOP LOADING BAR ─────────────────────────────────── */}
        <YouTubeTopProgressBar isLoading={isNavigating || isPublishing} />

        {/* ── TOP APP NAVIGATION BAR ─────────────────────────────────────── */}
        <YouTubeAppNavBar
          activeTab={activeTab}
          onTabChange={(tab) => handleTabChange(tab as AppTab)}
          channelTitle={navChannel?.title || "Connect YouTube"}
          channelHandle={navChannel?.custom_url || ""}
          channelThumbnail={navChannel?.thumbnail}
          isConnected={!!navChannel?.authenticated}
          onOpenChannelModal={() => setIsChannelModalOpen(true)}
          onPublish={handleQuickPublish}
        />

        {/* ── MAIN TAB CANVAS CONTAINER (KEEP-ALIVE SPA PERSISTENCE) ──────── */}
        <div className="rounded-[24px] border border-white/10 bg-[#0b0b0e] p-5 sm:p-7 shadow-2xl min-h-[600px]">
          {/* 1. TAB: HOME / OVERVIEW */}
          {visitedTabs.has("home") && (
            <div
              className={
                activeTab === "home" ? "block animate-fade-in" : "hidden"
              }
            >
              <YouTubeChannelHome
                key={`home-${headerRefreshKey}`}
                onWatchVideo={handleWatchVideo}
                onViewComments={handleViewComments}
                onNavigateTab={(t) => handleTabChange(t as AppTab)}
              />
            </div>
          )}

          {/* 2. TAB: DEDICATED VIDEOS PANEL */}
          {visitedTabs.has("videos") && (
            <div
              className={
                activeTab === "videos" ? "block animate-fade-in" : "hidden"
              }
            >
              <YouTubeVideosPanel
                key={`videos-${headerRefreshKey}`}
                onWatchVideo={handleWatchVideo}
                onViewComments={handleViewComments}
                onNavigateStudio={handleQuickPublish}
              />
            </div>
          )}

          {/* 3. TAB: DEDICATED SHORTS PANEL */}
          {visitedTabs.has("shorts") && (
            <div
              className={
                activeTab === "shorts" ? "block animate-fade-in" : "hidden"
              }
            >
              <YouTubeShortsPanel
                key={`shorts-${headerRefreshKey}`}
                onNavigateStudio={() => {
                  setIsShort(true);
                  handleTabChange("studio");
                }}
              />
            </div>
          )}

          {/* 4. TAB: PLAYLISTS & LIBRARY */}
          {visitedTabs.has("playlists") && (
            <div
              className={
                activeTab === "playlists" ? "block animate-fade-in" : "hidden"
              }
            >
              <YouTubePlaylistsManager
                key={`playlists-${headerRefreshKey}`}
                onWatchVideo={handleWatchVideo}
                onNavigateStudio={handleQuickPublish}
              />
            </div>
          )}

          {/* 5. TAB: ANALYTICS & INTELLIGENCE */}
          {visitedTabs.has("analytics") && (
            <div
              className={
                activeTab === "analytics" ? "block animate-fade-in" : "hidden"
              }
            >
              <YouTubeAnalyticsDashboard
                key={`analytics-${headerRefreshKey}`}
                uploadHistory={uploadHistory}
              />
            </div>
          )}

          {/* 6. TAB: CREATOR STUDIO & AI PUBLISHER */}
          {visitedTabs.has("studio") && (
            <div
              className={
                activeTab === "studio" ? "block animate-fade-in" : "hidden"
              }
            >
              <YouTubeStudioPage
                activeVideoUrl={activeVideoUrl}
                videoUrl={videoUrl}
                selectedFile={selectedFile}
                selectedThumbnail={selectedThumbnail}
                thumbnailPreviewUrl={thumbnailPreviewUrl}
                videoDuration={videoDuration}
                videoAspectRatio={videoAspectRatio}
                isShort={isShort}
                setIsShort={setIsShort}
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                tags={tags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                suggestedTags={suggestedTags}
                handleAddTag={handleAddTag}
                handleRemoveTag={handleRemoveTag}
                handleAddSuggestedTag={handleAddSuggestedTag}
                category={category}
                setCategory={setCategory}
                privacy={privacy}
                setPrivacy={setPrivacy}
                isScheduled={isScheduled}
                setIsScheduled={setIsScheduled}
                scheduleDate={scheduleDate}
                setScheduleDate={setScheduleDate}
                scheduleTime={scheduleTime}
                setScheduleTime={setScheduleTime}
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
                playlist={playlist}
                setPlaylist={setPlaylist}
                subtitlesType={subtitlesType}
                setSubtitlesType={setSubtitlesType}
                subtitlesLanguage={subtitlesLanguage}
                setSubtitlesLanguage={setSubtitlesLanguage}
                ratings={ratings}
                setRatings={setRatings}
                showSelfRating={showSelfRating}
                setShowSelfRating={setShowSelfRating}
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
                seoScore={seoScore}
                seoChecks={seoChecks}
                isPublishing={isPublishing}
                publishLogs={publishLogs}
                youtubeUrl={youtubeUrl}
                isAiGenerating={isAiGenerating}
                hasCustomCredentials={hasCustomCredentials}
                onClearSelectedFile={handleClearSelectedFile}
                onClearThumbnail={handleClearThumbnail}
                onFileChange={handleFileChange}
                onThumbnailChange={handleThumbnailChange}
                onThumbnailSelect={handleThumbnailSelect}
                onPublish={handlePublish}
                onResetUploadState={handleResetUploadState}
                handleGenerateMetadata={handleGenerateMetadata}
                handleInjectPowerWord={handleInjectPowerWord}
                handleApplyPresetTemplate={handleApplyPresetTemplate}
                handleCompileChapters={handleCompileChapters}
                handleAppendTunedChapters={handleAppendTunedChapters}
                handleInsertDisclaimer={handleInsertDisclaimer}
                handleInsertSocials={handleInsertSocials}
                handleInsertMusicCredit={handleInsertMusicCredit}
                safePanels={safePanels}
                scrapedTitle={effectiveTitle}
                scrapedGenre={effectiveGenre}
                headerRefreshKey={headerRefreshKey}
                setIsChannelModalOpen={setIsChannelModalOpen}
                addNotification={addNotification}
              />
            </div>
          )}
        </div>

        {/* ── THEATER OVERLAY PLAYER MODAL ──────────────────────────────── */}
        {watchingVideo && (
          <YouTubeTheaterPlayer
            video={watchingVideo}
            playlistId={watchingPlaylistId}
            onClose={() => {
              setWatchingVideo(null);
              setWatchingPlaylistId(undefined);
            }}
          />
        )}

        {/* ── CHANNEL SELECTION MODAL ──────────────────────────────────────── */}
        <YouTubeChannelModal
          isOpen={isChannelModalOpen}
          onClose={() => setIsChannelModalOpen(false)}
          addNotification={addNotification}
          onChannelSelected={(channel) => {
            setHeaderRefreshKey((prev) => prev + 1);
            setNavChannel({
              id: channel.id,
              title: channel.title,
              custom_url: channel.custom_url,
              thumbnail: channel.thumbnail,
              authenticated: true,
            });
            setVisitedTabs(new Set([activeTab]));
            addNotification?.(
              `Connected YouTube channel: ${channel.title}`,
              "success"
            );
          }}
        />
      </div>
    );
  }
);

export default YouTubePage;
