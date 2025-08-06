import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Mic, Video } from 'lucide-react';

interface PermissionManagerProps {
  onPermissionsGranted: () => void;
}

export function PermissionManager({ onPermissionsGranted }: PermissionManagerProps) {
  const [permissionStatus, setPermissionStatus] = useState<{
    microphone: PermissionState | null;
    camera: PermissionState | null;
  }>({
    microphone: null,
    camera: null
  });
  const [showPermissionDialog, setShowPermissionDialog] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      if ('permissions' in navigator) {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        setPermissionStatus({
          microphone: micPermission.state,
          camera: cameraPermission.state
        });

        if (micPermission.state === 'granted' && cameraPermission.state === 'granted') {
          onPermissionsGranted();
          setShowPermissionDialog(false);
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      setPermissionError(null);
      
      // Request microphone permission
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.getTracks().forEach(track => track.stop());
      
      // Request camera permission
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStream.getTracks().forEach(track => track.stop());
      
      // Check permissions again
      await checkPermissions();
      
    } catch (error) {
      console.error('Permission denied:', error);
      setPermissionError('Camera and microphone access are required to use this app. Please grant permissions and try again.');
    }
  };

  if (!showPermissionDialog && permissionStatus.microphone === 'granted' && permissionStatus.camera === 'granted') {
    return null;
  }

  return (
    <AlertDialog open={showPermissionDialog}>
      <AlertDialogContent className="mx-4 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            <Video className="h-5 w-5" />
            Permissions Required
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>This app requires access to your camera and microphone to function properly.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span className={`text-sm ${permissionStatus.microphone === 'granted' ? 'text-green-600' : 'text-muted-foreground'}`}>
                  Microphone: {permissionStatus.microphone || 'Not requested'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span className={`text-sm ${permissionStatus.camera === 'granted' ? 'text-green-600' : 'text-muted-foreground'}`}>
                  Camera: {permissionStatus.camera || 'Not requested'}
                </span>
              </div>
            </div>
            {permissionError && (
              <p className="text-destructive text-sm">{permissionError}</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={requestPermissions}>
            Grant Permissions
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}