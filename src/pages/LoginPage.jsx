import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { getSafeReturnTo } from '../shared/lib/getSafeReturnTo.js';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      await login({ email: email.trim(), password });
      navigate(getSafeReturnTo(searchParams.get('returnTo')), { replace: true });
    } catch {
      setError('아이디 또는 비밀번호를 확인해주세요.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <a className="skip-link" href="#login-main">로그인 폼으로 건너뛰기</a>
      <header className="login-header">
        <nav className="login-header__inner" aria-label="주요 메뉴">
          <Link className="login-logo" to="/" aria-label="하비루프 홈">하비루프</Link>
        </nav>
      </header>
      <main id="login-main" className="login-main">
        <section className="login-section" aria-labelledby="login-title">
          <h1 id="login-title" className="login-title">로그인</h1>
          <form className={`login-form${isSubmitting ? ' is-loading' : ''}${error ? ' is-error' : ''}`} onSubmit={handleSubmit} noValidate>
            <div className="login-form__fields">
              <div className="form-field form-field--email">
                <label htmlFor="email">이메일</label>
                <input id="email" className="text-input login-input" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일을 입력하세요" autoComplete="email" required />
              </div>
              <div className="form-field form-field--password">
                <label htmlFor="password">비밀번호</label>
                <input id="password" className="text-input login-input" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호를 입력하세요" autoComplete="current-password" aria-describedby="login-error" required />
                {error && <p id="login-error" className="form-field__error form-field__error--login" role="alert">*{error}</p>}
              </div>
            </div>
            <button className="button button--primary login-button" type="submit" disabled={!email || !password || isSubmitting} aria-disabled={!email || !password || isSubmitting}>
              <span className="login-button__label">로그인</span>
              <span className="login-button__spinner" aria-hidden="true" />
            </button>
          </form>
          <Link className="signup-link" to="/signup">회원가입</Link>
        </section>
      </main>
    </div>
  );
}
