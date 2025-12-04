import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import axios from "axios";
import type {
  CustomEmailDraft,
  User,
  CreateCustomEmailRequest,
  UpdateCustomEmailRequest,
  SendEmailRequest,
  SendEmailResponse,
} from "@/lib/types/custom-email";

const API_BASE = "/api/admin/custom-emails";

// Fetcher for useSWR
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

// Get all email drafts
export function useCustomEmailDrafts() {
  const { data, error, isLoading, mutate } = useSWR<CustomEmailDraft[]>(
    API_BASE,
    fetcher
  );

  return {
    drafts: data,
    isLoading,
    error,
    mutate,
  };
}

// Get single email draft
export function useCustomEmailDraft(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<CustomEmailDraft>(
    id ? `${API_BASE}/${id}` : null,
    fetcher
  );

  return {
    draft: data,
    isLoading,
    error,
    mutate,
  };
}

// Get all users
export function useUsers() {
  const { data, error, isLoading } = useSWR<User[]>("/api/admin/users", fetcher);

  return {
    users: data,
    isLoading,
    error,
  };
}

// Create email draft mutation
export function useCreateCustomEmail() {
  const { trigger, isMutating, error } = useSWRMutation(
    API_BASE,
    async (url: string, { arg }: { arg: CreateCustomEmailRequest }) => {
      const response = await axios.post<CustomEmailDraft>(url, arg);
      return response.data;
    }
  );

  return {
    createDraft: trigger,
    isCreating: isMutating,
    error,
  };
}

// Update email draft mutation
export function useUpdateCustomEmail() {
  const { trigger, isMutating, error } = useSWRMutation(
    API_BASE,
    async (
      url: string,
      { arg }: { arg: UpdateCustomEmailRequest }
    ) => {
      const response = await axios.put<CustomEmailDraft>(`${url}/${arg.id}`, arg);
      return response.data;
    }
  );

  return {
    updateDraft: trigger,
    isUpdating: isMutating,
    error,
  };
}

// Delete email draft mutation
export function useDeleteCustomEmail() {
  const { trigger, isMutating, error } = useSWRMutation(
    API_BASE,
    async (url: string, { arg }: { arg: number }) => {
      await axios.delete(`${url}/${arg}`);
      return arg;
    }
  );

  return {
    deleteDraft: trigger,
    isDeleting: isMutating,
    error,
  };
}

// Send email mutation
export function useSendCustomEmail(draftId: number | null) {
  const { trigger, isMutating, error } = useSWRMutation(
    draftId ? `${API_BASE}/${draftId}/send` : null,
    async (url: string, { arg }: { arg: SendEmailRequest }) => {
      const response = await axios.post<SendEmailResponse>(url, arg);
      return response.data;
    }
  );

  return {
    sendEmail: trigger,
    isSending: isMutating,
    error,
  };
}
