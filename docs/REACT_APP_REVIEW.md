# React 애플리케이션 코드 리뷰

## 1. 리뷰 개요

- 리뷰 대상: Vite/React 기반 구성과 인증 마이그레이션 변경분
- 기준 문서:
  - [`REACT_MIGRATION_PLAN.md`](./REACT_MIGRATION_PLAN.md)
  - [`API_SPEC.md`](./API_SPEC.md)
  - [`tasks/auth-migration.md`](./tasks/auth-migration.md)
- 검증 결과:
  - `npm run lint` 통과
  - `npm test` 통과: 6개 테스트 파일, 29개 테스트
  - `npm run build` 통과

현재 구현은 Vite 기반 React SPA, 메모리 access token, single-flight refresh, 보호 API의 401 재시도, 인증 Context와 route guard를 구성했다. 전반적인 책임 분리는 명확하지만, refresh 오류와 bootstrap 사용자 조회에서 API 계약과 다른 인증 상태 전이가 발생할 수 있다.

> 반영 상태: 2026-07-19 기준 P1과 P2 수정 및 회귀 테스트 추가 완료

---

## 2. 리뷰 발견 사항

### [P1][해결 완료] refresh 네트워크·5xx 오류에서 인증 정보가 제거됨

대상: `src/shared/api/httpClient.js:91`

#### 문제

보호 요청의 401 이후 `refreshHandler()`가 실패하면 오류 종류와 관계없이 access token을 제거하고 `unauthorizedHandler`를 호출한다.

```js
try {
  await refreshHandler();
} catch (error) {
  clearAccessToken();
  unauthorizedHandler?.();
  throw error;
}
```

이 로직에서는 refresh 응답이 401인 경우뿐 아니라 다음 상황에서도 사용자가 anonymous로 전환된다.

- 일시적인 네트워크 단절
- refresh 서버의 5xx 응답
- 응답 파싱 또는 서버 계약 오류

`API_SPEC.md`는 refresh network/5xx에서 인증 상태를 임의로 anonymous로 판단하지 않도록 규정한다. 또한 로그아웃 요청이 이 경로를 사용하면 로그아웃 실패 시 authenticated 상태를 유지해야 한다는 계약도 위반할 수 있다.

#### 영향

- 일시적인 서버 장애가 사용자 강제 로그아웃으로 이어진다.
- 현재 화면과 입력 중인 데이터가 로그인 redirect로 유실될 수 있다.
- 로그아웃 실패 UI를 표시하기 전에 route guard가 로그인 화면으로 이동할 수 있다.

#### 권장 해결 방안

refresh 실패 원인을 구분해 401에서만 인증 정보를 제거한다.

```js
try {
  await refreshHandler();
} catch (error) {
  if (error instanceof ApiError && error.status === 401) {
    clearAccessToken();
    unauthorizedHandler?.();
  }
  throw error;
}
```

네트워크 오류와 5xx는 기존 access token과 AuthContext 상태를 유지한 채 호출자에게 전달한다. 각 페이지는 요청 오류 UI와 재시도를 제공해야 한다.

로그아웃처럼 실패 시 반드시 인증 상태를 유지해야 하는 요청에는 요청별 인증 만료 정책을 명시할 수도 있다.

```js
request('/auth/logout', {
  method: 'POST',
  notifyUnauthorized: false,
});
```

다만 요청마다 예외를 늘리기보다, refresh 오류의 status를 올바르게 구분하는 공통 client 수정이 우선이다.

#### 필수 테스트

1. 보호 요청 401 → refresh 401 → token 제거와 unauthorized handler 호출
2. 보호 요청 401 → refresh network error → token과 authenticated 상태 유지
3. 보호 요청 401 → refresh 500 → token과 authenticated 상태 유지
4. logout 500 또는 network error → 현재 화면과 authenticated 상태 유지
5. refresh 성공 → 원 요청 재시도 401 → token 제거와 unauthorized handler 1회 호출

---

### [P2][해결 완료] bootstrap 사용자 조회에서 refresh가 중복 실행됨

대상: `src/features/user/userService.js:4`, `src/features/auth/AuthContext.jsx:37`

#### 문제

앱 bootstrap은 먼저 access token을 refresh한 뒤 `/users/me`를 조회한다. 그러나 `getCurrentUser()`가 일반 보호 요청의 기본 설정을 사용하므로 `/users/me`의 401에서 refresh를 다시 실행한다.

```js
export async function getCurrentUser({ signal } = {}) {
  const response = await request('/users/me', { signal });
  return response?.data ?? null;
}
```

인증 작업 문서는 초기 refresh 성공 후 사용자 조회가 401이면 곧바로 anonymous로 전환하도록 규정한다. 현재 구현은 불필요한 두 번째 refresh를 수행하며, 두 번째 시도에서 `/users/me`가 성공하면 첫 사용자 조회의 401을 무시하고 authenticated로 전환한다.

#### 영향

- 앱 시작 시 refresh 요청이 중복될 수 있다.
- 서버의 refresh token rotation 정책에 따라 cookie/token 상태가 예상과 달라질 수 있다.
- bootstrap 인증 상태 전이가 문서 계약과 달라진다.

#### 권장 해결 방안

`getCurrentUser`가 요청 옵션을 전달받도록 확장한다.

```js
export async function getCurrentUser({ signal, retryOn401 = true } = {}) {
  const response = await request('/users/me', { signal, retryOn401 });
  return response?.data ?? null;
}
```

bootstrap에서는 이미 refresh를 완료했으므로 자동 refresh를 끈다.

```js
await refreshAccessToken();
const currentUser = await getCurrentUser({ retryOn401: false });
```

일반 화면의 사용자 재조회나 로그인 직후 조회는 정책에 따라 기본값을 유지할 수 있다. 로그인 직후에도 access token을 새로 받은 상태이므로 일관성을 위해 `retryOn401: false`를 적용하고, 401이면 로그인 상태를 초기화하는 방안이 권장된다.

#### 필수 테스트

1. bootstrap refresh 성공 → `/users/me` 401 → 추가 refresh 없이 anonymous 전환
2. bootstrap refresh 성공 → `/users/me` 500 → token 유지, checking 오류 fallback 표시
3. bootstrap refresh 성공 → `/users/me` network error → 한 번 재시도 후 retry fallback 표시
4. bootstrap 성공 → refresh 1회와 사용자 조회 1회만 호출

---

## 3. 테스트 보강 제안

현재 테스트는 token store, single-flight refresh, 기본 HTTP 오류, 401 재시도, 일부 AuthContext 상태와 route redirect를 검증한다. 다음 계약은 아직 자동 테스트로 보호되지 않는다.

### API client

- JSON 성공 응답과 JSON 오류의 `message`, `code`, `data` 보존
- `FormData` 요청에 JSON `Content-Type`을 추가하지 않는지 확인
- `AbortError`가 `ApiError`로 변환되지 않는지 확인
- 동시에 여러 보호 요청이 401일 때 실제 refresh 요청이 하나인지 확인

### 인증 Context

- 로그인 성공, 401/404, network/5xx 상태 전이
- 로그인 성공과 4xx/network 오류의 화면 상태 전이
- logout 성공과 직접적인 network 오류의 상태 전이
- provider unmount 이후 state 변경 방지

### Router 통합

- checking 상태에서 공개·보호 route 모두 redirect하지 않음
- anonymous 사용자가 `/login`, `/signup`에 그대로 머무름
- authenticated 사용자가 보호 route를 렌더링함
- 보호 deep link → 로그인 → 원래 pathname/search/hash 복귀
- 외부 또는 잘못된 `returnTo`가 `/posts`로 대체됨

---

## 4. 반영 결과와 후속 순서

1. [x] `httpClient`에서 refresh 오류의 status를 구분한다.
2. [x] refresh 401, network error, 5xx 테스트를 추가한다.
3. [x] `getCurrentUser`가 `retryOn401` 옵션을 받도록 확장한다.
4. [x] bootstrap과 로그인 직후 사용자 조회에서 자동 refresh를 비활성화한다.
5. [x] AuthContext의 bootstrap 사용자 조회 실패 테스트를 보강한다.
6. [x] logout 중 refresh 5xx와 로그인 후 사용자 조회 401 테스트를 추가한다.
7. [ ] 보호 deep link 로그인 후 `returnTo` 통합 테스트를 추가한다.
8. [x] `npm run lint`, `npm test`, `npm run build`를 다시 실행한다.

---

## 5. 전체 평가

React SPA 기반과 인증 모듈의 구조는 후속 페이지 마이그레이션을 진행할 수 있는 수준으로 구성되어 있다. 특히 메모리 token store, 순환 의존성을 피한 handler 등록 방식, refresh single-flight, route guard와 내부 `returnTo` 검증은 적절하다.

refresh 오류가 곧 인증 만료를 의미하지 않는다는 구분을 공통 client에 적용했고, bootstrap과 로그인 직후 사용자 조회의 중복 refresh도 제거했다. 인증 기반 단계의 주요 상태 전이는 문서 계약과 일치하며, 남은 작업은 전체 로그인 `returnTo` 흐름과 부가적인 API client 경계 사례를 통합 테스트로 보강하는 것이다.
