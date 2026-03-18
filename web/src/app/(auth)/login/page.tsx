"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/providers/auth-provider";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password);
      router.push("/choose-market");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-markit-pink-light)] px-6">
      <div className="w-full max-w-sm">
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="h-12 border-gray-300 bg-white"
          />
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
          </div>

          {error && (
            <p className="text-sm text-[var(--color-markit-red)]">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-full bg-[var(--color-markit-pink)] text-[var(--color-markit-dark)] hover:bg-[var(--color-markit-pink)]/80"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        {/* Forgot password */}
        <p className="mt-4 text-center text-sm text-gray-500">
          Forgot Password?
        </p>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-[var(--color-markit-red)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}
