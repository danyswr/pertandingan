import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: "fas fa-chart-pie",
    section: "dashboard"
  },
  {
    name: "Manajemen Atlet",
    href: "/athletes",
    icon: "fas fa-users",
    section: "athletes"
  },
  {
    name: "Pertandingan",
    href: "/matches",
    icon: "fas fa-trophy",
    section: "matches"
  }
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-tkd-gray-200 fixed h-full overflow-y-auto">
      <div className="p-6 border-b border-tkd-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-tkd-red to-tkd-blue rounded-lg flex items-center justify-center">
            <i className="fas fa-fist-raised text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-tkd-gray-900">TKD Manager</h1>
            <p className="text-xs text-tkd-gray-500">Tournament System</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.section} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                isActive 
                  ? "bg-tkd-blue text-white" 
                  : "text-tkd-gray-700 hover:bg-tkd-gray-100"
              )}>
                <i className={item.icon}></i>
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-tkd-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-tkd-gray-300 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-tkd-gray-600 text-sm"></i>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-tkd-gray-900">Admin User</p>
            <p className="text-xs text-tkd-gray-500">Online</p>
          </div>
          <button className="text-tkd-gray-400 hover:text-tkd-gray-600">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
