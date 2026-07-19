const DEFAULT_MESSAGE = '요청을 처리하지 못했습니다. 다시 시도해주세요.';

const messages = {
  'auth.logout': '로그아웃하지 못했습니다. 다시 시도해주세요.',
  'article.create.403': '게시글을 작성할 권한이 없습니다.',
  'article.create.429': '1분 내 글 3개까지 작성할 수 있습니다. 잠시 후 다시 시도해주세요.',
  'article.create': '게시글을 저장하지 못했습니다. 입력 내용은 유지됩니다.',
  'article.update.403': '게시글을 수정할 권한이 없습니다.',
  'article.update.429': '1분 내 글 3개까지 작성할 수 있습니다. 잠시 후 다시 시도해주세요.',
  'article.update': '게시글을 저장하지 못했습니다. 입력 내용은 유지됩니다.',
  'article.delete.403': '이 게시글을 삭제할 권한이 없습니다.',
  'article.delete': '게시글을 삭제하지 못했습니다. 다시 시도해주세요.',
  'article.like': '좋아요를 변경하지 못했습니다. 다시 시도해주세요.',
  'comment.delete.403': '이 댓글을 삭제할 권한이 없습니다.',
  'comment.delete': '댓글을 삭제하지 못했습니다. 다시 시도해주세요.',
  'user.withdraw': '회원 탈퇴에 실패했습니다. 다시 시도해주세요.',
  'user.profile.403': '회원정보를 수정할 권한이 없습니다.',
  'user.profile': '회원정보를 수정하지 못했습니다. 입력 내용은 유지됩니다.',
  'user.password': '비밀번호를 수정하지 못했습니다. 입력 내용은 유지됩니다.',
  'user.signup': '회원가입에 실패했습니다. 입력 내용을 확인하고 다시 시도해주세요.',
};

export function getErrorMessage(error, operation) {
  return messages[`${operation}.${error?.status}`] ?? messages[operation] ?? DEFAULT_MESSAGE;
}
