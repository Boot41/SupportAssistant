import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { ShieldCheck, Loader2 } from "lucide-react";

const clientId = '274055029862-30ju5vqba01in57ftvv1i0n6mi6loo7d.apps.googleusercontent.com';

function SignIn() {
  const login = useGoogleLogin({
    scope: 'openid profile email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    flow: 'auth-code',
    clientId: clientId,
    onSuccess: async (codeResponse) => {
      try {
        const res = await axios.post('http://localhost:8000/auth', {
          code: codeResponse.code,
          redirect_uri: 'http://localhost:3000'
        });
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
              start your 14-day free trial
            </a>
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={() => login()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Sign in with Google
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
