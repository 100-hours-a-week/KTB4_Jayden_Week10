import { Link } from 'react-router-dom';

export function SignupPage() {
  return (
    <main className="placeholder-page">
      <h1>회원가입</h1>
      <p>회원가입 화면은 다음 마이그레이션 단계에서 연결됩니다.</p>
      <Link to="/login">로그인하러 가기</Link>
    </main>
  );
}
