import { useState, useEffect, useCallback, useRef } from "react";
import ApiClient, { ApiClientError } from "@/lib/api-client";
import type {
  Note,
  CreateNoteInput,
  UpdateNoteInput,
  Receipt,
  CreateReceiptInput,
  Attachment,
  ChatRequest,
  ChatResponse,
  NoteQueryParams,
  ReceiptQueryParams,
  UploadProgress,
  PaginatedResponse,
} from "@/types/api";

// Generic API Hook State
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

// ==================== useNotes Hook ====================

export function useNotes(params?: NoteQueryParams, options: UseApiOptions = {}) {
  const { immediate = true, onSuccess, onError } = options;
  const [state, setState] = useState<UseApiState<PaginatedResponse<Note>>>({
    data: null,
    loading: false,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchNotes = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await ApiClient.getNotes(params);
      setState({ data, loading: false, error: null });
      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error as Error;
      setState({ data: null, loading: false, error: err });
      onError?.(err);
      throw err;
    }
  }, [params, onSuccess, onError]);

  const createNote = useCallback(
    async (input: CreateNoteInput) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const note = await ApiClient.createNote(input);
        // Refresh list after creation
        await fetchNotes();
        return note;
      } catch (error) {
        const err = error as Error;
        setState((prev) => ({ ...prev, loading: false, error: err }));
        throw err;
      }
    },
    [fetchNotes]
  );

  const updateNote = useCallback(
    async (noteId: string, input: UpdateNoteInput) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const note = await ApiClient.updateNote(noteId, input);
        // Refresh list after update
        await fetchNotes();
        return note;
      } catch (error) {
        const err = error as Error;
        setState((prev) => ({ ...prev, loading: false, error: err }));
        throw err;
      }
    },
    [fetchNotes]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await ApiClient.deleteNote(noteId);
        // Refresh list after deletion
        await fetchNotes();
      } catch (error) {
        const err = error as Error;
        setState((prev) => ({ ...prev, loading: false, error: err }));
        throw err;
      }
    },
    [fetchNotes]
  );

  useEffect(() => {
    if (immediate) {
      fetchNotes();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, fetchNotes]);

  return {
    ...state,
    refetch: fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}

// ==================== useNote Hook (Single Note) ====================

export function useNote(noteId: string | null, options: UseApiOptions = {}) {
  const { immediate = true, onSuccess, onError } = options;
  const [state, setState] = useState<UseApiState<Note>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchNote = useCallback(async () => {
    if (!noteId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await ApiClient.getNote(noteId);
      setState({ data, loading: false, error: null });
      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error as Error;
      setState({ data: null, loading: false, error: err });
      onError?.(err);
      throw err;
    }
  }, [noteId, onSuccess, onError]);

  useEffect(() => {
    if (immediate && noteId) {
      fetchNote();
    }
  }, [immediate, noteId, fetchNote]);

  return {
    ...state,
    refetch: fetchNote,
  };
}

// ==================== useReceipts Hook ====================

export function useReceipts(params?: ReceiptQueryParams, options: UseApiOptions = {}) {
  const { immediate = true, onSuccess, onError } = options;
  const [state, setState] = useState<UseApiState<PaginatedResponse<Receipt>>>({
    data: null,
    loading: false,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchReceipts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await ApiClient.getReceipts(params);
      setState({ data, loading: false, error: null });
      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error as Error;
      setState({ data: null, loading: false, error: err });
      onError?.(err);
      throw err;
    }
  }, [params, onSuccess, onError]);

  const deleteReceipt = useCallback(
    async (receiptId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await ApiClient.deleteReceipt(receiptId);
        await fetchReceipts();
      } catch (error) {
        const err = error as Error;
        setState((prev) => ({ ...prev, loading: false, error: err }));
        throw err;
      }
    },
    [fetchReceipts]
  );

  useEffect(() => {
    if (immediate) {
      fetchReceipts();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, fetchReceipts]);

  return {
    ...state,
    refetch: fetchReceipts,
    deleteReceipt,
  };
}

// ==================== useFileUpload Hook ====================

interface UseFileUploadOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: UploadProgress) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { onSuccess, onError, onProgress } = options;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [error, setError] = useState<Error | null>(null);

  const uploadReceipt = useCallback(
    async (file: File, metadata?: CreateReceiptInput) => {
      setUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: 0, percentage: 0 });

      try {
        const receipt = await ApiClient.uploadReceipt(
          file,
          metadata,
          (prog) => {
            setProgress(prog);
            onProgress?.(prog);
          }
        );
        setUploading(false);
        onSuccess?.(receipt);
        return receipt;
      } catch (error) {
        const err = error as Error;
        setUploading(false);
        setError(err);
        onError?.(err);
        throw err;
      }
    },
    [onSuccess, onError, onProgress]
  );

  const uploadAttachment = useCallback(
    async (noteId: string, file: File) => {
      setUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: 0, percentage: 0 });

      try {
        const attachment = await ApiClient.uploadAttachment(
          noteId,
          file,
          (prog) => {
            setProgress(prog);
            onProgress?.(prog);
          }
        );
        setUploading(false);
        onSuccess?.(attachment);
        return attachment;
      } catch (error) {
        const err = error as Error;
        setUploading(false);
        setError(err);
        onError?.(err);
        throw err;
      }
    },
    [onSuccess, onError, onProgress]
  );

  const uploadFile = useCallback(
    async (
      bucket: "uploads" | "avatars" | "exports" | "backups",
      file: File
    ) => {
      setUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: 0, percentage: 0 });

      try {
        const result = await ApiClient.uploadFile(bucket, file, (prog) => {
          setProgress(prog);
          onProgress?.(prog);
        });
        setUploading(false);
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error as Error;
        setUploading(false);
        setError(err);
        onError?.(err);
        throw err;
      }
    },
    [onSuccess, onError, onProgress]
  );

  const reset = useCallback(() => {
    setUploading(false);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setError(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadReceipt,
    uploadAttachment,
    uploadFile,
    reset,
  };
}

// ==================== useAI Hook ====================

interface UseAIOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useAI(options: UseAIOptions = {}) {
  const { onChunk, onComplete, onError } = options;
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<string>("");

  const chat = useCallback(
    async (request: ChatRequest) => {
      setLoading(true);
      setError(null);
      setResponse("");

      try {
        const data = await ApiClient.chat(request);
        setResponse(data.message);
        setLoading(false);
        return data;
      } catch (error) {
        const err = error as Error;
        setError(err);
        setLoading(false);
        onError?.(err);
        throw err;
      }
    },
    [onError]
  );

  const chatStream = useCallback(
    async (request: ChatRequest) => {
      setStreaming(true);
      setError(null);
      setResponse("");

      try {
        await ApiClient.chatStream(
          request,
          (chunk) => {
            setResponse((prev) => prev + chunk);
            onChunk?.(chunk);
          },
          () => {
            setStreaming(false);
            onComplete?.();
          },
          (err) => {
            setStreaming(false);
            setError(err);
            onError?.(err);
          }
        );
      } catch (error) {
        const err = error as Error;
        setStreaming(false);
        setError(err);
        onError?.(err);
        throw err;
      }
    },
    [onChunk, onComplete, onError]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setStreaming(false);
    setError(null);
    setResponse("");
  }, []);

  return {
    loading,
    streaming,
    error,
    response,
    chat,
    chatStream,
    reset,
  };
}

// ==================== useAttachments Hook ====================

export function useAttachments(noteId: string | null, options: UseApiOptions = {}) {
  const { immediate = true, onSuccess, onError } = options;
  const [state, setState] = useState<UseApiState<Attachment[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchAttachments = useCallback(async () => {
    if (!noteId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await ApiClient.getAttachments(noteId);
      setState({ data, loading: false, error: null });
      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error as Error;
      setState({ data: null, loading: false, error: err });
      onError?.(err);
      throw err;
    }
  }, [noteId, onSuccess, onError]);

  const deleteAttachment = useCallback(
    async (attachmentId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await ApiClient.deleteAttachment(attachmentId);
        await fetchAttachments();
      } catch (error) {
        const err = error as Error;
        setState((prev) => ({ ...prev, loading: false, error: err }));
        throw err;
      }
    },
    [fetchAttachments]
  );

  useEffect(() => {
    if (immediate && noteId) {
      fetchAttachments();
    }
  }, [immediate, noteId, fetchAttachments]);

  return {
    ...state,
    refetch: fetchAttachments,
    deleteAttachment,
  };
}

// ==================== useApiHealth Hook ====================

export function useApiHealth() {
  const [healthy, setHealthy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    setError(null);

    try {
      const data = await ApiClient.getHealth();
      setHealthy(data.status === "healthy");
      setChecking(false);
      return data;
    } catch (error) {
      const err = error as Error;
      setHealthy(false);
      setError(err);
      setChecking(false);
      throw err;
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    healthy,
    checking,
    error,
    checkHealth,
  };
}
