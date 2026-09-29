CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    avatar_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_identity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL,
    provider_user_id VARCHAR(255),
    password_hash VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_auth_provider_identity UNIQUE (provider, provider_user_id),
    CONSTRAINT ck_auth_identity_provider CHECK (provider IN ('password', 'google'))
);

CREATE TABLE contact_relationship (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_contact_pair UNIQUE (requester_id, recipient_id),
    CONSTRAINT ck_contact_not_self CHECK (requester_id <> recipient_id),
    CONSTRAINT ck_contact_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'))
);

CREATE TABLE call_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livekit_room_name VARCHAR(64) NOT NULL UNIQUE,
    call_type VARCHAR(12) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'RINGING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    CONSTRAINT ck_call_type CHECK (call_type IN ('AUDIO', 'VIDEO')),
    CONSTRAINT ck_call_status CHECK (status IN ('RINGING', 'ACTIVE', 'DECLINED', 'MISSED', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE call_participant (
    call_id UUID NOT NULL REFERENCES call_session(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role VARCHAR(12) NOT NULL,
    outcome VARCHAR(20),
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    PRIMARY KEY (call_id, user_id),
    CONSTRAINT ck_call_participant_role CHECK (role IN ('CALLER', 'RECIPIENT'))
);

CREATE INDEX idx_contact_recipient_status ON contact_relationship(recipient_id, status);
CREATE INDEX idx_call_participant_user ON call_participant(user_id, call_id);
