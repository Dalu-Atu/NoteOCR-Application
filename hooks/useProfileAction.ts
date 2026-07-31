import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import {
  updateUserEmail,
  updateUserName,
  updateUserPassword,
} from "../services/profileService";

export function useProfileActions() {
  const { user, refreshUserData } = useAuth();

  const updateNameMutation = useMutation({
    mutationFn: (params: { newName: string; currentPassword: string }) => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }
      return updateUserName({ userId: user.id, ...params });
    },
    onSuccess: refreshUserData,
  });

  const updateEmailMutation = useMutation({
    mutationFn: (params: { newEmail: string; currentPassword: string }) => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }
      return updateUserEmail({ userId: user.id, ...params });
    },
    onSuccess: refreshUserData,
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (params: { currentPassword: string; newPassword: string }) => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }
      return updateUserPassword({ userId: user.id, ...params });
    },
  });

  return {
    updateName: updateNameMutation,
    updateEmail: updateEmailMutation,
    updatePassword: updatePasswordMutation,
  };
}
