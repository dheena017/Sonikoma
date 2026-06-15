import React from "react";
import {
  User,
  Mail,
  Shield,
  History,
  Settings,
  LogOut,
  ChevronRight,
  Camera,
  LayoutGrid,
  Video,
  Clock
} from "lucide-react";

interface ProfilePageProps {
  user: any;
  projects: any[];
  onLogout: () => void;
  onNavigateHome: () => void;
}

export default function ProfilePage({ user, projects, onLogout, onNavigateHome }: ProfilePageProps) {
  return (
    <div className="min-h-screen bg-[#070709] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/10 bg-neutral-900">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-neutral-600" />
                  </div>
                )}
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-purple-600 rounded-xl shadow-lg border border-white/10 hover:bg-purple-500 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight">{user?.full_name || "Anivox User"}</h1>
              <p className="text-neutral-500 flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-neutral-900 border border-white/5 rounded-xl text-sm font-bold text-neutral-400 hover:text-white transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-rose-600/10 border border-rose-500/20 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* SIDEBAR INFO */}
          <div className="lg:col-span-1 space-y-6">
            <section className="bg-neutral-900/50 rounded-3xl p-6 border border-white/5 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Account Details</h3>
              <div className="space-y-4">
                <InfoItem icon={<Shield className="w-4 h-4" />} label="Member Since" value="January 2025" />
                <InfoItem icon={<LayoutGrid className="w-4 h-4" />} label="Total Projects" value={projects.length.toString()} />
                <InfoItem icon={<Video className="w-4 h-4" />} label="Videos Rendered" value="12" />
                <InfoItem icon={<Clock className="w-4 h-4" />} label="AI Credits" value="840 / 1000" />
              </div>
              <button className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                Edit Profile Settings
              </button>
            </section>
          </div>

          {/* RECENT PROJECTS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Recent Projects
              </h2>
              <button className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="py-12 bg-neutral-900/30 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center">
                     <LayoutGrid className="w-6 h-6 text-neutral-600" />
                   </div>
                   <p className="text-neutral-500 text-sm font-medium">No projects found. Start by scraping a Webtoon!</p>
                   <button onClick={onNavigateHome} className="text-purple-400 font-bold hover:underline">Create your first project</button>
                </div>
              ) : (
                projects.map((project, idx) => (
                  <ProjectItem key={project.project_id || idx} project={project} />
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-neutral-400">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold text-neutral-200">{value}</span>
    </div>
  );
}

function ProjectItem({ project }: { project: any }) {
  return (
    <div className="group bg-neutral-900/40 hover:bg-neutral-800/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
          <LayoutGrid className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
            {project.title || "Untitled Project"}
          </h4>
          <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
            {project.status || "Completed"} • {project.created_at || "2 hours ago"}
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
    </div>
  );
}
