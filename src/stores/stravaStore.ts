import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StravaTokens } from '../services/stravaService';
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  uploadToStrava,
  checkUploadStatus,
} from '../services/stravaService';
import { generateTCX } from '../services/tcxExport';
import type { WorkoutRecord } from '../types/workout';

interface StravaState {
  // Connection state
  isConnected: boolean;
  tokens: StravaTokens | null;
  athleteName: string;

  // Upload state
  isUploading: boolean;
  uploadError: string | null;
  lastUploadId: number | null;

  // Actions
  handleAuthCallback: (code: string) => Promise<void>;
  disconnect: () => void;
  uploadWorkout: (workout: WorkoutRecord) => Promise<{ success: boolean; activityId?: number; error?: string }>;
  getValidAccessToken: () => Promise<string | null>;
}

export const useStravaStore = create<StravaState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      tokens: null,
      athleteName: '',
      isUploading: false,
      uploadError: null,
      lastUploadId: null,

      handleAuthCallback: async (code: string) => {
        try {
          const tokens = await exchangeCodeForTokens(code);
          set({
            isConnected: true,
            tokens,
            athleteName: tokens.athleteName,
          });
        } catch (error) {
          console.error('Failed to exchange code for tokens:', error);
          throw error;
        }
      },

      disconnect: () => {
        set({
          isConnected: false,
          tokens: null,
          athleteName: '',
        });
      },

      getValidAccessToken: async () => {
        const { tokens } = get();
        if (!tokens) return null;

        // Check if token is expired (with 5 min buffer)
        const now = Math.floor(Date.now() / 1000);
        if (tokens.expiresAt <= now + 300) {
          try {
            const newTokens = await refreshAccessToken(tokens.refreshToken);
            set({
              tokens: {
                ...newTokens,
                athleteId: tokens.athleteId,
                athleteName: tokens.athleteName,
              },
            });
            return newTokens.accessToken;
          } catch (error) {
            console.error('Failed to refresh token:', error);
            set({ isConnected: false, tokens: null });
            return null;
          }
        }

        return tokens.accessToken;
      },

      uploadWorkout: async (workout: WorkoutRecord) => {
        set({ isUploading: true, uploadError: null });

        try {
          const accessToken = await get().getValidAccessToken();
          if (!accessToken) {
            throw new Error('Not connected to Strava');
          }

          // Generate TCX file
          const tcxData = generateTCX(workout);

          // Upload to Strava
          const uploadResponse = await uploadToStrava(
            accessToken,
            tcxData,
            workout.name,
            `Avg Power: ${Math.round(workout.summary.avgPower)}W | Duration: ${Math.round(workout.summary.duration / 60)} min`
          );

          set({ lastUploadId: uploadResponse.id });

          // Poll for upload completion (Strava processes async)
          let attempts = 0;
          const maxAttempts = 10;

          while (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const status = await checkUploadStatus(accessToken, uploadResponse.id);

            if (status.activity_id) {
              set({ isUploading: false });
              return { success: true, activityId: status.activity_id };
            }

            if (status.error) {
              throw new Error(status.error);
            }

            attempts++;
          }

          // If we get here, upload is still processing
          set({ isUploading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          set({ isUploading: false, uploadError: errorMessage });
          return { success: false, error: errorMessage };
        }
      },
    }),
    {
      name: 'swift-strava-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        tokens: state.tokens,
        athleteName: state.athleteName,
      }),
    }
  )
);
