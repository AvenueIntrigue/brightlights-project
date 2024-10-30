import React from 'react';
import { LogoutOptions, useAuth0 } from '@auth0/auth0-react';

const LogoutButton = () => {
  const { logout } = useAuth0();

  return (

   
    <button onClick={() => logout({ returnTo: window.location.origin} as any )}>
      Log Out
    </button>
  );
};

export default LogoutButton;
