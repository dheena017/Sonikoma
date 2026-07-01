with open("frontend/src/components/Sidebar.tsx", "r") as f:
    content = f.read()

# I realize that if it's `absolute`, it will scroll if the main container scrolls.
# Oh wait, App.tsx has:
# <div className="flex flex-1 overflow-hidden relative">
#   <Sidebar />
#   <div id="main-scroll-container" className="flex-1 flex flex-col h-full lg:ml-20 overflow-y-auto">
#
# Since the relative container has `overflow-hidden`, an `absolute` sidebar will act like `fixed` within that space.
# But what about mobile where `App.tsx` overflow is not hidden?
# Actually on mobile the drawer usually acts as `fixed`.
# Using `absolute` is fine, but on mobile it's often better to have `fixed z-50` to overlay over everything including header.
# Let's change the classes: `absolute lg:absolute z-50` for desktop, but for mobile it can be `fixed` to cover the header.
# Actually, the user asked for:
# "The blurred backdrop should only cover the main content area below the Header. The Header itself must remain visible, unblurred, and interactive at the top of the screen."
# Even on mobile? They said:
# "On mobile (where the sidebar is fully hidden), keep a hamburger toggle in the Header."
# That means on mobile, when the sidebar slides in, it floats over the entire screen? The user explicitly said:
# "The Header contains the hamburger menu, which triggers the sidebar to slide in and float over the entire screen." for mobile.

# Wait, if `absolute` is used, it only covers the relative container.
# If we want it to cover the whole screen on mobile, it should be `fixed` on mobile and `absolute` on desktop.

search_backdrop = """      {/* Drawer backdrop for mobile and desktop overlay */}
      {(isOpen || isDesktopExpanded) && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md z-45 transition-opacity animate-fade-in lg:fixed"
          style={{ top: 'var(--header-height, 0px)' }} """
replace_backdrop = """      {/* Drawer backdrop for mobile and desktop overlay */}
      {(isOpen || isDesktopExpanded) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-45 transition-opacity animate-fade-in lg:absolute"
          onClick={() => {"""
content = content.replace(search_backdrop, replace_backdrop)


search_aside = """      <aside
        className={`absolute inset-y-0 left-0 h-full bg-neutral-950/95 border-r border-neutral-900 z-50 transition-all duration-300 ease-out flex flex-col ${"""
replace_aside = """      <aside
        className={`fixed lg:absolute inset-y-0 left-0 h-full bg-neutral-950/95 border-r border-neutral-900 z-50 transition-all duration-300 ease-out flex flex-col ${"""
content = content.replace(search_aside, replace_aside)

with open("frontend/src/components/Sidebar.tsx", "w") as f:
    f.write(content)
