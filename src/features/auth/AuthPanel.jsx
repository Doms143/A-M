import { supabase } from "../../shared/supabase/client";

export function AuthPanel({ session }) {
  async function signInAsGuest() {
    await supabase.auth.signInAnonymously();
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="card auth-card">
      <h2>Account</h2>
      {session ? (
        <>
          <p>Signed in. Orders will be linked to your Supabase user session.</p>
          <button className="secondary-button" onClick={signOut}>
            Sign out
          </button>
        </>
      ) : (
        <>
          <p>Start with anonymous auth, then upgrade to email or OTP in Supabase Auth.</p>
          <button className="primary-button" onClick={signInAsGuest}>
            Continue as guest
          </button>
        </>
      )}
    </div>
  );
}
