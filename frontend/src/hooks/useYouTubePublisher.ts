import { useState, useEffect, useRef } from "react";
import { GeneratedPanel } from "../types";
import {
  publishVideoJson,
  publishVideoMultipart,
  generateSeoMetadata,
  fetchDbProfiles,
  saveDbProfile,
  deleteDbProfile,
  fetchDbUploadHistory,
  fetchDbCredentials,
  saveDbCredentials,
  deleteDbCredentials,
} from "../services/youtubePublisherService.js";
import { PublisherProfile } from "../components/video/youtube/ProfileManager.js";

const DEFAULT_PRESETS: PublisherProfile[] = [
  {
    name: "Webtoon Recap (Landscape)",
    title:
      "The Insane OP MC Leveling Up in [Series Name] Chapters [Start]-[End] Recap",
    description:
      "🎬 [Series Name] Recap\n\nEnjoyed this recap? Hit that subscribe button and turn on notifications!\n\n📚 Read the Original Webtoon here:\n👉 [Link]\n\n#webtoon #manhwa #recap",
    tags: ["manhwa recap", "webtoon recap", "op mc", "leveling up"],
    category: "1",
    privacy: "unlisted",
    isShort: false,
    madeForKids: "no",
    paidPromotion: false,
    license: "youtube",
    videoLanguage: "en",
    channelLink: "",
    discordLink: "",
    patreonLink: "",
    playlist: "",
    authorName: "",
    artistName: "",
    webtoonPlatform: "Webtoon",
    chapterStart: "",
    chapterEnd: "",
    subtitlesType: "None",
    subtitlesLanguage: "en",
  },
  {
    name: "YouTube Shorts (Vertical)",
    title: "This OP MC is just too clean... 🥶 #shorts #manhwa",
    description:
      "This overpowered main character is breaking all limits! Full recap on channel.\n\n#shorts #manhwa #webtoon #anime",
    tags: ["shorts", "manhwa", "webtoon", "recap"],
    category: "24",
    privacy: "unlisted",
    isShort: true,
    madeForKids: "no",
    paidPromotion: false,
    license: "youtube",
    videoLanguage: "en",
    channelLink: "",
    discordLink: "",
    patreonLink: "",
    playlist: "",
    authorName: "",
    artistName: "",
    webtoonPlatform: "Webtoon",
    chapterStart: "",
    chapterEnd: "",
    subtitlesType: "None",
    subtitlesLanguage: "en",
  },
];

interface UseYouTubePublisherProps {
  panels: GeneratedPanel[];
  videoUrl: string | null;
  scrapedTitle?: string;
  scrapedGenre?: string;
  addNotification?: (msg: string, type: any) => void;
}

export function useYouTubePublisher({
  panels,
  videoUrl,
  scrapedTitle = "",
  scrapedGenre = "",
  addNotification,
}: UseYouTubePublisherProps) {
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [category, setCategory] = useState("1");
  const [privacy, setPrivacy] = useState("unlisted");
  const [isShort, setIsShort] = useState(false);

  // Advanced settings accordion state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [madeForKids, setMadeForKids] = useState("no");
  const [paidPromotion, setPaidPromotion] = useState(false);
  const [license, setLicense] = useState("youtube");
  const [videoLanguage, setVideoLanguage] = useState("en");

  // Extra advanced publishing settings states
  const [ageRestriction, setAgeRestriction] = useState(false);
  const [shortsRemixing, setShortsRemixing] = useState("allow_all");
  const [commentsMode, setCommentsMode] = useState("hold_inappropriate");
  const [showLikes, setShowLikes] = useState(true);
  const [allowEmbedding, setAllowEmbedding] = useState(true);
  const [notifySubscribers, setNotifySubscribers] = useState(true);
  const [recordingDate, setRecordingDate] = useState("");
  const [videoLocation, setVideoLocation] = useState("");

  // Schedule publishing state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("12:00");

  // Custom social links config states
  const [channelLink, setChannelLink] = useState("");
  const [discordLink, setDiscordLink] = useState("");
  const [patreonLink, setPatreonLink] = useState("");
  const [showSocialsConfig, setShowSocialsConfig] = useState(false);

  // New Advanced Metadata states
  const [playlist, setPlaylist] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [webtoonPlatform, setWebtoonPlatform] = useState("Webtoon");
  const [customPlatform, setCustomPlatform] = useState("");
  const [chapterStart, setChapterStart] = useState("");
  const [chapterEnd, setChapterEnd] = useState("");
  const [chapterValidationError, setChapterValidationError] = useState<
    string | null
  >(null);
  const [subtitlesType, setSubtitlesType] = useState("None");
  const [subtitlesLanguage, setSubtitlesLanguage] = useState("en");

  // Profile manager states
  const [profiles, setProfiles] = useState<PublisherProfile[]>([]);
  const [currentProfileName, setCurrentProfileName] = useState("");

  // Upload/Publish history state
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);

  // User Custom OAuth credentials states
  const [hasCustomCredentials, setHasCustomCredentials] = useState(false);
  const [customClientId, setCustomClientId] = useState("");
  const [customProjectId, setCustomProjectId] = useState("");
  const [showCredentialsConfig, setShowCredentialsConfig] = useState(false);

  // Self-rating checklist state
  const [showSelfRating, setShowSelfRating] = useState(false);
  const [ratings, setRatings] = useState({
    noLanguage: true,
    noViolence: true,
    noAdultContent: true,
    noHarmfulActs: true,
  });

  // Suggested tags bank based on genre
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // Real-time SEO audit check scores
  const [seoScore, setSeoScore] = useState(0);
  const [seoChecks, setSeoChecks] = useState({
    titleLength: false,
    titleHook: false,
    descLength: false,
    descChapters: false,
    descSocials: false,
    tagsVolume: false,
    metadataConsistency: false,
  });

  // States
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishLogs, setPublishLogs] = useState<string[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Thumbnail states
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(
    null
  );

  // Video properties (calculated)
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string | null>(null);

  // Calculate active video source URL
  const activeVideoUrl = localPreviewUrl || videoUrl;



  // Chapter Range Validation Logic
  useEffect(() => {
    if (chapterStart && chapterEnd) {
      const start = parseInt(chapterStart);
      const end = parseInt(chapterEnd);
      if (!isNaN(start) && !isNaN(end) && end < start) {
        setChapterValidationError(
          "Chapter End cannot be less than Chapter Start."
        );
      } else {
        setChapterValidationError(null);
      }
    } else {
      setChapterValidationError(null);
    }
  }, [chapterStart, chapterEnd]);

  // Ref to track previous metadata values for non-destructive incremental sync
  const prevMetadata = useRef({
    author: authorName,
    artist: artistName,
    platform: webtoonPlatform === "Other" ? customPlatform : webtoonPlatform,
    start: chapterStart,
    end: chapterEnd,
    series: scrapedTitle,
  });

  // Placeholder Auto-Sync Logic (Incremental & Non-Destructive)
  useEffect(() => {
    const currentPlatform =
      webtoonPlatform === "Other" ? customPlatform : webtoonPlatform;

    const syncMap = [
      { key: "[Author]", prev: prevMetadata.current.author, curr: authorName },
      { key: "[Artist]", prev: prevMetadata.current.artist, curr: artistName },
      {
        key: "[Platform]",
        prev: prevMetadata.current.platform,
        curr: currentPlatform,
      },
      { key: "[Start]", prev: prevMetadata.current.start, curr: chapterStart },
      { key: "[End]", prev: prevMetadata.current.end, curr: chapterEnd },
      {
        key: "[Series Name]",
        prev: prevMetadata.current.series,
        curr: scrapedTitle,
      },
    ];

    let newTitle = title;
    let newDesc = description;
    let hasChanged = false;

    syncMap.forEach(({ key, prev, curr }) => {
      if (prev !== curr) {
        // 1. Try to replace the literal placeholder key first
        if (newTitle.includes(key)) {
          newTitle = newTitle.split(key).join(curr || key);
          hasChanged = true;
        }
        // 2. Otherwise, if we have a previous value, replace that value with the new one
        else if (prev && newTitle.includes(prev)) {
          newTitle = newTitle.split(prev).join(curr || key);
          hasChanged = true;
        }

        if (newDesc.includes(key)) {
          newDesc = newDesc.split(key).join(curr || key);
          hasChanged = true;
        } else if (prev && newDesc.includes(prev)) {
          newDesc = newDesc.split(prev).join(curr || key);
          hasChanged = true;
        }
      }
    });

    if (hasChanged) {
      if (newTitle !== title) setTitle(newTitle);
      if (newDesc !== description) setDescription(newDesc);
    }

    // Update refs for next cycle
    prevMetadata.current = {
      author: authorName,
      artist: artistName,
      platform: currentPlatform,
      start: chapterStart,
      end: chapterEnd,
      series: scrapedTitle,
    };
  }, [
    authorName,
    artistName,
    webtoonPlatform,
    customPlatform,
    chapterStart,
    chapterEnd,
    scrapedTitle,
  ]);



  // Load profiles, publish history, and custom credentials from database on mount
  useEffect(() => {
    async function loadDatabaseData() {
      try {
        const dbProfilesResult = await fetchDbProfiles();
        const dbProfiles = dbProfilesResult || [];
        const mapped: PublisherProfile[] = dbProfiles.map((p: any) => ({
          name: p.name,
          title: p.title_template,
          description: p.description_template,
          tags: p.tags,
          category: p.category_id,
          privacy: p.privacy_status,
          isShort: !!p.is_short,
          madeForKids: p.made_for_kids,
          paidPromotion: !!p.paid_promotion,
          license: p.license,
          videoLanguage: p.video_language,
          channelLink: p.channel_link || "",
          discordLink: p.discord_link || "",
          patreonLink: p.patreon_link || "",
          playlist: p.playlist || "",
          authorName: p.author_name || "",
          artistName: p.artist_name || "",
          webtoonPlatform: p.webtoon_platform || "Webtoon",
          chapterStart: p.chapter_start || "",
          chapterEnd: p.chapter_end || "",
          subtitlesType: p.subtitles_type || "None",
          subtitlesLanguage: p.subtitles_language || "en",
        }));

        // Merge default templates with database profiles
        const merged = [...DEFAULT_PRESETS, ...mapped];
        setProfiles(merged);

        // Fetch upload history log
        const history = await fetchDbUploadHistory();
        setUploadHistory(history || []);

        // Fetch custom credentials status
        const creds = await fetchDbCredentials();
        if (creds && creds.has_credentials) {
          setHasCustomCredentials(true);
          setCustomClientId(creds.client_id);
          setCustomProjectId(creds.project_id);
        }
      } catch (err: any) {
        setPublishLogs((prev) => [
          ...prev,
          `[Database Sync] Connection error: ${err.message}`,
        ]);
        // Fallback to defaults if DB load fails
        setProfiles(DEFAULT_PRESETS);
      }
    }
    loadDatabaseData();
  }, []);

  // Generate localized suggest tag banks based on genre
  useEffect(() => {
    const genre = (scrapedGenre || "action").toLowerCase();
    const tagsBank = ["manhwa recap", "webtoon recap", "motion comic"];

    if (genre.includes("action") || genre.includes("shounen")) {
      tagsBank.push("action manhwa", "system manhwa", "leveling up", "op mc");
    } else if (
      genre.includes("romance") ||
      genre.includes("shoujo") ||
      genre.includes("otome")
    ) {
      tagsBank.push(
        "romance webtoon",
        "villainess manhwa",
        "reincarnation",
        "love story"
      );
    } else if (genre.includes("fantasy") || genre.includes("isekai")) {
      tagsBank.push("fantasy manga", "isekai manhwa", "magic story", "reborn");
    } else {
      tagsBank.push("comic review", "manga summary", "webtoon explanation");
    }

    setSuggestedTags(tagsBank);
  }, [scrapedGenre]);

  // Run real-time SEO Auditor
  useEffect(() => {
    const checks = {
      titleLength: title.length >= 40 && title.length <= 75,
      titleHook:
        /(?!recap|summary)(?=epic|insane|overpowered|shocking|secret|level|reborn)/i.test(
          title
        ),
      descLength: description.length >= 150,
      descChapters: /\d{1,2}:\d{2}/.test(description),
      descSocials: /(https?:\/\/|patreon|discord|subscribe)/i.test(description),
      tagsVolume: tags.length >= 5,
      metadataConsistency:
        (!authorName ||
          description.toLowerCase().includes(authorName.toLowerCase())) &&
        (!artistName ||
          description.toLowerCase().includes(artistName.toLowerCase())) &&
        (!chapterStart || description.includes(chapterStart)) &&
        (!chapterEnd || description.includes(chapterEnd)),
    };

    setSeoChecks(checks);

    const passedChecksCount = Object.values(checks).filter(Boolean).length;
    setSeoScore(
      Math.round((passedChecksCount / Object.keys(checks).length) * 100)
    );
  }, [title, description, tags]);

  // Auto-detect duration & aspect ratio if video is loaded
  useEffect(() => {
    if (!activeVideoUrl) {
      setVideoDuration(null);
      setVideoAspectRatio(null);
      return;
    }

    if (!localPreviewUrl && panels.length > 0) {
      const totalDuration = panels.reduce(
        (acc, p) => acc + (p.duration || 4.5),
        0
      );
      setVideoDuration(totalDuration);
    }

    const videoElement = document.createElement("video");
    videoElement.src = activeVideoUrl;
    videoElement.onloadedmetadata = () => {
      setVideoDuration(videoElement.duration);
      if (videoElement.videoWidth && videoElement.videoHeight) {
        const ratio = videoElement.videoWidth / videoElement.videoHeight;
        if (ratio < 0.8) {
          setVideoAspectRatio("9:16");
          setIsShort(videoElement.duration < 60);
        } else {
          setVideoAspectRatio("16:9");
        }
      }
    };
  }, [activeVideoUrl, panels, localPreviewUrl]);

  // Profile manager database handlers
  const handleSaveProfile = async (profileName: string) => {
    const newProfile: PublisherProfile = {
      name: profileName,
      title,
      description,
      tags,
      category,
      privacy,
      isShort,
      madeForKids,
      paidPromotion,
      license,
      videoLanguage,
      channelLink,
      discordLink,
      patreonLink,
      playlist,
      authorName,
      artistName,
      webtoonPlatform,
      chapterStart,
      chapterEnd,
      subtitlesType,
      subtitlesLanguage,
      customPlatform,
    };

    try {
      await saveDbProfile(newProfile);

      const updated = profiles.filter((p) => p.name !== profileName);
      setProfiles([...updated, newProfile]);
      setCurrentProfileName(profileName);
      if (addNotification)
        addNotification(
          `Settings profile "${profileName}" saved to database!`,
          "success"
        );
    } catch (err: any) {
      if (addNotification)
        addNotification(
          `Failed to save profile to database: ${err.message}`,
          "error"
        );
    }
  };

  const handleClearForm = () => {
    setTitle("");
    setDescription("");
    setTags([]);
    setTagInput("");
    setCategory("1");
    setPrivacy("unlisted");
    setIsShort(false);
    setShowAdvanced(false);
    setMadeForKids("no");
    setPaidPromotion(false);
    setLicense("youtube");
    setVideoLanguage("en");
    setAgeRestriction(false);
    setShortsRemixing("allow_all");
    setCommentsMode("hold_inappropriate");
    setShowLikes(true);
    setAllowEmbedding(true);
    setNotifySubscribers(true);
    setRecordingDate("");
    setVideoLocation("");
    setIsScheduled(false);
    setScheduleDate("");
    setScheduleTime("12:00");
    setChannelLink("");
    setDiscordLink("");
    setPatreonLink("");
    setShowSocialsConfig(false);
    setPlaylist("");
    setAuthorName("");
    setArtistName("");
    setWebtoonPlatform("Webtoon");
    setCustomPlatform("");
    setChapterStart("");
    setChapterEnd("");
    setSubtitlesType("None");
    setSubtitlesLanguage("en");
    setCurrentProfileName("");
    if (addNotification) {
      addNotification("YouTube export form cleared.", "info");
    }
  };

  const handleLoadProfile = (profileName: string) => {
    const target = profiles.find((p) => p.name === profileName);
    if (!target) {
      setCurrentProfileName("");
      return;
    }

    setTitle(target.title);
    setDescription(target.description);
    setTags(target.tags);
    setCategory(target.category);
    setPrivacy(target.privacy);
    setIsShort(target.isShort);
    setMadeForKids(target.madeForKids);
    setPaidPromotion(target.paidPromotion);
    setLicense(target.license);
    setVideoLanguage(target.videoLanguage);
    setChannelLink(target.channelLink);
    setDiscordLink(target.discordLink);
    setPatreonLink(target.patreonLink);
    setPlaylist(target.playlist);
    setAuthorName(target.authorName);
    setArtistName(target.artistName);
    setWebtoonPlatform(target.webtoonPlatform);
    setCustomPlatform(target.customPlatform || "");
    setChapterStart(target.chapterStart);
    setChapterEnd(target.chapterEnd);
    setSubtitlesType(target.subtitlesType);
    setSubtitlesLanguage(target.subtitlesLanguage);

    setCurrentProfileName(profileName);
    if (addNotification)
      addNotification(`Loaded settings profile "${profileName}"!`, "success");
  };

  const handleDeleteProfile = async (profileName: string) => {
    const isPreset = DEFAULT_PRESETS.some(
      (preset) => preset.name === profileName
    );
    if (isPreset) {
      setProfiles(profiles.filter((p) => p.name !== profileName));
      setCurrentProfileName("");
      if (addNotification)
        addNotification(
          `Removed default preset "${profileName}" from current session list.`,
          "info"
        );
      return;
    }

    try {
      await deleteDbProfile(profileName);
      setProfiles(profiles.filter((p) => p.name !== profileName));
      setCurrentProfileName("");
      if (addNotification)
        addNotification(
          `Deleted profile "${profileName}" from database.`,
          "info"
        );
    } catch (err: any) {
      if (addNotification)
        addNotification(`Failed to delete profile: ${err.message}`, "error");
    }
  };

  // Custom credentials handlers
  const handleSaveCredentials = async (
    clientId: string,
    clientSecret: string,
    projectId: string
  ) => {
    try {
      const res = await saveDbCredentials(clientId, clientSecret, projectId);
      setHasCustomCredentials(true);
      setCustomClientId(res.client_id);
      setCustomProjectId(res.project_id);
      if (addNotification)
        addNotification("Custom YouTube OAuth credentials saved!", "success");
    } catch (err: any) {
      if (addNotification)
        addNotification(`Failed to save credentials: ${err.message}`, "error");
    }
  };

  const handleDeleteCredentials = async () => {
    try {
      await deleteDbCredentials();
      setHasCustomCredentials(false);
      setCustomClientId("");
      setCustomProjectId("");
      if (addNotification)
        addNotification("Custom YouTube OAuth credentials cleared.", "info");
    } catch (err: any) {
      if (addNotification)
        addNotification(
          `Failed to remove credentials: ${err.message}`,
          "error"
        );
    }
  };

  // Handle Title Power Words Clickbait Injection
  const handleInjectPowerWord = (word: string) => {
    if (title.includes(word)) return;

    const newTitle = title.trim() ? `${title.trim()} ${word}` : word;
    if (newTitle.length <= 100) {
      setTitle(newTitle);
      setPublishLogs((prev) => [
        ...prev,
        `[Title Optimizer] Appended power word: ${word}`,
      ]);
      if (addNotification)
        addNotification(`Appended ${word} to title!`, "success");
    } else {
      if (addNotification)
        addNotification(
          "Cannot add power word, title would exceed 100 characters.",
          "warning"
        );
    }
  };

  // Handle BGM Music Credit Injection
  const handleInsertMusicCredit = (musicType: string) => {
    const musicCredit =
      `\n\n🎵 MUSIC TRACK BGM CREDITS:\n` +
      `- BGM Soundtrack: ${musicType} Theme (Royalty Free Credit)\n` +
      `- Provider: Sonikoma Creative Audio Library`;

    if (description.includes("🎵 MUSIC TRACK BGM CREDITS")) {
      if (addNotification)
        addNotification("Music credits are already in description.", "warning");
      return;
    }

    setDescription((prev) => prev + musicCredit);
    setPublishLogs((prev) => [
      ...prev,
      `[BGM Credit] Appended ${musicType} soundtrack licensing credit.`,
    ]);
    if (addNotification)
      addNotification(`Appended ${musicType} credits!`, "success");
  };

  // Handle adding tag
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) return;

    const splitTags = trimmed
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newTags = [...tags];
    splitTags.forEach((t) => {
      if (
        !newTags.includes(t) &&
        newTags.join(",").length + t.length + 1 <= 500
      ) {
        newTags.push(t);
      }
    });

    setTags(newTags);
    setTagInput("");
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag) && tags.join(",").length + tag.length + 1 <= 500) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("video/")) {
      if (addNotification) {
        addNotification(
          "Please select a valid video file (.mp4, .mov, etc.)",
          "error"
        );
      }
      return;
    }

    setSelectedFile(file);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setPublishLogs((prev) => [
      ...prev,
      `[File] Selected local file: ${file.name} (${(
        file.size /
        (1024 * 1024)
      ).toFixed(1)} MB)`,
    ]);
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    setPublishLogs((prev) => [
      ...prev,
      `[File] Cleared local file selection. Reverted to workspace video.`,
    ]);
  };

  // Handle local thumbnail selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      if (addNotification) {
        addNotification(
          "Please select a valid image file (.jpg, .png)",
          "error"
        );
      }
      return;
    }

    setSelectedThumbnail(file);
    if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    setThumbnailPreviewUrl(URL.createObjectURL(file));
    setPublishLogs((prev) => [
      ...prev,
      `[Thumbnail] Selected custom thumbnail: ${file.name}`,
    ]);
  };

  const handleClearThumbnail = () => {
    setSelectedThumbnail(null);
    if (thumbnailPreviewUrl && thumbnailPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
    }
    setThumbnailPreviewUrl(null);
    setPublishLogs((prev) => [
      ...prev,
      `[Thumbnail] Cleared custom thumbnail.`,
    ]);
  };

  const handleThumbnailSelect = async (url: string) => {
    // If it's a cached local URL, we might want to fetch it as a File for multipart upload
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], "ai_thumbnail.jpg", { type: "image/jpeg" });
      setSelectedThumbnail(file);
      setThumbnailPreviewUrl(url);
      setPublishLogs((prev) => [
        ...prev,
        `[Thumbnail] Selected AI generated thumbnail from project library.`,
      ]);
    } catch (e) {
      console.error("Failed to select AI thumbnail", e);
    }
  };

  // Description quick insert helpers
  const handleInsertDisclaimer = () => {
    const disclaimer =
      "\n\n⚠️ COPYRIGHT DISCLAIMER:\n" +
      "Under section 107 of the Copyright Act 1976, allowance is made for 'fair use' " +
      "for purposes such as criticism, comment, news reporting, teaching, scholarship, education and research. " +
      "Fair use is a use permitted by copyright statute that might otherwise be infringing.";
    setDescription((prev) => prev + disclaimer);
    if (addNotification)
      addNotification("Fair Use Disclaimer appended!", "success");
  };

  const handleInsertSocials = () => {
    const channel = channelLink || "[Insert Channel Link]";
    const discord = discordLink || "[Insert Link]";
    const patreon = patreonLink || "[Insert Link]";

    const socials =
      `\n\n🌐 CONNECT WITH US:\n` +
      `🔔 Subscribe: ${channel}\n` +
      `💬 Join Discord: ${discord}\n` +
      `❤️ Support on Patreon: ${patreon}`;

    setDescription((prev) => prev + socials);
    if (addNotification)
      addNotification("Social links section appended!", "success");
  };

  // Compile Video Chapters from Storyboard panels
  const handleCompileChapters = () => {
    if (!panels || panels.length === 0) {
      if (addNotification) {
        addNotification(
          "No storyboard panels found to generate chapters.",
          "warning"
        );
      }
      return;
    }

    let currentTime = 0;
    const chaptersList = panels.map((panel, idx) => {
      const minutes = Math.floor(currentTime / 60);
      const seconds = Math.floor(currentTime % 60);
      const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
      currentTime += panel.duration || 4.5;

      const panelSpeech = panel.speech_text
        ? panel.speech_text.slice(0, 30).trim() +
          (panel.speech_text.length > 30 ? "..." : "")
        : `Scene Outline #${idx + 1}`;
      return `${timeStr} - ${panelSpeech}`;
    });

    const chaptersText =
      `\n\n📌 VIDEO CHAPTERS:\n00:00 - Introduction\n` +
      chaptersList.join("\n");
    setDescription((prev) => prev + chaptersText);

    setPublishLogs((prev) => [
      ...prev,
      "[Chapters] Storyboard chapter timestamps successfully appended to description.",
    ]);
    if (addNotification) {
      addNotification("Chapters outline appended to description!", "success");
    }
  };

  const handleAppendTunedChapters = (chaptersText: string) => {
    setDescription((prev) => prev + chaptersText);
    setPublishLogs((prev) => [
      ...prev,
      "[Chapters] Tuned chapters outline successfully appended to description.",
    ]);
  };

  // Load Description Preset Templates
  const handleApplyPresetTemplate = (type: "recap" | "trailer") => {
    const videoTitle = title || scrapedTitle || "My Webtoon Video";
    const channel = channelLink || "[Link to Series]";
    let template = "";

    if (type === "recap") {
      template =
        `🎬 ${videoTitle} Recap\n\n` +
        `Welcome back! In today's video we are breaking down and recapping the epic story chapters of this amazing webtoon series.\n\n` +
        `Enjoyed this recap? Hit that subscribe button and turn on notifications so you never miss another voice comic adaptation!\n\n` +
        `📚 Read the Original Webtoon here:\n` +
        `👉 ${channel}\n\n` +
        `PRODUCTION CREDITS:\n` +
        `- Scripting & Storyboards: Sonikoma Creative Suite\n` +
        `- Voice Synthesis: Edge TTS Studio\n` +
        `- BGM Soundtrack: Custom Mix\n\n` +
        `#webtoon #manhwa #recap #motioncomic`;
    } else {
      template =
        `🔥 ${videoTitle} - Official Promo Trailer\n\n` +
        `Witness the official preview of the legendary motion comic adaptation of "${videoTitle}".\n\n` +
        `Production by Sonikoma. Stay tuned for full episode releases!\n\n` +
        `Follow for updates:\n` +
        `- Instagram: @SonikomaProduction\n` +
        `- Twitter/X: @SonikomaRecaps\n\n` +
        `#trailer #manhwa #comics #anime`;
    }

    setDescription(template);
    setPublishLogs((prev) => [
      ...prev,
      `[Template] Loaded description template preset: ${type.toUpperCase()}`,
    ]);
  };

  // AI Generation helper
  const handleGenerateMetadata = async () => {
    setIsAiGenerating(true);
    setPublishLogs((prev) => [
      ...prev,
      "[AI] Prompting Gemini for high-performance YouTube metadata...",
    ]);
    try {
      const result = await generateSeoMetadata(
        scrapedTitle || "My Webtoon Recap",
        scrapedGenre || "Action/Fantasy",
        panels
      );
      setTitle(result.youtube_title || "");
      setDescription(result.youtube_description || "");
      if (result.tags && result.tags.length > 0) {
        setTags(result.tags);
      }
      setPublishLogs((prev) => [
        ...prev,
        "[AI] Successfully generated SEO Title, Description, and Tags!",
      ]);
      if (addNotification) {
        addNotification("Successfully compiled SEO Metadata!", "success");
      }
    } catch (err: any) {
      setPublishLogs((prev) => [
        ...prev,
        `[AI Error] Failed to generate metadata: ${err.message}`,
      ]);
      if (addNotification) {
        addNotification("Failed to generate metadata via AI.", "error");
      }
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Upload/Publish execution
  const handlePublish = async () => {
    if (!activeVideoUrl) return;
    setIsPublishing(true);
    setYoutubeUrl(null);

    try {
      let data: any;
      if (selectedFile) {
        setPublishLogs([
          `[1/4] Preparing direct local file upload: ${selectedFile.name}`,
          `[2/4] Initializing YouTube API authorization...`,
        ]);
        data = await publishVideoMultipart({
          videoFile: selectedFile,
          thumbnailFile: selectedThumbnail,
          title,
          description,
          tags,
          privacy,
          category,
          isShort,
          isScheduled,
          scheduleDate,
          scheduleTime,
          playlist,
          authorName,
          artistName,
          webtoonPlatform,
          chapterStart,
          chapterEnd,
          subtitlesType,
          subtitlesLanguage,
        });
      } else if (videoUrl) {
        setPublishLogs([
          `[1/4] Preparing upload request for: ${videoUrl.split("/").pop()}`,
          `[2/4] Initializing YouTube API credentials flow...`,
        ]);

        if (selectedThumbnail) {
          setPublishLogs((prev) => [
            ...prev,
            `[Upload Mode] Redirecting to multipart upload to include custom thumbnail...`,
          ]);
          const videoBlob = await fetch(videoUrl).then((r) => r.blob());
          const videoFile = new File(
            [videoBlob],
            videoUrl.split("/").pop() || "workspace_video.mp4",
            { type: "video/mp4" }
          );

          data = await publishVideoMultipart({
            videoFile,
            thumbnailFile: selectedThumbnail,
            title,
            description,
            tags,
            privacy,
            category,
            isShort,
            isScheduled,
            scheduleDate,
            scheduleTime,
            playlist,
            authorName,
            artistName,
            webtoonPlatform,
            chapterStart,
            chapterEnd,
            subtitlesType,
            subtitlesLanguage,
          });
        } else {
          data = await publishVideoJson({
            videoUrl,
            title,
            description,
            tags,
            privacy,
            category,
            isShort,
            isScheduled,
            scheduleDate,
            scheduleTime,
            playlist,
            authorName,
            artistName,
            webtoonPlatform,
            chapterStart,
            chapterEnd,
            subtitlesType,
            subtitlesLanguage,
          });
        }
      }

      if (data && data.youtube_url) {
        setYoutubeUrl(data.youtube_url);
        setPublishLogs((prev) => [
          ...prev,
          `[3/4] Transmitting video file to YouTube server...`,
          `[4/4] Finalizing video status: ${privacy.toUpperCase()}`,
          `🎉 Success! Published video URL: ${data.youtube_url}`,
        ]);

        // Refresh upload history from DB
        try {
          const history = await fetchDbUploadHistory();
          setUploadHistory(history);
        } catch {}

        if (addNotification) {
          addNotification(
            "Successfully published video to YouTube!",
            "success"
          );
        }
      }
    } catch (err: any) {
      setPublishLogs((prev) => [
        ...prev,
        `❌ Network Error during publish: ${err.message}`,
      ]);
      if (addNotification) {
        addNotification(`Publish Error: ${err.message}`, "error");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    tags,
    setTags,
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
  };
}
