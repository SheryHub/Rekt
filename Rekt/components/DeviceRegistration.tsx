import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Copy, Check, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface DeviceRegistrationProps {
  onRegistrationComplete: (token: string) => void;
}

export function DeviceRegistration({ onRegistrationComplete }: DeviceRegistrationProps) {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkExistingRegistration();
  }, []);

  const checkExistingRegistration = () => {
    const existingToken = localStorage.getItem('deviceToken');
    if (existingToken) {
      onRegistrationComplete(existingToken);
    } else {
      registerDevice();
    }
  };

  const generateDeviceToken = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const deviceInfo = navigator.userAgent.slice(0, 10);
    return btoa(`${timestamp}-${random}-${deviceInfo}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  };

  const registerDevice = () => {
    const token = generateDeviceToken();
    setDeviceToken(token);
    setShowTokenDialog(true);
    localStorage.setItem('deviceToken', token);
    localStorage.setItem('deviceRegistered', 'true');
  };

  const copyToken = async () => {
    if (deviceToken) {
      try {
        await navigator.clipboard.writeText(deviceToken);
        setCopied(true);
        toast.success('Token copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy token');
      }
    }
  };

  const completeRegistration = () => {
    if (deviceToken) {
      setShowTokenDialog(false);
      onRegistrationComplete(deviceToken);
    }
  };

  if (!showTokenDialog && localStorage.getItem('deviceRegistered')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AlertDialog open={showTokenDialog}>
        <AlertDialogContent className="w-full max-w-sm mx-auto">
          <AlertDialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-foreground text-background rounded-full">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <AlertDialogTitle className="text-lg">Device Registered!</AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p className="text-sm">
                Your device has been registered successfully. Save this token securely - you'll need it to access your encrypted recordings.
              </p>
              
              <Card className="border-2 border-dashed">
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="text-sm">Device Token</CardTitle>
                  <CardDescription className="text-xs">
                    Save this token in a secure location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-xs break-all font-mono block text-center">
                      {deviceToken}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToken}
                    className="w-full h-10"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Token
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-destructive text-xs text-center">
                  ⚠️ This token will only be shown once. Make sure to save it before continuing.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={completeRegistration} className="w-full h-12 text-base">
              I've Saved the Token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}