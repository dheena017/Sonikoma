import React, { useState } from "react";
import {
  Search,
  Bell,
  Clock,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react";

interface AdminNavbarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  stats: any;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ navigateTo, stats }) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 bg-[#070709] border-b border-white/5 sticky top-16 z-40 px-8 flex items-center justify-between">
      <div className="text-sm font-bold text-white font-mono tracking-tight">Admin</div>
    </header>
  );
};

export default AdminNavbar;
