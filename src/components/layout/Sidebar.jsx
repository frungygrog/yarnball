import React from 'react';
import { cn } from '../../lib/utils';
import './Sidebar.css'; // Import the component-specific CSS

const Sidebar = ({ navItems, activeSection, onNavItemClick }) => {
  return (
    <div className="sidebar">
      <div className="logo">
        <div className="flex items-center gap-2">
          {/* Import the SVG as an image and set its color to white via CSS */}
          <img 
            src="./icon.svg" 
            alt="YarnBall Logo" 
            className="w-8 h-8 filter invert brightness-100"
          />
          <h2 className="font-bold">yarnball</h2>
        </div>
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