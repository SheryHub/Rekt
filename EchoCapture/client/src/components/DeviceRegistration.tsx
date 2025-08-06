import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Copy } from 'lucide-react';
import { useEncryption } from '@/hooks/use-encryption';
import { localStorage } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

interface DeviceRegistrationProps {
  onComplete: (token: string) => void;
}

export function DeviceRegistration({ onComplete }: DeviceRegistrationProps) {
  const [deviceToken, setDeviceToken] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const { generateDeviceToken } = useEncryption();

  useEffect(() => {
    const initializeToken = async () => {
      try {
        // Check if token already exists
        const existingToken = await localStorage.getDeviceToken();
        if (existingToken) {
          onComplete(existingToken.token);
          return;
        }

        // Generate new token
        const newToken = await generateDeviceToken();
        setDeviceToken(newToken);

        // Save to storage
        await localStorage.saveDeviceToken({
          token: newToken,
          createdAt: Date.now()
        });
      } catch (error) {
        toast({
          title: "Registration failed",
          description: "Could not generate device token",
          variant: "destructive"
        });
      }
    };

    initializeToken();
  }, [generateDeviceToken, onComplete]);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(deviceToken);
      setIsCopied(true);
      toast({
        title: "Token copied",
        description: "Device token has been copied to clipboard",
      });

      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy token to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleComplete = () => {
    if (deviceToken) {
      onComplete(deviceToken);
    }
  };

  if (!deviceToken) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Generating device token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-medium mb-2">Device Registration</h2>
              <p className="text-sm text-muted-foreground">
                Your device token has been generated. Save this securely - you'll need it to access your encrypted recordings.
              </p>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="text-center space-y-3">
                <h3 className="font-medium text-sm">Device Token</h3>
                <p className="text-xs text-muted-foreground">Save this token in a secure location</p>
                <div className="bg-muted rounded-lg p-3">
                  <code className="text-xs font-mono break-all">{deviceToken}</code>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCopyToken}
                  disabled={isCopied}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {isCopied ? 'Copied!' : 'Copy Token'}
                </Button>
              </div>
            </div>
            
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-destructive text-xs text-center">
                ⚠️ This token will only be shown once. Make sure to save it before continuing.
              </p>
            </div>
            
            <Button className="w-full" onClick={handleComplete}>
              I've Saved the Token
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
