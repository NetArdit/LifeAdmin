import { Icon } from '../Icon.jsx';
import { initials } from '../../../../public/js/format.js';
import { confirmDialog } from '../../../../public/js/components/confirm.js';
import { openAddMemberModal } from './AddMemberModal.jsx';
import { SentInvitations } from './Invitations.jsx';
import { useState } from 'react';

// Direct port of renderMembers()/memberCard() from the original
// public/js/pages/family.js. `canManage` is a UI convenience only — it
// decides whether the Add/Remove controls are even rendered, but the
// backend independently re-enforces requireRole(['owner','admin']) on
// every mutation regardless of what this component shows or hides (see
// Phase 3 report §8, Authorization Model). Hiding a button is never the
// actual security boundary here.
//
// Phase 8.3 adds two explicit, user-initiated lifecycle actions, each backed
// by its own server-side check: "Make owner" (owner only, registered member
// target) and "Leave family" (any non-owner). confirmDialog escapes its text,
// so member and family names are passed through as plain text.
export function MembersTab({ api, toast, familyId, family, myRole, onChanged }) {
  const canManage = myRole === 'owner' || myRole === 'admin';
  const isOwner = myRole === 'owner';
  const [sentKey, setSentKey] = useState(0);
  const hasOtherRegistered = family.members.some((m) => m.registered && m.role !== 'owner');

  async function handleRemove(memberId) {
    const ok = await confirmDialog({
      title: 'Remove member?',
      message: 'They will lose access to shared circle data.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    const result = await api.del(`/api/family/${familyId}/members/${memberId}`);
    // The server replaces the invite code when a registered member is removed, so the
    // removed person can't simply rejoin with the code they already know.
    toast(result && result.inviteCodeRotated ? 'Member removed. The invite code was changed.' : 'Member removed', 'success');
    onChanged();
  }

  async function handleTransfer(member) {
    const name = member.displayName || 'this member';
    const ok = await confirmDialog({
      title: 'Transfer ownership?',
      message:
        `${name} will become the owner of “${family.name}”. ` +
        'You will become a regular member and lose the ability to manage members, roles and ownership. ' +
        'Nothing is deleted. Only the new owner can transfer ownership back.',
      confirmLabel: 'Transfer ownership',
      danger: false,
    });
    if (!ok) return;
    try {
      await api.post(`/api/family/${familyId}/transfer-ownership`, { memberId: member.id });
      toast('Ownership transferred', 'success');
    } catch (err) {
      toast((err && err.message) || 'Could not transfer ownership', 'error');
    }
    onChanged();
  }

  async function handleLeave() {
    const ok = await confirmDialog({
      title: 'Leave this circle?',
      message:
        `You will lose access to “${family.name}” and its shared data. ` +
        'Your account and personal data stay as they are. You can rejoin later only with a new invite.',
      confirmLabel: 'Leave circle',
    });
    if (!ok) return;
    try {
      await api.post(`/api/family/${familyId}/leave`, {});
      toast('You left the circle', 'success');
    } catch (err) {
      toast((err && err.message) || 'Could not leave the circle', 'error');
    }
    onChanged();
  }

  return (
    <div className="card card-pad">
      <div className="card-header">
        <span className="card-title">Members</span>
        {canManage ? (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => openAddMemberModal({ api, toast, familyId, onAdded: () => { setSentKey((k) => k + 1); onChanged(); } })}
          >
            <Icon name="plus" cls="icon-sm" /> Invite
          </button>
        ) : null}
      </div>
      <div className="member-grid">
        {family.members.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            canManage={canManage}
            canTransfer={isOwner && m.registered && m.role !== 'owner'}
            onRemove={handleRemove}
            onTransfer={handleTransfer}
          />
        ))}
      </div>
      {canManage ? <SentInvitations api={api} toast={toast} familyId={familyId} refreshKey={sentKey} /> : null}
      {isOwner ? (
        <p className="text-xs muted member-lifecycle-note">
          {hasOtherRegistered
            ? 'You own this circle. To leave it, or to delete your account, first transfer ownership with “Make owner” on another member.'
            : 'You own this circle and are its only registered member, so you can’t leave it or transfer ownership yet. Invite someone to join first.'}
        </p>
      ) : (
        <div className="member-lifecycle-note">
          <button className="btn btn-sm" onClick={handleLeave}>
            Leave circle
          </button>
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, canManage, canTransfer, onRemove, onTransfer }) {
  return (
    <div className="card member-card">
      <div className="avatar">{initials(...(member.displayName || '').split(' '))}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-sm" style={{ fontWeight: 650 }}>
          {member.displayName}
        </div>
        {/* Visual Redesign Batch 5: role/status distinction, per the
            batch's own guidance ("use... status/role distinction" on this
            genuinely set-shaped content) — reuses the existing, generic
            .badge/.badge-neutral classes already used everywhere else in
            the app (no new CSS, no new color convention). Deliberately
            NOT module-accented: role is a status, not a "which module"
            signal, matching how priority/status badges elsewhere already
            stay outside the module-accent system. */}
        <div className="row" style={{ gap: 6, marginTop: 4 }}>
          <span className="badge badge-neutral member-role">{member.role}</span>
          {member.registered ? null : <span className="text-xs muted">Invited</span>}
        </div>
      </div>
      {canManage && member.role !== 'owner' ? (
        <button className="icon-btn" aria-label={`Remove ${member.displayName}`} onClick={() => onRemove(member.id)}>
          <Icon name="x" cls="icon-sm" />
        </button>
      ) : null}
      {canTransfer ? (
        <div className="member-actions">
          <button
            className="btn btn-sm"
            aria-label={`Make ${member.displayName} the owner`}
            onClick={() => onTransfer(member)}
          >
            Make owner
          </button>
        </div>
      ) : null}
    </div>
  );
}
