import { useCallback, useRef, useState } from 'react';
import { ProfileEditForm } from '../features/user/components/ProfileEditForm.jsx';
import { useProfileEdit } from '../features/user/useProfileEdit.js';
import { ConfirmDialog } from '../shared/components/ConfirmDialog.jsx';
import { getErrorMessage } from '../shared/errors/errorMessages.js';

export function ProfileEditPage() {
  const { user, updateProfile, withdraw, isWithdrawing, withdrawError } = useProfileEdit();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const withdrawTriggerRef = useRef(null);
  const closeWithdrawDialog = useCallback(() => setIsWithdrawOpen(false), []);

  async function handleWithdraw() {
    if (await withdraw()) closeWithdrawDialog();
  }

  return (
    <main id="main-content" className="profile-edit-main">
      <section className="profile-edit-section" aria-labelledby="profile-edit-title">
        <h1 id="profile-edit-title" className="profile-edit-title">회원정보수정</h1>
        <ProfileEditForm user={user} onSubmit={updateProfile} />
        <button ref={withdrawTriggerRef} className="withdraw-link" type="button" onClick={() => setIsWithdrawOpen(true)}>회원 탈퇴</button>
      </section>

      <ConfirmDialog
        open={isWithdrawOpen}
        title="회원탈퇴 하시겠습니까?"
        description="작성된 게시글과 댓글은 삭제됩니다."
        pending={isWithdrawing}
        pendingLabel="탈퇴 중…"
        errorMessage={withdrawError ? getErrorMessage(withdrawError, 'user.withdraw') : ''}
        triggerRef={withdrawTriggerRef}
        onConfirm={handleWithdraw}
        onClose={closeWithdrawDialog}
      />
    </main>
  );
}
