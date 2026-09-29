import { useEffect, useState } from 'react'
import CallExperience from './CallExperience'
import { ArrowRight, Check, CircleHelp, LockKeyhole, LogOut, Video } from 'lucide-react'

type Profile = { authenticated: boolean; name?: string; email?: string; picture?: string | null }
const pendingRoomKey = 'livecall.pendingRoom'
const validRoom = (room: string | null): room is string => !!room && /^call-[a-zA-Z0-9_-]{3,59}$/.test(room)

function App() {
  const initialRoom = new URLSearchParams(window.location.search).get('room')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileError, setProfileError] = useState('')
  const [roomName, setRoomName] = useState<string | null>(() => validRoom(initialRoom) ? initialRoom : null)

  async function loadProfile() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      if (!response.ok) throw new Error('Could not check your sign-in session.')
      setProfile(await response.json() as Profile)
      setProfileError('')
    } catch {
      setProfileError('The sign-in service is not responding. Check that the backend is running, then reload.')
    }
  }

  useEffect(() => {
    if (validRoom(initialRoom)) sessionStorage.setItem(pendingRoomKey, initialRoom)
    void loadProfile()
  }, [])

  useEffect(() => {
    if (!profile?.authenticated) return
    const pending = sessionStorage.getItem(pendingRoomKey)
    if (!roomName && validRoom(pending)) setRoomName(pending)
  }, [profile, roomName])

  async function signOut() {
    try {
      const csrfResponse = await fetch('/api/csrf', { credentials: 'include', cache: 'no-store' })
      const csrf = await csrfResponse.json() as { token: string }
      await fetch('/logout', { method: 'POST', credentials: 'include', headers: { 'X-XSRF-TOKEN': csrf.token } })
    } finally {
      setRoomName(null)
      sessionStorage.removeItem(pendingRoomKey)
      await loadProfile()
    }
  }

  const loading = profile === null && !profileError
  function startCall(room = `call-${crypto.randomUUID()}`) {
    sessionStorage.setItem(pendingRoomKey, room)
    setRoomName(room)
  }
  function signIn() {
    if (roomName) sessionStorage.setItem(pendingRoomKey, roomName)
    window.location.assign('/oauth2/authorization/google')
  }

  return <main className="auth-shell">
    <header className="auth-header">
      <a className="brand" href="/" aria-label="LiveCall home"><span className="brand-mark"><Video size={19} strokeWidth={2.3} /></span><span>livecall<span className="brand-period">.</span></span></a>
      <a className="auth-help" href="mailto:support@livecall.example"><CircleHelp size={16} /> Help</a>
    </header>

    <section className="auth-content">
      {loading ? <div className="auth-card auth-state"><div className="loading-orbit light-orbit" /><p>Checking your sign-in…</p></div> : profileError ? <div className="auth-card auth-state"><div className="auth-icon"><CircleHelp size={20} /></div><h1>Couldn’t load LiveCall.</h1><p>{profileError}</p><button className="google-button" onClick={() => void loadProfile()}>Try again</button></div> : profile?.authenticated ? <>
        <div className="auth-welcome"><div className="eyebrow">YOUR PRIVATE CALL SPACE</div><h1>Welcome, {profile.name?.split(' ')[0] || 'back'}<span className="heading-dot">.</span></h1><p>Signed in as <strong>{profile.email}</strong></p></div>
        <div className="auth-card user-card">
          <div className="user-identity">{profile.picture ? <img className="user-avatar" src={profile.picture} referrerPolicy="no-referrer" alt="" /> : <div className="user-avatar avatar-fallback">{profile.name?.slice(0, 1).toUpperCase() || 'U'}</div>}<div><strong>{profile.name}</strong><span>{profile.email}</span></div><span className="signed-in-badge"><Check size={13} /> Signed in</span></div>
          <div className="auth-separator"><span /> VIDEO CALLING <span /></div>
          <h2>{roomName ? 'You’ve been invited to a call.' : 'Start a private video call.'}</h2>
          <p className="card-explainer">{roomName ? 'Join the same secure room as the person who shared this link.' : 'Create a private room and share its invite link with one person to test a real two way video connection.'}</p>
          <button className="start-test-call" onClick={() => roomName ? setRoomName(roomName) : startCall()}><Video size={17} /> {roomName ? 'Join call' : 'Start a call'} <ArrowRight size={16} /></button>
          <div className="privacy-note"><LockKeyhole size={13} /> Your Google password is never shared with LiveCall.</div>
        </div>
        <button className="signout-button" onClick={() => void signOut()}><LogOut size={15} /> Sign out</button>
      </> : <>
        <div className="auth-welcome"><div className="eyebrow">PRIVATE VIDEO CALLING</div><h1>{roomName ? <>You’re invited<br />to a call<span className="heading-dot">.</span></> : <>Face to face,<br />without the fuss<span className="heading-dot">.</span></>}</h1><p>{roomName ? 'Sign in with Google to join this private call.' : 'Sign in to start or join a private call.'}</p></div>
        <div className="auth-card sign-in-card">
          <div className="auth-icon"><LockKeyhole size={20} /></div>
          <h2>Sign in to LiveCall</h2>
          <p>Use your Google account to continue. Your password stays with Google.</p>
          <button className="google-button" onClick={signIn}><span className="google-g">G</span>Continue with Google <ArrowRight size={15} /></button>
          <div className="privacy-note"><LockKeyhole size={13} /> Only your name, email, and profile photo are requested.</div>
        </div>
      </>}
    </section>

    <footer className="auth-footer"><span>© 2026 LiveCall</span><span>Private video calls in your browser</span></footer>
    {profile?.authenticated && roomName && <CallExperience key={roomName} roomName={roomName} displayName={profile.name || profile.email || 'Guest'} callType="video" onClose={() => { setRoomName(null); sessionStorage.removeItem(pendingRoomKey); history.replaceState(null, '', '/') }} />}
  </main>
}

export default App
