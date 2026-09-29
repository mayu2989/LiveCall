import { useEffect, useState } from 'react'
import { ControlBar, GridLayout, LiveKitRoom, ParticipantTile, RoomAudioRenderer, useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Check, Copy, Phone, X } from 'lucide-react'

type Props = { roomName: string; displayName: string; callType: 'video' | 'audio'; onClose: () => void }
type TokenResponse = { serverUrl: string; token: string }

function CallRoomContent({ callType }: { callType: 'video' | 'audio' }) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false })
  return <div className="call-room-content">
    <GridLayout tracks={tracks}>
      <ParticipantTile />
    </GridLayout>
    <ControlBar controls={{ camera: callType === 'video', microphone: true, screenShare: false, chat: false, leave: true }} variation="minimal" />
  </div>
}

export default function CallExperience({ roomName, displayName, callType, onClose }: Props) {
  const [connection, setConnection] = useState<TokenResponse | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function connect() {
      try {
        const csrfResponse = await fetch('/api/csrf', { credentials: 'include' })
        if (!csrfResponse.ok) throw new Error('Could not start a secure session.')
        const csrf = await csrfResponse.json() as { token: string }
        const response = await fetch('/api/calls/token', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': csrf.token },
          body: JSON.stringify({ roomName }),
        })
        if (!response.ok) {
          if (response.redirected || response.status === 401 || response.status === 403) throw new Error('Sign in with Google first, then start your call again.')
          const body = await response.json().catch(() => ({})) as { message?: string; detail?: string }
          throw new Error(body.detail ?? body.message ?? 'Could not create the call. Check that LiveKit is configured.')
        }
        const data = await response.json() as TokenResponse
        if (!cancelled) setConnection(data)
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not connect to the calling service.')
      }
    }
    void connect()
    return () => { cancelled = true }
  }, [roomName])

  async function copyInvite() {
    const link = new URL(`/?room=${encodeURIComponent(roomName)}`, window.location.origin).toString()
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      window.prompt('Copy this private call link:', link)
    }
  }

  return <div className="call-overlay"><div className="call-window"><header className="call-window-header"><div><span className="call-live-dot" />{callType === 'video' ? 'VIDEO CALL' : 'AUDIO CALL'}<strong>{displayName}</strong></div><div className="call-header-actions"><button className="invite-copy" onClick={() => void copyInvite()}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy invite link'}</button><button onClick={onClose} aria-label="Close call"><X size={18} /></button></div></header>{error ? <div className="call-error"><div className="call-error-icon"><Phone size={20} /></div><h2>Couldn’t start this call</h2><p>{error}</p><button onClick={onClose}>Close</button></div> : connection ? <LiveKitRoom serverUrl={connection.serverUrl} token={connection.token} connect audio video={callType === 'video'} onDisconnected={onClose} onError={reason => setError(reason.message)}><RoomAudioRenderer /><CallRoomContent callType={callType} /></LiveKitRoom> : <div className="call-loading"><div className="loading-orbit" /><strong>Setting up your call…</strong><span>Allow camera and microphone access. Copy the invite link for the other person.</span><button onClick={onClose}>Cancel</button></div>}</div></div>
}
