import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";

// Amplify.configure({
//   Auth: {
//     region: process.env.REGION,
//     userPoolId: process.env.USER_POOL_ID,
//     userPoolWebClientId: process.env.USER_POOL_APP_CLIENT_ID,
//   },
// });

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: process.env.REACT_APP_USER_POOL_APP_CLIENT_ID || "",
      userPoolId: process.env.REACT_APP_USER_POOL_ID || "",
    }
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Authenticator.Provider>
      <App />
    </Authenticator.Provider>
  </React.StrictMode>
);