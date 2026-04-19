import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlasses, faChildren } from '@fortawesome/free-solid-svg-icons';
import { faCalendar, faSquareCheck, faLightbulb, faComments } from '@fortawesome/free-regular-svg-icons';
import './Sidebar.css';

const navItems = [
  { to: '/', label: 'Kalender', icon: <FontAwesomeIcon icon={faCalendar} /> },
  { to: '/todos', label: "ToDos", icon: <FontAwesomeIcon icon={faSquareCheck} /> },
  { to: '/ideas', label: 'Ideen', icon: <FontAwesomeIcon icon={faLightbulb} /> },
  { to: '/observations', label: 'Beobachtungen', icon: <FontAwesomeIcon icon={faGlasses} /> },
  { to: '/talks', label: 'Gespräche', icon: <FontAwesomeIcon icon={faComments} /> },
  { to: '/children', label: 'Kinder', icon: <FontAwesomeIcon icon={faChildren} /> },
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
