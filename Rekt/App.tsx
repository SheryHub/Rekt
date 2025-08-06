import React, { useState, useEffect } from 'react';
import { DeviceRegistration } from './components/DeviceRegistration';
import { RecordingInterface } from './components/RecordingInterface';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if device is already registered
    const existingToken = localStorage.getItem('deviceToken');
    if (existingToken) {
      setDeviceToken(existingToken);
    }
  }, []);

  const handleRegistrationComplete = (token: string) => {
    setDeviceToken(token);
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md">
        {!deviceToken && (
          <DeviceRegistration onRegistrationComplete={handleRegistrationComplete} />
        )}
        
        {deviceToken && (
          <RecordingInterface deviceToken={deviceToken} />
        )}
      </div>
      
      <Toaster />
    </div>
  );
}