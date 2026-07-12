import { getAccessToken, authFetch } from './auth.js';

const profileImage = document.querySelector('[data-profile-image]');
const profileButton = document.querySelector('[data-account-menu-trigger]');
const userMenuList = document.getElementById('account-menu-list');

const DEFAULT_PROFILE_IMAGE = "../../assets/images/default-profile.svg"


async function loadUserProfile() {
    if (!profileImage) return;

    const response = await authFetch('http://localhost:8080/users/me',
        {
            method: 'GET'
        }
    );

    if (!response.ok) throw new Error('사용자 정보 조회 실패');

    const responseBody = await response.json();
    const profileUrl = responseBody.data.profileImageUrl;

    profileImage.src = profileUrl;
    profileImage.alt = `${responseBody.data.nickname}님의 프로필 이미지`
}


profileButton.addEventListener('click', () => {
    userMenuList.hidden = !userMenuList.hidden;
});

loadUserProfile();