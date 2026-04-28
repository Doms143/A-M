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
    <section className="card login-card">
      <div className="section-header">
        <div>
          <h2>Sign In</h2>
          <p>Enter your credentials</p>
        </div>
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <label className="field-block">
          <span className="field-label">Email address</span>
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
          {isSigningIn ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
