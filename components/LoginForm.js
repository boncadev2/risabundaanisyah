"use client";

import { LogIn } from "lucide-react";
import { useState } from "react";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form action="/api/auth/login" method="post" onSubmit={() => setIsLoading(true)}>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className={`btn primary ${isLoading ? "is-loading" : ""}`} type="submit" disabled={isLoading}>
        {isLoading ? <i className="button-spinner" /> : <LogIn size={17} />}
        {isLoading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
