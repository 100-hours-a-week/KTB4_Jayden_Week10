import { expect, test } from '@playwright/test';

function fulfillJson(route, payload, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

async function mockAuthenticatedUser(page, user = {
  userId: 1,
  email: 'hobby@example.com',
  nickname: '하비',
  profileImageUrl: null,
}) {
  await page.route('**/auth/token/refresh', (route) => fulfillJson(route, { data: { accessToken: 'e2e-token' } }));
  await page.route('**/users/me', (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return fulfillJson(route, { data: user });
  });
}

test('미인증 상세 deep link는 로그인 후 원래 URL로 복귀한다', async ({ page }) => {
  await page.route('**/auth/token/refresh', (route) => fulfillJson(route, { message: 'unauthorized' }, 401));
  await page.route('**/auth/login', (route) => fulfillJson(route, { data: { token: { accessToken: 'login-token' } } }));
  await page.route('**/users/me', (route) => fulfillJson(route, {
    data: { userId: 1, email: 'hobby@example.com', nickname: '하비', profileImageUrl: null },
  }));
  await page.route('**/articles/12', (route) => fulfillJson(route, {
    data: {
      articleId: 12,
      userId: 2,
      title: '클라이밍 입문기',
      content: '첫 기록',
      contentImageUrls: [],
      nickname: '작성자',
      profileImageUrl: null,
      likedByMe: false,
      createdAt: '2026-07-19T12:00:00',
      updatedAt: null,
      articleLikeCount: 0,
      articleViewCount: 1,
      commentCount: 0,
    },
  }));
  await page.route('**/articles/12/comments?*', (route) => fulfillJson(route, { data: [] }));
  await page.route('**/views/articles/12', (route) => route.fulfill({ status: 204 }));

  await page.goto('/posts/12?tab=comments#reply');
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await page.getByLabel('이메일').fill('hobby@example.com');
  await page.getByLabel('비밀번호').fill('Valid1!x');
  await page.getByRole('button', { name: '로그인' }).click();

  await expect(page).toHaveURL(/\/posts\/12\?tab=comments#reply$/);
  await expect(page.getByRole('heading', { name: '클라이밍 입문기' })).toBeVisible();
});

test('좋아요를 갱신하고 같은 닉네임의 다른 사용자에게 작성자 action을 노출하지 않는다', async ({ page }) => {
  await mockAuthenticatedUser(page, {
    userId: 1,
    email: 'hobby@example.com',
    nickname: '같은 닉네임',
    profileImageUrl: null,
  });
  await page.route('**/articles/12', (route) => fulfillJson(route, {
    data: {
      articleId: 12,
      userId: 2,
      title: '소유권 테스트',
      content: '',
      contentImageUrls: [],
      nickname: '같은 닉네임',
      profileImageUrl: null,
      likedByMe: false,
      createdAt: '2026-07-19T12:00:00',
      updatedAt: null,
      articleLikeCount: 3,
      articleViewCount: 10,
      commentCount: 0,
    },
  }));
  await page.route('**/articles/12/comments?*', (route) => fulfillJson(route, { data: [] }));
  await page.route('**/views/articles/12', (route) => route.fulfill({ status: 204 }));
  let likeRequests = 0;
  await page.route('**/likes/articles/12', (route) => {
    likeRequests += 1;
    return fulfillJson(route, { data: null });
  });

  await page.goto('/posts/12');
  await expect(page.getByRole('heading', { name: '소유권 테스트' })).toBeVisible();
  await expect(page.getByRole('link', { name: '수정' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '삭제' })).toHaveCount(0);
  await page.getByRole('button', { name: '좋아요 추가' }).click();

  await expect(page.getByRole('button', { name: '좋아요 취소' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '좋아요 취소' }).locator('strong')).toHaveText('4');
  expect(likeRequests).toBe(1);
});

test('비밀번호 변경 성공 후 인증을 해제하고 로그인으로 이동한다', async ({ page }) => {
  await mockAuthenticatedUser(page);
  await page.route('**/users/me/password', (route) => fulfillJson(route, { data: null }));

  await page.goto('/settings/password');
  await page.getByLabel('비밀번호', { exact: true }).fill('Valid1!x');
  await page.getByLabel('비밀번호 확인').fill('Valid1!x');
  await page.getByRole('button', { name: '수정하기' }).click();

  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('status')).toHaveText('비밀번호가 수정되었습니다.');
});
