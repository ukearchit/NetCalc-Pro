import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Network, Calculator, LayoutGrid, Layers, Settings, HelpCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from './ModeToggle';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutGrid },
  { name: 'Network Analyzer', path: '/analyzer', icon: Activity },
  { name: 'Subnet Calculator', path: '/subnet', icon: Calculator },
  { name: 'VLSM Designer', path: '/vlsm', icon: Network },
  { name: 'Supernet Calculator', path: '/supernet', icon: Layers },
  { name: 'Utilities', path: '/utilities', icon: Settings },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <Network className="w-6 h-6 text-blue-600 dark:text-blue-500 mr-2" />
          <span className="text-xl font-bold tracking-tight">NetCalc Pro</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                        : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Link to="/help" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            <HelpCircle className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
            Help & Documentation
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {navItems.find(item => item.path === location.pathname)?.name || 'NetCalc Pro'}
          </h1>
          <div className="flex items-center space-x-4">
            <ModeToggle />
            {/* User menu placeholder */}
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
              U
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
