import React from 'react';
import {Authenticator} from "./Authenticator";
import {Button} from "@mui/material";
import {useAuthenticator} from "@aws-amplify/ui-react";


function App() {
  const {user, signOut} = useAuthenticator((context) => [context.user]);
  const route = useAuthenticator((context) => [context.route]);
  const authStatus = useAuthenticator((context) => [context.authStatus]);
  const error = useAuthenticator((context ) => {
    console.log('context', context);
    return [context.challengeName];
  });
  console.log('user', user);
  console.log('route', route);
  console.log('authStatus', authStatus);
  console.log('error', error);

  return (
    <Authenticator>
      Test
      <Button variant="contained" color="primary" onClick={signOut}>
        Logout
      </Button>
    </Authenticator>
  );
}

export default App;
