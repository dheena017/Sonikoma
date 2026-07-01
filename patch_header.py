with open("frontend/src/components/Header.tsx", "r") as f:
    content = f.read()

# Make the hamburger button visible only on mobile, because on desktop it's in the Sidebar
search = """        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer"
          title="Toggle Navigation Menu"
        >"""
replace = """        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer lg:hidden"
          title="Toggle Navigation Menu"
        >"""

content = content.replace(search, replace)

with open("frontend/src/components/Header.tsx", "w") as f:
    f.write(content)
