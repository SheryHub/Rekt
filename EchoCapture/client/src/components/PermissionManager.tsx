import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Video } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PermissionManagerProps {
  onPermissionsGranted: () => void;
}

export function PermissionManager({ onPermissionsGranted }: PermissionManagerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState('Not requested');
  const [cameraStatus, setCameraStatus] = useState('Not requested');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });

      setMicrophoneStatus(micPermission.state);
      setCameraStatus(cameraPermission.state);

      if (micPermission.state === 'granted' && cameraPermission.state === 'granted') {
        onPermissionsGranted();
      } else {
        setIsVisible(true);
      }
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      setIsVisible(true);
    }
  };

  const requestPermissions = async () => {
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneStatus('granted');
      
      // Request camera access
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus('granted');

      toast({
        title: "Permissions granted",
        description: "Camera and microphone access has been granted",
      });

      setIsVisible(false);
      onPermissionsGranted();
    } catch (error) {
      toast({
        title: "Permission denied",
        description: "Please allow camera and microphone access to use this app",
        variant: "destructive"
      });

      setMicrophoneStatus('denied');
      setCameraStatus('denied');
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-2">
              <Mic className="h-6 w-6" />
              <Video className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-medium">Permissions Required</h2>
            <p className="text-sm text-muted-foreground">
              This app requires access to your camera and microphone to function properly.
            </p>
            
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-3">
                <Mic className="h-4 w-4" />
                <span className="text-sm">Microphone: {microphoneStatus}</span>
              </div>
              <div className="flex items-center gap-3">
                <Video className="h-4 w-4" />
                <span className="text-sm">Camera: {cameraStatus}</span>
              </div>
            </div>
            
            <Button className="w-full" onClick={requestPermissions}>
              Grant Permissions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
