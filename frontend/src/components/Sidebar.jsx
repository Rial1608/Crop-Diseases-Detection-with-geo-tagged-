import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Leaf,
  BarChart3,
  MapPin,
  Harvest,
  Cloud,
  Settings,
  LogOut
} from 'lucide-react';

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: MapPin, label: 'Fields', path: '/fields' },
    { icon: Harvest, label: 'Harvesting', path: '/harvesting' },
    { icon: Cloud, label: 'Weather', path: '/weather' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">SmartCrop</h1>
            <p className="text-xs text-gray-400">Agriculture AI</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-red-400 rounded-lg transition-all duration-200">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
