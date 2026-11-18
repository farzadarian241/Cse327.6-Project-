"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const DEMO_ACCOUNTS = [
  {
    role: "Student (Campus Verified)",
    email: "tanvir@northsouth.edu",
    password: "Password123!",
    badge: "NSU Student",
    badgeColor: "bg-teal-50 text-brand-teal border-teal-200",
    icon: ShieldCheck,
    note: "Pre-verified .edu university student",
  },
  {
    role: "Administrator",
    email: "admin@haatbodol.com",
    password: "Password123!",
    badge: "Admin Privileges",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    icon: ShieldAlert,
    note: "Full marketplace moderation access",
  },
  {
    role: "Resident (Standard)",
    email: "rafiul.dhaka@gmail.com",
    password: "Password123!",
    badge: "Dhaka Resident",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    icon: UserCheck,
    note: "Standard neighborhood buyer & seller",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();

  const redirectUrl = searchParams.get("redirect") || searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Basic client validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login({ email: trimmedEmail, password });
      if (result.success) {
        setSuccessMessage("Sign in successful! Redirecting...");
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 500);
      } else {
        setErrorMessage(result.error || "Invalid email or password. Please try again.");
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already logged in, show state
  if (user) {
    return (
      <div className="max-w-md mx-auto my-8 bg-white p-6 rounded-xl shadow-md border border-gray-200 text-center">
        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-brand-teal" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Already Signed In</h2>
        <p className="text-xs text-gray-600 mt-1">
          You are currently signed in as <strong className="text-gray-900">{user.full_name}</strong> (
          {user.email}).
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/"
            className="w-full py-2 px-4 bg-brand-amber hover:bg-brand-amberHover text-white font-bold rounded-lg text-xs transition-colors"
          >
            Go to Marketplace Homepage
          </Link>
          <Link
            href="/dashboard"
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs transition-colors"
          >
            Go to User Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-4 sm:my-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex flex-col items-center group focus:outline-none">
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#131921] group-hover:text-amber-500 transition-colors">
            হাত<span className="text-brand-amber">বদল</span>
          </span>
          <span className="text-[11px] tracking-widest uppercase font-semibold text-gray-500 mt-0.5">
            HaatBodol Marketplace
          </span>
        </Link>
        <h1 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Peer-to-peer campus & local Dhaka used goods marketplace
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white py-6 px-6 sm:px-8 shadow-md rounded-xl border border-gray-200">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Sign In Unsuccessful</span>
              <span className="text-rose-700">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <div
            className="mb-4 p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-start gap-2.5"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold">{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. tanvir@northsouth.edu"
                className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-transparent"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700">
                Password
              </label>
            </div>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="block w-full pl-9 pr-10 py-2 text-xs sm:text-sm text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-xs sm:text-sm font-bold text-white bg-brand-amber hover:bg-brand-amberHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-amber transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins Section */}
        <div className="mt-6 pt-5 border-t border-gray-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2.5 text-center">
            Evaluator Quick Demo Logins
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((demo) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickFill(demo.email, demo.password)}
                  className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:border-brand-teal hover:bg-teal-50/40 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-gray-100 group-hover:bg-white text-gray-700">
                      <Icon className="w-4 h-4 text-brand-teal" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-800">{demo.role}</span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${demo.badgeColor}`}
                        >
                          {demo.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">{demo.email}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pl-2">
                    Auto-fill
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            All seeded accounts share password: <code className="font-mono text-gray-600">Password123!</code>
          </p>
        </div>

        {/* Link to Register */}
        <div className="mt-6 pt-5 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-600 mb-2">New to HaatBodol?</p>
          <Link
            href="/register"
            className="w-full inline-block text-center py-2 px-4 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all shadow-sm"
          >
            Create your HaatBodol account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
