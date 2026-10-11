import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Radio, TrendingUp, User, Users, BarChart3 } from 'lucide-react';

export function MobileNav({ role = 'STUDENT' }) {
  const studentItems = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Courses', path: '/student/courses', icon: BookOpen },
    { label: 'Live', path: '/student/live-classes', icon: Radio },
    { label: 'Progress', path: '/student/progress', icon: TrendingUp },
    { label: 'Profile', path: '/student/profile', icon: User }
  ];

  const adminItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Courses', path: '/admin/courses', icon: BookOpen },
    { label: 'Sessions', path: '/admin/sessions', icon: Radio },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 }
  ];

  const items = role === 'ADMIN' ? adminItems : studentItems;

  return (
    <nav className="mobile-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
