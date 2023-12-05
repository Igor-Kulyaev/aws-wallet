import React, {useEffect, useState} from 'react';
import {Authenticator} from "./Authenticator";
import {Button} from "@mui/material";
import {useAuthenticator} from "@aws-amplify/ui-react";
import {decodeJwtToken, getIdToken} from "./utils/utils";

export interface IUserInfo {
  email: string;
  given_name: string;
  family_name: string;
  sub: string;
}


function App() {
  const {user, signOut} = useAuthenticator((context) => [context.user]);
  const [idToken, setIdToken] = useState('');
  const [userInfo, setUserInfo] = useState<null | IUserInfo>(null);

  useEffect(() => {
    if (user) {
      const foundIdToken = getIdToken(user.userId);

      foundIdToken && setIdToken(foundIdToken);
    }
  }, [user]);

  useEffect(() => {
    if (idToken) {
      const userPayload = decodeJwtToken(idToken);

      userPayload && setUserInfo({
        email: userPayload.email,
        given_name: userPayload.given_name,
        family_name: userPayload.family_name,
        sub: userPayload.sub,
      })
    }
  }, [idToken]);

  console.log('user', user);
  console.log('decoded token', decodeJwtToken(idToken));
  console.log('userInfo', userInfo);

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
