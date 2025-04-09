import React from 'react';
import { cn } from '../../lib/utils';

const Notification = ({ show, message, type = 'info' }) => {
  return (
    <div 
      className={cn(
        'notification', 
        type, 
        show ? 'show' : ''
      )}
    >
      {message}
    </div>
  );
};

export default Notification;