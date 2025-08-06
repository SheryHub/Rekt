import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Power, 
  Mic, 
  Video, 
  Shield, 
  Brain, 
  Download, 
  Play,
  Moon,
  Sun
} from 'lucide-react';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { useVoiceRecognition } from '@/hooks/use-voice-recognition';
import { useEncryption } from '@/hooks/use-encryption';
import { useTheme } from '@/components/ThemeProvider';
import { localStorage } from '@/lib/storage';
import { VoiceTraining } from '@/components/VoiceTraining';
import { toast } from '@/hooks/use-toast';
import type { Recording, AppSettings } from '@shared/schema';

interface VoiceRecorderProps {
  deviceToken: string;
}

export function VoiceRecorder({ deviceToken }: VoiceRecorderProps) {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    startPhrase: "start recording",
    stopPhrase: "stop recording", 
    recordingMode: 'voice',
    isListening: false,
    theme: 'light'
  });
  
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showVoiceTraining, setShowVoiceTraining] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { startRecording, stopRecording, recordedData, isRecording, clearRecording } = useMediaRecorder();
  const { encryptData } = useEncryption();

  const handleVoiceActivation = useCallback((action: string) => {
    if (action === 'start' && !isRecording) {
      startRecording(settings.recordingMode);
    } else if (action === 'stop' && isRecording) {
      stopRecording();
    }
  }, [isRecording, settings.recordingMode, startRecording, stopRecording]);

  const { isListening } = useVoiceRecognition({
    startPhrase: settings.startPhrase,
    stopPhrase: settings.stopPhrase,
    onActivation: handleVoiceActivation,
    isEnabled: settings.isListening
  });

  // Load settings and recordings on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await localStorage.init();
        
        const savedSettings = await localStorage.getSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }
        
        const savedRecordings = await localStorage.getRecordings();
        setRecordings(savedRecordings.map(r => ({
          id: r.id,
          type: r.type,
          timestamp: r.timestamp,
          size: r.size,
          duration: r.duration,
          encrypted: r.encrypted
        })));
      } catch (error) {
        toast({
          title: "Load failed",
          description: "Could not load saved data",
          variant: "destructive"
        });
      }
    };
    
    loadData();
  }, []);

  // Save recording when data is available
  useEffect(() => {
    const saveRecording = async () => {
      if (recordedData && !isRecording) {
        try {
          const encryptedData = await encryptData(recordedData, deviceToken);
          
          const recording: Recording = {
            id: crypto.randomUUID(),
            type: settings.recordingMode,
            timestamp: Date.now(),
            size: encryptedData.byteLength,
            duration: 0, // Would need to calculate from audio data
            encrypted: true
          };

          await localStorage.saveRecording(recording, encryptedData);
          setRecordings(prev => [recording, ...prev]);
          clearRecording();
          
          toast({
            title: "Recording saved",
            description: "Your recording has been encrypted and saved locally",
          });
        } catch (error) {
          toast({
            title: "Save failed", 
            description: "Could not save recording",
            variant: "destructive"
          });
        }
      }
    };
    
    saveRecording();
  }, [recordedData, isRecording, encryptData, deviceToken, settings.recordingMode, clearRecording]);

  const toggleListening = () => {
    if (settings.isListening) {
      setShowConfirmDialog(true);
    } else {
      updateSettings({ isListening: true });
      toast({
        title: "Voice activation enabled",
        description: "Now listening for voice commands",
      });
    }
  };

  const confirmStopListening = () => {
    updateSettings({ isListening: false });
    setShowConfirmDialog(false);
    toast({
      title: "Voice activation disabled",
      description: "Voice commands are now disabled",
    });
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.saveSettings(newSettings);
  };

  const handleRetrainVoice = () => {
    setShowVoiceTraining(true);
  };

  const exportRecordings = async () => {
    try {
      const recordingsWithData = await localStorage.getRecordings();
      
      for (const recording of recordingsWithData) {
        const blob = new Blob([recording.data], { 
          type: recording.type === 'video' ? 'video/webm' : 'audio/webm' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording_${recording.id}.${recording.type === 'video' ? 'webm' : 'webm'}`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Export complete",
        description: `${recordingsWithData.length} recordings exported`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export recordings",
        variant: "destructive"
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border z-10 backdrop-blur">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <Mic className="h-5 w-5" />
            <span className="font-medium">Voice Recorder</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="w-12 h-6 p-0 relative rounded-full"
          >
            <div className={`absolute w-5 h-5 rounded-full bg-primary transition-transform duration-200 ${
              theme === 'dark' ? 'translate-x-[24px]' : 'translate-x-0'
            }`} />
            {theme === 'light' ? (
              <Sun className="h-3 w-3 absolute left-1" />
            ) : (
              <Moon className="h-3 w-3 absolute right-1" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        
        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border border-border ${
                  isListening ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isListening ? 'bg-green-500 animate-pulse-slow' : 'bg-muted-foreground'
                  }`} />
                  <span>{isListening ? 'Listening' : 'Not Listening'}</span>
                </div>
              </div>
              
              <h1 className="text-xl font-medium">
                {settings.recordingMode === 'voice' ? 'Voice' : 'Video'} Recording
              </h1>
              
              {/* Recording Mode Toggle */}
              <div className="flex justify-center">
                <div className="flex bg-muted rounded-lg p-1 border border-border">
                  <Button
                    variant={settings.recordingMode === 'voice' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => updateSettings({ recordingMode: 'voice' })}
                    className="gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Voice
                  </Button>
                  <Button
                    variant={settings.recordingMode === 'video' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => updateSettings({ recordingMode: 'video' })}
                    className="gap-2"
                  >
                    <Video className="h-4 w-4" />
                    Video
                  </Button>
                </div>
              </div>
              
              {/* Main Power Button */}
              <div className="flex justify-center py-8">
                <Button
                  className={`w-48 h-48 rounded-full text-2xl font-bold power-button ${
                    isListening ? 'recording-pulse' : ''
                  }`}
                  onClick={toggleListening}
                >
                  <div className="flex flex-col items-center">
                    <Power className="h-12 w-12 mb-3" />
                    <span>{settings.isListening ? 'ON' : 'OFF'}</span>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Commands Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Voice Commands</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Customize the phrases to start and stop recording
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="startPhrase">Start Phrase</Label>
              <Input
                id="startPhrase"
                value={settings.startPhrase}
                onChange={(e) => updateSettings({ startPhrase: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="stopPhrase">Stop Phrase</Label>
              <Input
                id="stopPhrase"
                value={settings.stopPhrase}
                onChange={(e) => updateSettings({ stopPhrase: e.target.value })}
              />
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleRetrainVoice}
            >
              <Brain className="h-4 w-4 mr-2" />
              Retrain Voice Model
            </Button>
          </CardContent>
        </Card>

        {/* Recording History */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recordings</CardTitle>
              <span className="text-sm text-muted-foreground">
                {recordings.length} files
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recordings.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No recordings yet
              </div>
            ) : (
              recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    {recording.type === 'voice' ? (
                      <Mic className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium text-sm">
                        {recording.type === 'voice' ? 'Voice' : 'Video'} Recording
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(recording.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatSize(recording.size)}
                    </span>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            
            {recordings.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={exportRecordings}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Recordings
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-medium">Your Privacy is Protected</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• All recordings are encrypted with your device token</p>
                <p>• No data is sent to the cloud or internet</p>
                <p>• Voice model training happens locally</p>
                <p>• Only you can access your recordings</p>
              </div>
              
              <div className="bg-muted rounded-lg p-3 mt-4">
                <div className="text-xs text-muted-foreground">
                  <strong>Device Token (Encrypted):</strong><br />
                  <code className="font-mono">
                    {deviceToken.slice(0, 4)}{'*'.repeat(deviceToken.length - 8)}{deviceToken.slice(-4)}
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Voice Training Modal */}
      {showVoiceTraining && (
        <VoiceTraining
          phrase={settings.startPhrase}
          onComplete={() => setShowVoiceTraining(false)}
        />
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Turn Off Voice Activation?</h3>
                <p className="text-sm text-muted-foreground">
                  This will stop listening for voice commands and stop any active recording.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirmDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={confirmStopListening}
                  >
                    Turn Off
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
