"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  GraduationCap,
  Phone,
  MapPin,
  Home,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const DHAKA_CAMPUS_AREAS = [
  "Bashundhara R/A (NSU / IUB / AIUB)",
  "Merul Badda / Mohakhali (BRACU Area)",
  "Nilkhet / Shahbagh (DU Campus)",
  "Dhanmondi (UIU / DIU Area)",
  "Mirpur / Agargaon Area",
  "Uttara Campus Zone",
  "Dhaka Central / Motijheel",
  "Other Dhaka Neighborhood",
];

function isEduDomain(val) {
  if (!val) return false;
  const str = val.trim().toLowerCase();
  return (
    str.endsWith(".edu") ||
    str.endsWith(".edu.bd") ||
    str.endsWith(".ac.bd") ||
    str.includes(".edu.") ||
    /@(.*\.)?(?:edu|edu\.bd|ac\.bd)$/i.test(str)
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, register } = useAuth();

  const redirectUrl = searchParams.get("redirect") || "/";

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    institutional_email: "",
    phone_number: "",
    campus_area: "Bashundhara R/A (NSU / IUB / AIUB)",
    residential_address: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic campus verification live check
  const isEligibleForCampusVerification = useMemo(() => {
    return isEduDomain(formData.email) || isEduDomain(formData.institutional_email);
  }, [formData.email, formData.institutional_email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Client-side validations
    const fullName = formData.full_name.trim();
    if (!fullName || fullName.length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return;
    }

    const primaryEmail = formData.email.trim();
    if (!primaryEmail || !primaryEmail.includes("@") || !primaryEmail.includes(".")) {
      setErrorMessage("Please enter a valid primary email address.");
      return;
    }

    const instEmail = formData.institutional_email.trim();
    if (instEmail && (!instEmail.includes("@") || !instEmail.includes("."))) {
      setErrorMessage("Please enter a valid institutional email or leave the field blank.");
      return;
    }

    const phone = formData.phone_number.trim();
    if (!phone || phone.length < 8) {
      setErrorMessage("Please enter a valid phone number (e.g. +88017XXXXXXXX).");
      return;
    }

    const address = formData.residential_address.trim();
    if (!address || address.length < 4) {
      setErrorMessage("Please enter your residential address or campus hall/hostel.");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters in length.");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrorMessage("Passwords do not match. Please re-enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        full_name: fullName,
        email: primaryEmail,
        institutional_email: instEmail || null,
        phone_number: phone,
        campus_area: formData.campus_area,
        residential_address: address,
        password: formData.password,
      };

      const result = await register(payload);
      if (result.success) {
        setSuccessMessage("Account created successfully! Welcome to HaatBodol.");
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 600);
      } else {
        setErrorMessage(result.error || "Registration could not be completed. Please check your inputs.");
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return (
      <div className="max-w-lg mx-auto my-8 bg-white p-6 rounded-xl shadow-md border border-gray-200 text-center">
        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-brand-teal" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Already Signed In</h2>
        <p className="text-xs text-gray-600 mt-1">
          You are already signed in as <strong className="text-gray-900">{user.full_name}</strong> (
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
    <div className="max-w-lg mx-auto my-4 sm:my-8">
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
          Create your HaatBodol account
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Join Dhaka's peer-to-peer campus and residential marketplace
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="bg-white py-6 px-6 sm:px-8 shadow-md rounded-xl border border-gray-200">
        {/* Dynamic Campus Verification Banner */}
        {isEligibleForCampusVerification ? (
          <div className="mb-5 p-3.5 rounded-lg bg-teal-50 border border-teal-300 text-teal-900 flex items-start gap-3 animate-in fade-in transition-all">
            <div className="p-1 rounded-full bg-teal-100 text-teal-700 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-brand-teal uppercase tracking-wider">
                  Campus Verified eligible!
                </span>
                <span className="text-[10px] bg-teal-200/80 text-teal-800 font-bold px-1.5 py-0.2 rounded-full">
                  Instant Status
                </span>
              </div>
              <p className="text-[11px] text-teal-800 mt-0.5 leading-relaxed">
                Your institutional <code>.edu</code> / <code>.edu.bd</code> domain qualifies you for the trusted
                green shield badge, campus-filtered search priority, and verified student-to-student transactions!
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 flex items-start gap-2.5">
            <GraduationCap className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-600 leading-relaxed">
              <strong>University Student or Faculty?</strong> Use or add an institutional email ending in{" "}
              <code>.edu</code> or <code>.edu.bd</code> (e.g. NSU, BRACU, DU) for instant Campus Verified status.
            </p>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Registration Error</span>
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Tanvir Ahmed"
                className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-transparent"
              />
            </div>
          </div>

          {/* Primary Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
              Primary Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. tanvir@northsouth.edu or personal@gmail.com"
                className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-transparent"
              />
            </div>
          </div>

          {/* Optional Institutional Student Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="institutional_email" className="block text-xs font-semibold text-gray-700">
                Institutional Student Email <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-brand-teal font-medium">Instant .edu verification</span>
            </div>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GraduationCap className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="institutional_email"
                name="institutional_email"
                type="email"
                value={formData.institutional_email}
                onChange={handleChange}
                placeholder="e.g. yourname@northsouth.edu, @bracu.ac.bd, @du.ac.bd"
                className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              If your primary email is personal (e.g. Gmail), provide your university email here to receive Campus Verified student status.
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone_number" className="block text-xs font-semibold text-gray-700 mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                required
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="e.g. +8801711000001"
                className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-transparent"
              />
            </div>
          </div>

          {/* Residential / Campus Area */}
          <div>
            <label htmlFor="campus_area" className="block text-xs font-semibold text-gray-700 mb-1">
              Residential / Campus Area <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <select
                id="campus_area"
                name="campus_area"
                value={formData.campus_area}
                onChange={handleChange}
                className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-transparent"
              >
                {DHAKA_CAMPUS_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Residential Address / Hall */}
          <div>
            <label htmlFor="residential_address" className="block text-xs font-semibold text-gray-700 mb-1">
              Residential Address / Hall <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Home className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="residential_address"
                name="residential_address"
                type="text"
                required
                value={formData.residential_address}
                onChange={handleChange}
                placeholder="e.g. House 14, Road 7, Block D, Bashundhara R/A"
                className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-transparent"
              />
            </div>
          </div>

          {/* Password & Confirm Password Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 chars"
                  className="block w-full pl-9 pr-8 py-2 text-xs text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-xs font-semibold text-gray-700 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="block w-full pl-9 pr-8 py-2 text-xs text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-xs sm:text-sm font-bold text-white bg-brand-amber hover:bg-brand-amberHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-amber transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed pt-2.5 mt-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create HaatBodol Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="mt-6 pt-5 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-brand-teal hover:underline ml-1">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
