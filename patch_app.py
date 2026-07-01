import re

with open("frontend/src/App.tsx", "r") as f:
    content = f.read()

# We need to restructure the return statement in App.tsx
# Find the start of the return statement
# return (
#     <div
#       id="app_root"
#       ...
#     >

search = """  return (
    <div
      id="app_root"
      className={`min-h-screen bg-[#070709] text-neutral-100 flex flex-col selection:text-white relative ${
        isAdminPath ? "selection:bg-violet-600" : "lg:flex-row selection:bg-purple-600"
      }`}
    >"""

replace = """  return (
    <div
      id="app_root"
      className={`h-screen bg-[#070709] text-neutral-100 flex flex-col selection:text-white relative overflow-hidden ${
        isAdminPath ? "selection:bg-violet-600" : "selection:bg-purple-600"
      }`}
    >"""

content = content.replace(search, replace)


search_content = """      {/* --- Page Navigation Sidebar --- */}
      {isAdminPath ? (
        <AdminSidebar
          currentPath={currentPath}
          navigateTo={navigateTo}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      ) : (
        <Sidebar
          isProcessing={isProcessing}
          panels={panels}
          scrapedImages={scrapedImages}
          totalCalculatedDuration={totalCalculatedDuration}
          currentPath={currentPath}
          editingImageIdx={editingImageIdx}
          lastEditorPath={lastEditorPath}
          isBatchCropping={isBatchCropping}
          isCleaningBubbles={isCleaningBubbles}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          projectId={projectId}
          isDirty={isWorkspaceDirty}
          navigateTo={navigateTo}
          notifications={notifications}
          seriesSlug={seriesSlugState}
          chapterSlug={chapterSlugState}
        />
      )}

      {/* --- Main Contents Controller & Router --- */}
      <div
        id="main-scroll-container"
        className={`flex-grow flex-1 flex flex-col min-h-screen lg:max-h-screen justify-between ${
          !isAdminPath && isSidebarOpen ? "overflow-hidden" : ""
        } ${!isAdminPath ? "lg:overflow-y-auto" : "overflow-y-auto"}`}
      >
        <div>
          {/* Impersonation Banner */}"""

replace_content = """        <div>
          {/* Impersonation Banner */}"""

content = content.replace(search_content, replace_content)

search_header = """          {/* Top Header */}
          <Header
            isProcessing={isProcessing}
            panels={panels}
            totalCalculatedDuration={totalCalculatedDuration}
            currentPath={currentPath}
            editingImageIdx={editingImageIdx}
            lastEditorPath={lastEditorPath}
            isBatchCropping={isBatchCropping}
            isCleaningBubbles={isCleaningBubbles}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            backendStatus={backendStatus}
            narrationStyle={narrationStyle}
            setNarrationStyle={setNarrationStyle}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            volume={volume}
            setVolume={setVolume}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            autoPlayAudio={autoPlayAudio}
            setAutoPlayAudio={setAutoPlayAudio}
            sfxVolume={appLogic.sfxVolume}
            setSfxVolume={appLogic.setSfxVolume}
            sfxEnabled={appLogic.sfxEnabled}
            setSfxEnabled={appLogic.setSfxEnabled}
            user={user}
            notifications={notifications}
            markNotificationAsRead={markNotificationAsRead}
            markAllNotificationsAsRead={markAllNotificationsAsRead}
            deleteNotification={deleteNotification}
            clearAllNotifications={clearAllNotifications}
            projectId={headerProjectId}
            saveStatus={headerSaveStatus}
            isDirty={headerIsDirty}
            onSave={headerOnSave}
            navigateTo={navigateTo}
            notificationsMuted={notificationsMuted}
            setNotificationsMuted={setNotificationsMuted}
            themeMode={themeMode}
            toggleThemeMode={toggleThemeMode}
          />

          {/* PAGE VIEW 1: Main Editor Workspace */}"""

replace_header = """          {/* PAGE VIEW 1: Main Editor Workspace */}"""

content = content.replace(search_header, replace_header)

# Now we need to insert the banners and header right after the `<div id="app_root">` start

# Actually, the Banners and Header were originally grouped inside a `<div>` inside `main-scroll-container`.
# Let's extract them.

banners_and_header = """      {/* Impersonation Banner */}
      {localStorage.getItem("sonikoma_admin_token") && (
        <div className="bg-rose-600 text-white text-center py-2 px-4 text-sm font-bold flex justify-center items-center gap-4 z-[100] relative shadow-md">
          <AlertTriangle className="w-4 h-4" />
          <span>
            You are currently impersonating {user?.email || "a user"}.
          </span>
          <button
            onClick={() => {
              const adminToken = localStorage.getItem("sonikoma_admin_token");
              if (adminToken) {
                localStorage.setItem("sonikoma_token", adminToken);
                localStorage.removeItem("sonikoma_admin_token");
                sessionStorage.removeItem("sonikoma_token");
                window.location.href = "/admin";
              }
            }}
            className="bg-black/20 hover:bg-black/40 px-3 py-1 rounded transition-colors"
          >
            Return to Admin
          </button>
        </div>
      )}

      {/* Engine Health Banner */}
      {backendStatus === "offline" && (
        <div className="flex flex-col w-full z-50 animate-slide-down">
          <div className="bg-gradient-to-r from-rose-950/90 to-red-950/95 border-b border-rose-800/40 px-4 py-3 text-center text-xs sm:text-sm font-semibold text-rose-250 flex flex-wrap items-center justify-center gap-3 w-full">
            <span className="flex items-center gap-2 flex-wrap justify-center">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-550 animate-ping" />
              <span>
                ⚠️ Computational Engine Server is Offline. Make sure the
                Python backend is active (run{" "}
                <code className="bg-black/50 px-1.5 py-0.5 rounded text-rose-350 font-mono text-xs">
                  npm run backend
                </code>
                ).
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={startBackend}
                disabled={isStartingBackend}
                className={`px-3 py-1 text-[10px] rounded-lg font-mono uppercase tracking-wider font-bold transition-all border shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isStartingBackend
                    ? "bg-amber-950/60 border-amber-700/40 text-amber-200 cursor-not-allowed"
                    : "bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border-emerald-700/40"
                }`}
              >
                {isStartingBackend ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Starting...
                  </>
                ) : (
                  "Start Backend Server"
                )}
              </button>
              <button
                onClick={recheckBackend}
                className="px-3 py-1 bg-rose-900/60 hover:bg-rose-850 text-rose-100 text-[10px] rounded-lg font-mono uppercase tracking-wider font-bold transition-all border border-rose-700/50 shadow-sm cursor-pointer whitespace-nowrap"
              >
                Recheck Connection
              </button>
            </div>
          </div>
          {startBackendError && (
            <div className="bg-red-950/80 border-b border-red-800/30 px-4 py-2 text-center text-xs font-semibold text-red-200 flex items-center justify-center gap-2">
              <span>⚠️ {startBackendError}</span>
              <button
                onClick={() => setStartBackendError(null)}
                className="text-red-400 hover:text-red-300 font-bold ml-2 underline text-[10px] uppercase cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top Header */}
      <Header
        isProcessing={isProcessing}
        panels={panels}
        totalCalculatedDuration={totalCalculatedDuration}
        currentPath={currentPath}
        editingImageIdx={editingImageIdx}
        lastEditorPath={lastEditorPath}
        isBatchCropping={isBatchCropping}
        isCleaningBubbles={isCleaningBubbles}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        backendStatus={backendStatus}
        narrationStyle={narrationStyle}
        setNarrationStyle={setNarrationStyle}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        volume={volume}
        setVolume={setVolume}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        autoPlayAudio={autoPlayAudio}
        setAutoPlayAudio={setAutoPlayAudio}
        sfxVolume={appLogic.sfxVolume}
        setSfxVolume={appLogic.setSfxVolume}
        sfxEnabled={appLogic.sfxEnabled}
        setSfxEnabled={appLogic.setSfxEnabled}
        user={user}
        notifications={notifications}
        markNotificationAsRead={markNotificationAsRead}
        markAllNotificationsAsRead={markAllNotificationsAsRead}
        deleteNotification={deleteNotification}
        clearAllNotifications={clearAllNotifications}
        projectId={headerProjectId}
        saveStatus={headerSaveStatus}
        isDirty={headerIsDirty}
        onSave={headerOnSave}
        navigateTo={navigateTo}
        notificationsMuted={notificationsMuted}
        setNotificationsMuted={setNotificationsMuted}
        themeMode={themeMode}
        toggleThemeMode={toggleThemeMode}
      />
"""

main_body = """
      <div className="flex flex-1 overflow-hidden relative">
        {/* --- Page Navigation Sidebar --- */}
        {isAdminPath ? (
          <AdminSidebar
            currentPath={currentPath}
            navigateTo={navigateTo}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        ) : (
          <Sidebar
            isProcessing={isProcessing}
            panels={panels}
            scrapedImages={scrapedImages}
            totalCalculatedDuration={totalCalculatedDuration}
            currentPath={currentPath}
            editingImageIdx={editingImageIdx}
            lastEditorPath={lastEditorPath}
            isBatchCropping={isBatchCropping}
            isCleaningBubbles={isCleaningBubbles}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            projectId={projectId}
            isDirty={isWorkspaceDirty}
            navigateTo={navigateTo}
            notifications={notifications}
            seriesSlug={seriesSlugState}
            chapterSlug={chapterSlugState}
          />
        )}

        {/* --- Main Contents Controller & Router --- */}
        <div
          id="main-scroll-container"
          className={`flex-1 flex flex-col h-full lg:ml-20 overflow-y-auto ${
            isSidebarOpen ? "overflow-hidden" : ""
          }`}
        >
          <div className="flex-1 flex flex-col">
"""

footer_start = """        </div>

        {/* --- Global Workspace Footer --- */}
        {!isAdminPath && ("""

footer_replacement = """          </div>
        </div>

        {/* --- Global Workspace Footer --- */}
        {!isAdminPath && ("""

# Replace old banners code
content = content.replace("""        <div>
          {/* Impersonation Banner */}
          {localStorage.getItem("sonikoma_admin_token") && (
            <div className="bg-rose-600 text-white text-center py-2 px-4 text-sm font-bold flex justify-center items-center gap-4 z-[100] relative shadow-md">
              <AlertTriangle className="w-4 h-4" />
              <span>
                You are currently impersonating {user?.email || "a user"}.
              </span>
              <button
                onClick={() => {
                  const adminToken = localStorage.getItem(
                    "sonikoma_admin_token"
                  );
                  if (adminToken) {
                    localStorage.setItem("sonikoma_token", adminToken);
                    localStorage.removeItem("sonikoma_admin_token");
                    sessionStorage.removeItem("sonikoma_token");
                    window.location.href = "/admin";
                  }
                }}
                className="bg-black/20 hover:bg-black/40 px-3 py-1 rounded transition-colors"
              >
                Return to Admin
              </button>
            </div>
          )}

          {/* Engine Health Banner */}
          {backendStatus === "offline" && (
            <div className="flex flex-col w-full z-50 animate-slide-down">
              <div className="bg-gradient-to-r from-rose-950/90 to-red-950/95 border-b border-rose-800/40 px-4 py-3 text-center text-xs sm:text-sm font-semibold text-rose-250 flex flex-wrap items-center justify-center gap-3 w-full">
                <span className="flex items-center gap-2 flex-wrap justify-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-550 animate-ping" />
                  <span>
                    ⚠️ Computational Engine Server is Offline. Make sure the
                    Python backend is active (run{" "}
                    <code className="bg-black/50 px-1.5 py-0.5 rounded text-rose-350 font-mono text-xs">
                      npm run backend
                    </code>
                    ).
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={startBackend}
                    disabled={isStartingBackend}
                    className={`px-3 py-1 text-[10px] rounded-lg font-mono uppercase tracking-wider font-bold transition-all border shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      isStartingBackend
                        ? "bg-amber-950/60 border-amber-700/40 text-amber-200 cursor-not-allowed"
                        : "bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border-emerald-700/40"
                    }`}
                  >
                    {isStartingBackend ? (
                      <>
                        <svg
                          className="animate-spin h-3.5 w-3.5 text-amber-400"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Starting...
                      </>
                    ) : (
                      "Start Backend Server"
                    )}
                  </button>
                  <button
                    onClick={recheckBackend}
                    className="px-3 py-1 bg-rose-900/60 hover:bg-rose-850 text-rose-100 text-[10px] rounded-lg font-mono uppercase tracking-wider font-bold transition-all border border-rose-700/50 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Recheck Connection
                  </button>
                </div>
              </div>
              {startBackendError && (
                <div className="bg-red-950/80 border-b border-red-800/30 px-4 py-2 text-center text-xs font-semibold text-red-200 flex items-center justify-center gap-2">
                  <span>⚠️ {startBackendError}</span>
                  <button
                    onClick={() => setStartBackendError(null)}
                    className="text-red-400 hover:text-red-300 font-bold ml-2 underline text-[10px] uppercase cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}""", "")

insert_idx = content.find("    >\n") + 6
content = content[:insert_idx] + banners_and_header + main_body + content[insert_idx:]

content = content.replace(footer_start, footer_replacement)
content = content.replace("        </div>\n      </div>\n\n      {/* --------------------------------------------------------------------------", "      </div>\n\n      {/* --------------------------------------------------------------------------")

with open("frontend/src/App.tsx", "w") as f:
    f.write(content)
