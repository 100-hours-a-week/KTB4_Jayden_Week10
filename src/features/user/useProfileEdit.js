import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { uploadProfileImage } from '../images/imageService.js';
import { deleteCurrentUser, updateCurrentUser } from './userService.js';

export function useProfileEdit() {
  const { user, refreshUser, applyCurrentUser, markAnonymous } = useAuth();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const withdrawingRef = useRef(false);
  const uploadedImageRef = useRef({ file: null, url: null });

  const updateProfile = useCallback(async (profile, profileImageFile) => {
    let profileImageUrl = user.profileImageUrl || null;
    if (profileImageFile) {
      if (uploadedImageRef.current.file === profileImageFile) {
        profileImageUrl = uploadedImageRef.current.url;
      } else {
        profileImageUrl = await uploadProfileImage(profileImageFile);
        uploadedImageRef.current = { file: profileImageFile, url: profileImageUrl };
      }
    }

    const updatedUser = await updateCurrentUser({ ...profile, profileImageUrl });
    try {
      await refreshUser();
    } catch (error) {
      if (!updatedUser) throw error;
      applyCurrentUser(updatedUser);
    }
  }, [applyCurrentUser, refreshUser, user.profileImageUrl]);

  const withdraw = useCallback(async () => {
    if (withdrawingRef.current) return false;
    withdrawingRef.current = true;
    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      await deleteCurrentUser();
      markAnonymous({ suppressReturnTo: true });
      return true;
    } catch (error) {
      setWithdrawError(error);
      return false;
    } finally {
      withdrawingRef.current = false;
      setIsWithdrawing(false);
    }
  }, [markAnonymous]);

  return { user, updateProfile, withdraw, isWithdrawing, withdrawError };
}
