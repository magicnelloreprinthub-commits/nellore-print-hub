import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob, QuoteStatus, ServiceType } from "../backend";
import type {
  AdminMessage,
  Customer,
  Photo,
  PromoSettings,
  Quote,
  Review,
  SiteSettings,
} from "../backend.d";
import { useActor } from "./useActor";

export function useGetQuotes() {
  const { actor, isFetching } = useActor();
  return useQuery<Quote[]>({
    queryKey: ["quotes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getQuotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitQuote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      mobile,
      service,
      details,
      attachmentUrl,
    }: {
      name: string;
      mobile: string;
      service: ServiceType;
      details: string;
      attachmentUrl?: string | null;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.submitQuote(
        name,
        mobile,
        service,
        details,
        attachmentUrl ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useGetSiteSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor available");
      return actor.getSiteSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateSiteSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: SiteSettings) => {
      if (!actor) throw new Error("No actor available");
      return actor.updateSiteSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    },
  });
}

export function useUpdateQuoteStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: bigint;
      status: QuoteStatus;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.updateQuoteStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useGetPhotos() {
  const { actor, isFetching } = useActor();
  return useQuery<Photo[]>({
    queryKey: ["photos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPhotos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bytes,
      title,
      order,
      fileType = "gallery",
    }: {
      bytes: Uint8Array<ArrayBuffer>;
      title: string;
      order: bigint;
      fileType?: string;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("No actor available");
      const blob = ExternalBlob.fromBytes(bytes);
      return actor.addPhoto(blob, title, order, fileType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
      queryClient.invalidateQueries({ queryKey: ["allFiles"] });
    },
  });
}

export function useAddPhotoWithProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bytes,
      title,
      order,
      fileType = "gallery",
      onProgress,
    }: {
      bytes: Uint8Array<ArrayBuffer>;
      title: string;
      order: bigint;
      fileType?: string;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("No actor available");
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }
      return actor.addPhoto(blob, title, order, fileType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
      queryClient.invalidateQueries({ queryKey: ["allFiles"] });
    },
  });
}

// Uploads a file and returns the absolute direct URL from the blob
export function useUploadFileAndGetUrl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bytes,
      title,
      order,
      fileType = "document",
      onProgress,
    }: {
      bytes: Uint8Array<ArrayBuffer>;
      title: string;
      order: bigint;
      fileType?: string;
      onProgress?: (pct: number) => void;
    }): Promise<{ id: bigint; directUrl: string }> => {
      if (!actor) throw new Error("No actor available");
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }
      const photoId = await actor.addPhoto(blob, title, order, fileType);
      // Fetch all files to find the newly uploaded one and get its direct URL
      const allFiles = await actor.getAllFiles();
      const found = allFiles.find((p) => p.id === photoId);
      if (!found) throw new Error("Uploaded file not found");
      return { id: photoId, directUrl: found.blob.getDirectURL() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
      queryClient.invalidateQueries({ queryKey: ["allFiles"] });
    },
  });
}

export function useGetAllFiles() {
  const { actor, isFetching } = useActor();
  return useQuery<Photo[]>({
    queryKey: ["allFiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateQuoteStatusWithReason() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: bigint;
      status: QuoteStatus;
      reason: string;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.updateQuoteStatusWithReason(id, status, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useDeletePhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor available");
      return actor.deletePhoto(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });
}

export function useUpdatePhotoTitle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newTitle }: { id: bigint; newTitle: string }) => {
      if (!actor) throw new Error("No actor available");
      return actor.updatePhotoTitle(id, newTitle);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });
}

export function useGetReviews() {
  const { actor, isFetching } = useActor();
  return useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReviews();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      rating,
      message,
    }: {
      name: string;
      rating: bigint;
      message: string;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.submitReview(name, rating, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useDeleteReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor available");
      return actor.deleteReview(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useGetCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCustomerByMobile(mobile: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Customer>({
    queryKey: ["customer", mobile],
    queryFn: async () => {
      if (!actor) throw new Error("No actor available");
      return actor.getCustomerByMobile(mobile);
    },
    enabled: !!actor && !isFetching && !!mobile,
  });
}

export function useRegisterOrLoginCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      mobile,
    }: {
      name: string;
      mobile: string;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.registerOrLoginCustomer(name, mobile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useGetPromoSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<PromoSettings>({
    queryKey: ["promoSettings"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor available");
      return actor.getPromoSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdatePromoSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: PromoSettings) => {
      if (!actor) throw new Error("No actor available");
      return actor.updatePromoSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoSettings"] });
    },
  });
}

export function useGetMessagesForCustomer(mobile: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AdminMessage[]>({
    queryKey: ["messages", mobile],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessagesForCustomer(mobile);
    },
    enabled: !!actor && !isFetching && !!mobile,
  });
}

export function useMarkMessageRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor available");
      return actor.markMessageRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useSendMessageToCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      toMobile,
      toName,
      subject,
      body,
    }: {
      toMobile: string;
      toName: string;
      subject: string;
      body: string;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.sendMessageToCustomer(toMobile, toName, subject, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMessages"] });
    },
  });
}

export function useGetAllAdminMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<AdminMessage[]>({
    queryKey: ["adminMessages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAdminMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteAdminMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor available");
      return actor.deleteAdminMessage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMessages"] });
    },
  });
}

export { ExternalBlob, QuoteStatus, ServiceType };
export type {
  AdminMessage,
  Customer,
  Photo,
  PromoSettings,
  Quote,
  Review,
  SiteSettings,
};
