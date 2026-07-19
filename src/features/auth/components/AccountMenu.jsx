import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../../shared/components/Avatar.jsx';
import { getErrorMessage } from '../../../shared/errors/errorMessages.js';
import { useAuth } from '../AuthContext.jsx';

export function AccountMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function closeOnOutsidePointer(event) {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setError('');
    try {
      await logout();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'auth.logout'));
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        ref={triggerRef}
        className="user-menu__trigger"
        type="button"
        aria-label="프로필 메뉴 열기"
        aria-expanded={isOpen}
        aria-controls="account-menu-list"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Avatar src={user?.profileImageUrl} name={user?.nickname} className="user-menu__avatar" />
      </button>
      <div id="account-menu-list" className="user-menu__list" hidden={!isOpen}>
        <Link to="/settings/profile" onClick={() => setIsOpen(false)}>회원정보수정</Link>
        <Link to="/settings/password" onClick={() => setIsOpen(false)}>비밀번호수정</Link>
        <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? '로그아웃 중…' : '로그아웃'}
        </button>
        {error && <p className="user-menu__error" role="alert">{error}</p>}
      </div>
    </div>
  );
}
