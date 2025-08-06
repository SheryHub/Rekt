import React, { useState, useEffect } from 'react';
import { DeviceRegistration } from '@/components/DeviceRegistration';
import { PermissionManager } from '@/components/PermissionManager';
import { VoiceTraining } from '@/components/VoiceTraining';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { localStorage } from '@/lib/storage';

type AppState = 'registration' | 'permissions' | 'training' | 'ready';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('registration');
  const [deviceToken, setDeviceToken] = useState<string>('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await localStorage.init();
        
        // Check if device token exists
        const existingToken = await localStorage.getDeviceToken();
        if (existingToken) {
          setDeviceToken(existingToken.token);
          setAppState('permissions');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  const handleRegistrationComplete = (token: string) => {
    setDeviceToken(token);
    setAppState('permissions');
  };

  const handlePermissionsGranted = () => {
    setAppState('training');
  };

  const handleTrainingComplete = () => {
    setAppState('ready');
  };

  if (appState === 'registration') {
    return <DeviceRegistration onComplete={handleRegistrationComplete} />;
  }

  if (appState === 'permissions') {
    return <PermissionManager onPermissionsGranted={handlePermissionsGranted} />;
  }

  if (appState === 'training') {
    return (
      <VoiceTraining
        phrase="start recording"
        onComplete={handleTrainingComplete}
      />
    );
  }

  return <VoiceRecorder deviceToken={deviceToken} />;
}
