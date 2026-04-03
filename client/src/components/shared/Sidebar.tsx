import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Settings } from 'lucide-react';

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
    <aside className="w-64 border-r bg-background">
      <div className="p-6 font-semibold text-lg">Admin Panel</div>

      <nav className="space-y-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted'
                }`
              }
            >
              <Icon size={18} />
              {item.title}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
