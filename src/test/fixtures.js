export function createUserFixture(overrides = {}) {
  return {
    userId: 1,
    email: 'hobby@example.com',
    nickname: '하비',
    profileImageUrl: '/profile.jpg',
    ...overrides,
  };
}

export function createArticleFixture(overrides = {}) {
  return {
    articleId: 12,
    userId: 31,
    title: '클라이밍 입문기',
    content: '첫 클라이밍 기록',
    imageUrls: [],
    nickname: '하비',
    profileImageUrl: '',
    createdAt: '2026-07-19T12:34:56',
    isUpdated: false,
    likeCount: 5,
    likedByMe: false,
    viewCount: 30,
    commentCount: 2,
    ...overrides,
  };
}

export function createCommentFixture(overrides = {}) {
  return {
    commentId: 1,
    userId: 1,
    parentCommentId: null,
    commentText: '댓글',
    nickname: '하비',
    profileImageUrl: '',
    createdAt: '2026-07-19T12:34:56',
    isDeleted: false,
    ...overrides,
  };
}
