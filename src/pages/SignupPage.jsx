import { Link, useNavigate } from 'react-router-dom';
import { SignupForm } from '../features/user/components/SignupForm.jsx';
import { useSignup } from '../features/user/useSignup.js';

export function SignupPage() {
  const navigate = useNavigate();
  const signup = useSignup();

  async function handleSignup(userData, profileImageFile) {
    await signup(userData, profileImageFile);
    navigate('/login', { replace: true });
  }

  return (
    <div className="signup-page">
      <a className="skip-link" href="#signup-main">회원가입 폼으로 건너뛰기</a>
      <header className="signup-header">
        <nav className="signup-header__inner" aria-label="주요 메뉴">
          <Link className="back-link" to="/login" aria-label="로그인 페이지로 돌아가기"><span aria-hidden="true">‹</span></Link>
          <Link className="signup-logo" to="/" aria-label="하비루프 홈">하비루프</Link>
        </nav>
      </header>
      <main id="signup-main" className="signup-main">
        <section className="signup-section" aria-labelledby="signup-title">
          <h1 id="signup-title" className="signup-title">회원가입</h1>
          <SignupForm onSubmit={handleSignup} />
          <Link className="login-link" to="/login">로그인하러 가기</Link>
        </section>
      </main>
    </div>
  );
}
