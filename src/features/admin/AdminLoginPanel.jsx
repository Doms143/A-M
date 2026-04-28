import { useState } from "react";

export function AdminLoginPanel({ isSigningIn, onSubmit }) {
  const [formState, setFormState] = useState({
    email: "",
    password: ""
  });

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(formState);
  }

  return (
    <section className="card admin-login-card">
      <div className="section-header">
        <div>
          <h2>Admin sign in</h2>
          <p>Use your Supabase email and password to access product controls and recent orders.</p>
        </div>
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <label className="field-block">
          <span className="field-label">Admin email</span>
          <input
            autoComplete="email"
            className="text-input"
            placeholder="name@example.com"
            required
            type="email"
            value={formState.email}
            onChange={(event) =>
              setFormState((current) => ({ ...current, email: event.target.value }))
            }
          />
        </label>
        <label className="field-block">
          <span className="field-label">Password</span>
          <input
            autoComplete="current-password"
            className="text-input"
            placeholder="Enter password"
            required
            type="password"
            value={formState.password}
            onChange={(event) =>
              setFormState((current) => ({ ...current, password: event.target.value }))
            }
          />
        </label>
        <button className="primary-button" disabled={isSigningIn} type="submit">
          {isSigningIn ? "Signing in..." : "Sign in to admin"}
        </button>
      </form>
    </section>
  );
}
