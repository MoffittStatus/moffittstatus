'use client'
import React, { useState } from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle authentication logic here
    console.log('Form submitted:', { email, password, isLogin });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      {/* Main Card */}
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#003262] mb-2">
            {isLogin ? 'Welcome Back' : 'Join the Community'}
          </h1>
          <p className="text-gray-500">
            Track library seats and earn rewards.
          </p>
        </div>

        {/* Google SSO */}
        <button 
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full bg-[#003262] hover:bg-[#00254d] text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-md mb-4"
        >
          {/* google logo placeholder */}
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
             <span className="text-[#003262] text-xs font-bold">G</span>
          </div>
          <span>Continue with Google</span>
        </button>

        {/* calnet SSO */}
        <button 
          type="button"
          disabled
          className="w-full bg-gray-200 text-gray-500 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all cursor-not-allowed mb-6 opacity-60"
        >
          {/* calnet logo */}
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
             <span className="text-gray-400 text-xs font-bold">C</span>
          </div>
          <span>CalNet (Coming Soon)</span>
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-400">Or continue with email</span>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address" 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003262] focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003262] focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-white border-2 border-gray-100 hover:border-[#003262] text-gray-700 hover:text-[#003262] font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isLogin ? 'Log In' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-[#003262] font-bold hover:underline focus:outline-none"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

// import { SignupForm } from "@/components/signup-form"
// export default function Page() {
//   return (
//     <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
//       <div className="w-full max-w-sm">
//         <SignupForm />
//       </div>
//     </div>
//   )
// }