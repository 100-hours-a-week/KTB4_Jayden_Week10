import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { PasswordEditForm } from '../features/user/components/PasswordEditForm.jsx';
import { updatePassword } from '../features/user/userService.js';
import { useToast } from '../shared/components/ToastContext.jsx';

export function PasswordEditPage() {
  const navigate = useNavigate();
  const { markAnonymous } = useAuth();
  const { showToast } = useToast();

  async function handleUpdatePassword(password) {
    await updatePassword(password);
    showToast('비밀번호가 수정되었습니다.');
    markAnonymous({ suppressReturnTo: true });
    navigate('/login', { replace: true });
  }

  return (
    <main id="main-content" className="password-edit-main">
      <section className="password-edit-section" aria-labelledby="password-edit-title">
        <h1 id="password-edit-title" className="password-edit-title">비밀번호 수정</h1>
        <PasswordEditForm onSubmit={handleUpdatePassword} />
      </section>
    </main>
  );
}
