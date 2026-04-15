import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { to: '/', label: 'Calendar', icon: '📅' },
  { to: '/todos', label: "ToDo's", icon: '✅' },
  { to: '/ideas', label: 'Ideas', icon: '💡' },
  { to: '/observations', label: 'Observations', icon: '👀' },
  { to: '/talks', label: 'Talks', icon: '💬' },
  { to: '/children', label: 'Children', icon: '🧒' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>DayNotes</h1>
        <span className="sidebar-subtitle">Kindergarten Planner</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
