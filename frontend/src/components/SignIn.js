import React from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const clientId = '274055029862-30ju5vqba01in57ftvv1i0n6mi6loo7d.apps.googleusercontent.com'; // <-- Replace with actual client_id

function OAuthButton() {
  const login = useGoogleLogin({
    scope: 'openid profile email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        const res = await axios.post('http://localhost:8000/auth', {
          code: codeResponse.code,
          redirect_uri: 'http://localhost:3000'
        });
        // Redirect or show success
        console.log(res.data);
        if(res.data.success) {
          window.location.href = '/operator';
        }
      } catch (err) {
        console.error('Auth failed', err);
      }
    },
    onError: (err) => console.error(err),
  });

  return (
    <button onClick={() => login()}>
      Sign in with Google
    </button>
  );
}

function SignIn() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="signin-container">
        <h2>Sign in with Google</h2>
        <OAuthButton />
      </div>
    </GoogleOAuthProvider>
  );
}

export default SignIn;
