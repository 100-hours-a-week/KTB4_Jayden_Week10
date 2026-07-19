import {authFetch} from './auth.js';
import {API_BASE_URL} from '../constants/api.js';



export const fetchUserProfile = () => authFetch(
        `${API_BASE_URL}/users/me`,
    );

export const loginRequest = (email, password) => fetch(
        `${API_BASE_URL}/auth/login`, 
        {
            method : 'POST',
            credentials: "include",
            headers: { 'Content-Type': 'application/json' },
            body : JSON.stringify({email, password})
        }
    );
    
export const logoutRequest = () => authFetch(
        `${API_BASE_URL}/auth/logout`, 
        {
            method : 'POST',
        }
    );



export const signupRequest = (signupData) => fetch(
        `${API_BASE_URL}/users`,
        {
            method : 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({...signupData})
        }
    );

export const fetchUserRequest = () => authFetch(`${API_BASE_URL}/users/me`);

export const updateUserInfoRequest = (nickname, url) => authFetch(
    `${API_BASE_URL}/users/me`,
        {
            method : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( { nickname, profileImageUrl : url } )
        }
    );

export const updatePasswordRequest = (password) => authFetch(
    `${API_BASE_URL}/users/me/password`,
        {
            method : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( { password } )
        }
    );

export const deleteUserRequest = () => authFetch(
    `${API_BASE_URL}/users/me`,
        {
            method : 'DELETE'
        }
    );





export const uploadProfileImageRequest = (formData) => fetch(
        `${API_BASE_URL}/users/me/profile-image`,
        {
            method : 'POST', 
            body: formData
        }
    );

export const uploadContentImagesRequest = (formData) => authFetch(
    `${API_BASE_URL}/articles/content-image`,
        {
            method : 'POST', 
            body: formData
        }
    );



export const createArticleRequest = (articleData) => authFetch(
    `${API_BASE_URL}/articles`, 
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( { ...articleData } )
        }
    );

export const fetchArticleRequest = (articleId) => authFetch(
    `${API_BASE_URL}/articles/${articleId}`
);

export const fetchArticlesRequest = (pageSize, appendLastArticleId) => authFetch(
    `${API_BASE_URL}/articles?pageSize=${pageSize}${appendLastArticleId}`
);

export const deleteArticleRequest = (articleId) => authFetch(
    `${API_BASE_URL}/articles/${articleId}`, 
        {
            method: 'DELETE',
        }
    );

export const updateArticleRequest = (articleId, articleData) => authFetch(
    `${API_BASE_URL}/articles/${articleId}`, 
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({...articleData})
        }
    );




export const createCommentRequest  = (articleId, commentText, parentCommentId) => authFetch(
    `${API_BASE_URL}/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({commentText, parentCommentId})
    });

export const fetchCommentsRequest = (articleId, commentPageSize, lastCommentQuery, lastParentCommentQuery) => authFetch(
    `${API_BASE_URL}/articles/${articleId}/comments?pageSize=${commentPageSize}${lastCommentQuery}${lastParentCommentQuery}`
);

export const editCommentRequest = (articleId, commentId, nextCommentText) => authFetch(
    `${API_BASE_URL}/articles/${articleId}/comments/${commentId}`, 
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({commentText: nextCommentText})
        }
    );

export const deleteCommentRequest = (articleId, commentId) => authFetch(
    `${API_BASE_URL}/articles/${articleId}/comments/${commentId}`, 
        { method: 'DELETE' }
    );



export const likeRequest = (articleId) => authFetch(
    `${API_BASE_URL}/likes/articles/${articleId}`, 
        {
            method: 'POST'
        }
    );

export const unlikeRequest = (articleId) => authFetch(
    `${API_BASE_URL}/likes/articles/${articleId}`, 
        {
            method: 'DELETE'
        }
    );



export const incrementViewCountRequest = (articleId) => authFetch(
        `${API_BASE_URL}/views/articles/${articleId}`,
        {
            method : 'POST'
        }
    );
