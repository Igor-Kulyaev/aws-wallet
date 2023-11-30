import React from 'react';
import {Authenticator} from "./Authenticator";
import {Button} from "@mui/material";
import {useAuthenticator} from "@aws-amplify/ui-react";


function App() {
  const {user, signOut} = useAuthenticator((context) => [context.user]);
  console.log('user', user);
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
