import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Settings } from 'lucide-react';
import { UserProfileDropdown } from './UserProfileDropdown';

const navItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    title: 'Users',
    icon: Users,
    path: '/users',
  },
  {
    title: 'Customers',
    icon: Users,
    path: '/customers',
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background flex flex-col h-full">
      <div className="p-6 font-semibold text-lg flex items-center gap-2">
        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
          <LayoutDashboard size={18} />
        </div>
        <span>ERP Admin</span>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted font-medium'
                }`
              }
            >
              <Icon size={18} />
              {item.title}
            </NavLink>
          );
        })}
      </nav>

      <UserProfileDropdown />
    </aside>
  );
}
