import { Authenticator } from '@aws-amplify/ui-react';

const AuthPage = () => {
  return (
    <Authenticator loginMechanisms={['email']} signUpAttributes={[
      'birthdate',
      'email',
      'family_name',
      'name',
    ]}>
      {({ signOut, user }) => (
        <main>
          <h1>Hello {user && user.username}</h1>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  )
}

export default AuthPage;