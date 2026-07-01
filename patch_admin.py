import re

with open("frontend/src/components/admin/AdminSidebar.tsx", "r") as f:
    content = f.read()

# Make it match the Sidebar logic
# Add useState, Menu import
content = content.replace("import React from \"react\";", "import React, { useState } from \"react\";")
content = content.replace("  ExternalLink,\n} from \"lucide-react\";", "  ExternalLink,\n  Menu,\n} from \"lucide-react\";")

# Add state
content = content.replace("  const { themeMode } = useThemeMode();", "  const { themeMode } = useThemeMode();\n  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);")

# Update header
search_header = """      {/* Sidebar Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-violet-900/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-600 rounded-xl shadow-lg shadow-violet-600/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-black text-white tracking-tight block leading-tight">Command</span>
            <span className="text-[10px] text-violet-400 font-mono uppercase tracking-widest">Center</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>"""

replace_header = """      {/* Sidebar Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-violet-900/10 relative">
        <div className={`flex items-center gap-3 transition-all ${!isDesktopExpanded ? "lg:opacity-0 lg:w-0 overflow-hidden" : ""}`}>
          <div className="p-2.5 bg-violet-600 rounded-xl shadow-lg shadow-violet-600/30 shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="shrink-0 whitespace-nowrap">
            <span className="font-black text-white tracking-tight block leading-tight">Command</span>
            <span className="text-[10px] text-violet-400 font-mono uppercase tracking-widest">Center</span>
          </div>
        </div>

        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
          className="hidden lg:flex p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors absolute top-6"
          style={{
            left: isDesktopExpanded ? 'auto' : '15px',
            right: isDesktopExpanded ? '15px' : 'auto'
          }}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>"""
content = content.replace(search_header, replace_header)

# Update navigation group names to hide on desktop
search_group_name = """            <h4 className="px-4 text-[10px] font-black text-violet-400/40 uppercase tracking-[0.2em] font-mono">
              {group.name}
            </h4>"""
replace_group_name = """            <h4 className={`px-4 text-[10px] font-black text-violet-400/40 uppercase tracking-[0.2em] font-mono transition-all ${!isDesktopExpanded ? "lg:opacity-0 lg:h-0 overflow-hidden" : ""}`}>
              {group.name}
            </h4>"""
content = content.replace(search_group_name, replace_group_name)

# Update list items to hide text on desktop collapse
search_list_item = """                      <span className="text-xs font-bold font-mono tracking-tight">{item.label}</span>"""
replace_list_item = """                      <span className={`text-xs font-bold font-mono tracking-tight transition-all whitespace-nowrap ${!isDesktopExpanded ? "lg:opacity-0 lg:w-0 overflow-hidden" : ""}`}>{item.label}</span>"""
content = content.replace(search_list_item, replace_list_item)

# Update footer text to hide on desktop collapse
search_footer = """        <button
          onClick={() => {
            navigateTo("/dashboard");
            onClose();
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black font-mono transition-all shadow-xl shadow-violet-600/20 active:scale-95 border border-violet-400/20"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          <span>RETURN TO APP</span>
        </button>"""
replace_footer = """        <button
          onClick={() => {
            navigateTo("/dashboard");
            onClose();
          }}
          className={`w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black font-mono transition-all shadow-xl shadow-violet-600/20 active:scale-95 border border-violet-400/20 ${!isDesktopExpanded ? "lg:px-2 lg:py-3" : ""}`}
        >
          <ExternalLink className="w-5 h-5 shrink-0" />
          <span className={`transition-all whitespace-nowrap ${!isDesktopExpanded ? "lg:opacity-0 lg:w-0 overflow-hidden" : ""}`}>RETURN TO APP</span>
        </button>"""
content = content.replace(search_footer, replace_footer)

# Update the main return block
search_return = """  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-80 z-[70] transition-transform duration-500 ease-out transform ${
          isOpen ? "translate-x-0 shadow-2xl shadow-black/80" : "-translate-x-full"
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
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity animate-fade-in lg:absolute"
          onClick={() => {
            if (isOpen) onClose();
            if (isDesktopExpanded) setIsDesktopExpanded(false);
          }}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:absolute inset-y-0 left-0 z-[70] transition-all duration-300 ease-out flex flex-col ${
          isOpen
            ? "translate-x-0 shadow-2xl shadow-black/80 w-80"
            : "-translate-x-full lg:translate-x-0"
        } ${!isDesktopExpanded ? "lg:w-20" : "lg:w-80 lg:shadow-2xl lg:shadow-black/80"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );"""
content = content.replace(search_return, replace_return)

with open("frontend/src/components/admin/AdminSidebar.tsx", "w") as f:
    f.write(content)
