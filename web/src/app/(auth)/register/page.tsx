"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/providers/auth-provider";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors([]);
    setIsLoading(true);

    try {
      await register(username, email, password);
      router.push("/choose-market");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.details) setFieldErrors(err.details);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function getFieldError(field: string) {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-markit-pink-light)] px-6">
      <div className="w-full max-w-sm">
        {/* Back arrow */}
        <button
          onClick={() => router.back()}
          className="mb-4 text-lg text-[var(--color-markit-dark)]"
        >
          ← Back
        </button>

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/markit_official_logo.png"
            alt="MarkIt - Connecting people and farmers"
            width={200}
            height={80}
            priority
          />
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="h-12 border-gray-300 bg-white"
            />
            {getFieldError("username") && (
              <p className="mt-1 text-xs text-[var(--color-markit-red)]">
                {getFieldError("username")}
              </p>
            )}
          </div>

          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 border-gray-300 bg-white"
            />
            {getFieldError("email") && (
              <p className="mt-1 text-xs text-[var(--color-markit-red)]">
                {getFieldError("email")}
              </p>
            )}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 border-gray-300 bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              Password Must Contain:
              <br />• Uppercase letters, Lowercase letters, Numbers, and Special
              Characters
            </p>
            {getFieldError("password") && (
              <p className="mt-1 text-xs text-[var(--color-markit-red)]">
                {getFieldError("password")}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-[var(--color-markit-red)]">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-full bg-[var(--color-markit-pink)] text-[var(--color-markit-dark)] hover:bg-[var(--color-markit-pink)]/80"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-[var(--color-markit-red)]">
          Have an account?{" "}
          <Link href="/login" className="underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
