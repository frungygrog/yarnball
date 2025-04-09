import React from 'react';
import { cn } from '../../lib/utils';

const Sidebar = ({ navItems, activeSection, onNavItemClick }) => {
  return (
    <div className="sidebar">
      <div className="logo">
        <h2 style={{ textTransform: 'lowercase' }}>YarnBall</h2>
      </div>
      <nav className="nav-menu">
        <ul>
          {navItems.map(item => (
            <li key={item.id}>
              <a
                href="#"
                className={cn("nav-item", activeSection === item.id && "active")}
                onClick={(e) => {
                  e.preventDefault();
                  onNavItemClick(item.id);
                }}
              >
                {item.icon}
                <span style={{ textTransform: 'lowercase' }}>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;