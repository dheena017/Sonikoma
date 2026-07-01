import re

with open("frontend/src/components/Sidebar.tsx", "r") as f:
    content = f.read()

# Add isDesktopExpanded state and toggle.
# Also change the classes of the drawer overlay to support Desktop and Mobile.
# And add the button inside the sidebar for desktop.

# Add Menu icon import
content = content.replace("import {\n  Film,", "import {\n  Menu,\n  Film,")

# State inside SidebarInner
search_state = """  const [aiSuiteExpanded, setAiSuiteExpanded] = useState(isAiSuiteActive);"""
replace_state = """  const [aiSuiteExpanded, setAiSuiteExpanded] = useState(isAiSuiteActive);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);"""
content = content.replace(search_state, replace_state)

# Refactor the branding section
search_branding = """        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer select-none hover:opacity-90 transition-opacity"
            onClick={handleNavigateToDashboardOverview}
          >
            <img
              src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
              className="h-14 w-14 rounded-full shadow-lg shadow-purple-900/40 shrink-0 object-cover"
              style={{
                background: themeMode === "light" ? "#ffffff" : "#000000",
              }}
              alt="Sonikoma Logo"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white font-sans">
                  Sonikoma
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">
                Vision Pipeline Suite
              </p>
            </div>
          </div>

          {/* Close button for drawer */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>"""

replace_branding = """        <div className="flex items-center justify-between relative">
          <div
            className={`flex items-center gap-3 cursor-pointer select-none hover:opacity-90 transition-all ${
              !isDesktopExpanded ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : ""
            }`}
            onClick={handleNavigateToDashboardOverview}
          >
            <img
              src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
              className="h-14 w-14 rounded-full shadow-lg shadow-purple-900/40 shrink-0 object-cover"
              style={{
                background: themeMode === "light" ? "#ffffff" : "#000000",
              }}
              alt="Sonikoma Logo"
            />
            <div className="shrink-0 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white font-sans">
                  Sonikoma
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">
                Vision Pipeline Suite
              </p>
            </div>
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
            className="hidden lg:flex p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer absolute -top-2"
            style={{
              left: isDesktopExpanded ? 'auto' : '-4px',
              right: isDesktopExpanded ? '0' : 'auto'
            }}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>"""
content = content.replace(search_branding, replace_branding)

# Refactor the menu items rendering
# We need to hide labels when collapsed on desktop
search_menu_item = """                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 ${
                              item.active
                                ? "text-purple-400"
                                : "text-neutral-500 group-hover:text-neutral-300"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              item.label === "Notifications" && !item.active
                                ? "bg-purple-600 text-white shadow-sm shadow-purple-900/50"
                                : item.active
                                ? "bg-purple-900 text-purple-200"
                                : "bg-black/55 text-neutral-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}"""

replace_menu_item = """                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`h-5 w-5 shrink-0 ${
                              item.active
                                ? "text-purple-400"
                                : "text-neutral-500 group-hover:text-neutral-300"
                            }`}
                          />
                          <span className={`transition-all whitespace-nowrap ${
                            !isDesktopExpanded ? "lg:opacity-0 lg:w-0 overflow-hidden" : ""
                          }`}>
                            {item.label}
                          </span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold transition-all ${
                              !isDesktopExpanded ? "lg:hidden" : ""
                            } ${
                              item.label === "Notifications" && !item.active
                                ? "bg-purple-600 text-white shadow-sm shadow-purple-900/50"
                                : item.active
                                ? "bg-purple-900 text-purple-200"
                                : "bg-black/55 text-neutral-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}"""
content = content.replace(search_menu_item, replace_menu_item)

# Refactor Creative Suite header
search_creative = """                <div className="flex items-center gap-2.5">
                  <Sparkles
                    className={`h-4 w-4 ${
                      isAiSuiteActive
                        ? "text-purple-400 animate-pulse"
                        : "text-neutral-500"
                    }`}
                  />
                  <span>Creative Suite</span>
                </div>
                {aiSuiteExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-neutral-500" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                )}"""
replace_creative = """                <div className="flex items-center gap-2.5">
                  <Sparkles
                    className={`h-5 w-5 shrink-0 ${
                      isAiSuiteActive
                        ? "text-purple-400 animate-pulse"
                        : "text-neutral-500"
                    }`}
                  />
                  <span className={`transition-all whitespace-nowrap ${
                    !isDesktopExpanded ? "lg:opacity-0 lg:w-0 overflow-hidden" : ""
                  }`}>Creative Suite</span>
                </div>
                <div className={`transition-all ${!isDesktopExpanded ? "lg:hidden" : ""}`}>
                  {aiSuiteExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                  )}
                </div>"""
content = content.replace(search_creative, replace_creative)

# Hide creative suite items on desktop when collapsed
search_creative_items = """              {aiSuiteExpanded && ("""
replace_creative_items = """              {aiSuiteExpanded && (
                <div className={`transition-all ${!isDesktopExpanded ? "lg:hidden" : ""}`}>"""
content = content.replace(search_creative_items, replace_creative_items)

search_creative_end = """              )}
            </div>"""
replace_creative_end = """                </div>
              )}
            </div>"""
content = content.replace(search_creative_end, replace_creative_end)

# Group headers visibility
content = content.replace(
    """<h4 className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono pl-2">""",
    """<h4 className={`text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono pl-2 transition-all ${
                !isDesktopExpanded ? "lg:opacity-0 lg:h-0 overflow-hidden" : ""
              }`}>"""
)

# Bottom Status Card
search_status = """        {/* Total calculated output metadata */}
        {panels.length > 0 && ("""
replace_status = """        {/* Total calculated output metadata */}
        {panels.length > 0 && (
          <div className={`transition-all ${!isDesktopExpanded ? "lg:hidden" : ""}`}>"""
content = content.replace(search_status, replace_status)

search_status_end = """          </div>
        )}"""
replace_status_end = """          </div>
          </div>
        )}"""
content = content.replace(search_status_end, replace_status_end)


# Replace the main return block to handle desktop overlays and backdrop
search_return = """  return (
    <>
      {/* Drawer backdrop (visible on both mobile and desktop when open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-45 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar drawer container (visible on both mobile and desktop, slides in/out) */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 shrink-0 bg-neutral-950/95 border-r border-neutral-900 h-full z-50 transition-transform duration-300 ease-out transform ${
          isOpen
            ? "translate-x-0 shadow-2xl shadow-black/60"
            : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );"""

replace_return = """  return (
    <>
      {/* Drawer backdrop for mobile and desktop overlay */}
      {(isOpen || isDesktopExpanded) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-45 transition-opacity animate-fade-in"
          onClick={() => {
            if (isOpen) onClose();
            if (isDesktopExpanded) setIsDesktopExpanded(false);
          }}
        />
      )}

      {/* Sidebar drawer container */}
      <aside
        className={`fixed inset-y-0 left-0 h-full bg-neutral-950/95 border-r border-neutral-900 z-50 transition-all duration-300 ease-out flex flex-col ${
          isOpen
            ? "translate-x-0 shadow-2xl shadow-black/60 w-72"
            : "-translate-x-full lg:translate-x-0"
        } ${!isDesktopExpanded ? "lg:w-20" : "lg:w-72 lg:shadow-2xl lg:shadow-black/60"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );"""
content = content.replace(search_return, replace_return)

with open("frontend/src/components/Sidebar.tsx", "w") as f:
    f.write(content)
