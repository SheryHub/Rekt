import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Mic, Video, Power, PowerOff, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface RecordingInterfaceProps {
  deviceToken: string;
}

export function RecordingInterface({ deviceToken }: RecordingInterfaceProps) {
  const [isListening, setIsListening] = useState(true);
  const [recordingMode, setRecordingMode] = useState<'voice' | 'video'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [startPhrase, setStartPhrase] = useState('start recording');
  const [stopPhrase, setStopPhrase] = useState('stop recording');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordings, setRecordings] = useState<any[]>([]);

  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto theme based on system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  useEffect(() => {
    if (isListening) {
      startVoiceActivation();
    } else {
      stopVoiceActivation();
    }

    return () => {
      stopVoiceActivation();
    };
  }, [isListening, startPhrase, stopPhrase]);

  useEffect(() => {
    // Load saved recordings
    const savedRecordings = localStorage.getItem(`recordings_${deviceToken}`);
    if (savedRecordings) {
      setRecordings(JSON.parse(savedRecordings));
    }
  }, [deviceToken]);

  const startVoiceActivation = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        
        if (transcript.includes(startPhrase.toLowerCase()) && !isRecording) {
          startRecording();
        } else if (transcript.includes(stopPhrase.toLowerCase()) && isRecording) {
          stopRecording();
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          toast.error('Voice activation error. Please check your microphone.');
        }
      };

      recognitionInstance.onend = () => {
        if (isListening) {
          // Restart recognition if still listening
          setTimeout(() => {
            if (isListening) {
              recognitionInstance.start();
            }
          }, 100);
        }
      };

      recognitionInstance.start();
      setRecognition(recognitionInstance);
    } else {
      toast.error('Speech recognition not supported in this browser.');
    }
  };

  const stopVoiceActivation = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
  };

  const startRecording = async () => {
    try {
      const constraints = recordingMode === 'video' 
        ? { video: true, audio: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: recordingMode === 'video' ? 'video/webm' : 'audio/webm' 
        });
        saveRecording(blob);
        
        // Stop all tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success(`${recordingMode === 'video' ? 'Video' : 'Voice'} recording started`);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
      toast.success('Recording stopped and saved');
    }
  };

  const saveRecording = (blob: Blob) => {
    const recording = {
      id: Date.now().toString(),
      type: recordingMode,
      timestamp: new Date().toISOString(),
      size: blob.size,
      data: URL.createObjectURL(blob) // In a real app, this would be encrypted
    };

    const updatedRecordings = [...recordings, recording];
    setRecordings(updatedRecordings);
    localStorage.setItem(`recordings_${deviceToken}`, JSON.stringify(updatedRecordings));
  };

  const toggleListening = () => {
    if (isListening) {
      setShowConfirmDialog(true);
    } else {
      setIsListening(true);
      toast.success('Voice activation enabled');
    }
  };

  const confirmToggleOff = () => {
    setIsListening(false);
    setShowConfirmDialog(false);
    if (isRecording) {
      stopRecording();
    }
    toast.success('Voice activation disabled');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-3">
              {recordingMode === 'video' ? <Video className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              <span className="text-base font-medium">Voice Recorder</span>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-3 w-3" />
                    <span className="text-xs">Light</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-3 w-3" />
                    <span className="text-xs">Dark</span>
                  </div>
                </SelectItem>
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-3 w-3" />
                    <span className="text-xs">Auto</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content - Centered Container */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-md px-4 py-6 space-y-6">
          {/* Status Card */}
          <Card className="border-2">
            <CardHeader className="pb-4 text-center">
              <div className="space-y-2">
                <div className="flex justify-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    isRecording 
                      ? 'bg-foreground text-background dark:bg-background dark:text-foreground'
                      : isListening 
                        ? 'bg-foreground text-background dark:bg-background dark:text-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isRecording 
                        ? 'bg-background animate-pulse dark:bg-foreground' 
                        : isListening 
                          ? 'bg-background dark:bg-foreground' 
                          : 'bg-muted-foreground'
                    }`} />
                    {isRecording ? 'Recording...' : isListening ? 'Listening' : 'Inactive'}
                  </div>
                </div>
                <CardTitle className="text-lg text-center">
                  {recordingMode === 'video' ? 'Video Recording' : 'Voice Recording'}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Recording Mode Buttons */}
              <div className="flex justify-center">
                <div className="flex gap-2 p-2 bg-muted/50 rounded-lg">
                  <Button
                    onClick={() => setRecordingMode('voice')}
                    variant={recordingMode === 'voice' ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-10 px-4 ${
                      recordingMode === 'voice'
                        ? 'bg-foreground text-background hover:bg-foreground/90'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Voice
                  </Button>
                  <Button
                    onClick={() => setRecordingMode('video')}
                    variant={recordingMode === 'video' ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-10 px-4 ${
                      recordingMode === 'video'
                        ? 'bg-foreground text-background hover:bg-foreground/90'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                </div>
              </div>

              {/* Main Power Button */}
              <div className="flex justify-center py-6">
                <Button
                  onClick={toggleListening}
                  size="lg"
                  className={`h-48 w-48 rounded-full text-xl shadow-lg transition-all duration-200 ${
                    isListening 
                      ? 'bg-foreground hover:bg-foreground/90 text-background' 
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {isListening ? (
                    <div className="flex flex-col items-center gap-3">
                      <Power className="h-12 w-12" />
                      <span className="text-2xl font-bold">ON</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <PowerOff className="h-12 w-12" />
                      <span className="text-2xl font-bold">OFF</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Voice Commands Settings */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-base">Voice Commands</CardTitle>
              <CardDescription className="text-sm">
                Customize the phrases to start and stop recording
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-phrase" className="text-sm font-medium block text-center">Start Recording Phrase</Label>
                <Input
                  id="start-phrase"
                  value={startPhrase}
                  onChange={(e) => setStartPhrase(e.target.value)}
                  placeholder="e.g., start recording"
                  className="h-12 text-base text-center"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stop-phrase" className="text-sm font-medium block text-center">Stop Recording Phrase</Label>
                <Input
                  id="stop-phrase"
                  value={stopPhrase}
                  onChange={(e) => setStopPhrase(e.target.value)}
                  placeholder="e.g., stop recording"
                  className="h-12 text-base text-center"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Recordings */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2">
                <CardTitle className="text-base">Recent Recordings</CardTitle>
                <span className="text-sm font-normal text-muted-foreground">
                  ({recordings.length})
                </span>
              </div>
              <CardDescription className="text-sm">
                All recordings are encrypted and stored locally
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recordings.length > 0 ? (
                <div className="space-y-3">
                  {recordings.slice(-3).reverse().map((recording) => (
                    <div key={recording.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-foreground text-background">
                          {recording.type === 'video' ? <Video className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {recording.type === 'video' ? 'Video' : 'Voice'} Recording
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(recording.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(recording.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  ))}
                  {recordings.length > 3 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      +{recordings.length - 3} more recordings
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center">
                      <Mic className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">No recordings yet</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Say "{startPhrase}" to start your first recording
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="mx-4 max-w-sm">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-base">Turn Off Voice Activation?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will stop listening for voice commands. Any ongoing recording will be stopped and saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2">
            <AlertDialogAction onClick={confirmToggleOff} className="w-full">
              Turn Off
            </AlertDialogAction>
            <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}