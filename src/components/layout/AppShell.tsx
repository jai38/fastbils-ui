import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  LayoutDashboard,
  Building2,
  LogOut,
  FileMinus
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
  organisationName?: string;
  userName?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ 
  children, 
  organisationName: initialOrgName, 
  userName: initialUserName 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, organisation, logout } = useAuth();

  const activeOrgName = organisation?.legalName || initialOrgName || 'My Organisation';
  const activeUserName = user?.fullName || initialUserName || 'User';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Credit Notes', path: '/credit-notes', icon: FileMinus },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Top Navigation Bar */}
      <header className="h-12 bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-base tracking-tight text-brand-700">FastBills</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">GST v1</span>
          </Link>
          <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500 border-l border-gray-200 pl-4">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium text-gray-700 truncate max-w-xs">{activeOrgName}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-medium">
              {activeUserName.charAt(0)}
            </div>
            <span className="hidden sm:inline text-gray-700 font-medium">{activeUserName}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center space-x-1 text-gray-500 hover:text-red-600 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Desktop / Tablet) */}
        <aside className="w-48 bg-white border-r border-gray-200 flex flex-col justify-between p-2 hidden sm:flex">
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-2 border-t border-gray-100 text-[11px] text-gray-400">
            Rule 46 &amp; 53 Compliant
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto pb-16 sm:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (PWA Polish) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-1.5 px-2 z-30 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-600 font-bold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
              <span className="truncate max-w-[52px] text-center">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
