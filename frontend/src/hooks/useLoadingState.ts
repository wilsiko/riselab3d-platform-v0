export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export const initialLoadingState: LoadingState = {
  isLoading: false,
  error: null,
  success: null,
};
