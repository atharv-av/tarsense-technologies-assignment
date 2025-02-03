// components/NoteModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Note {
  _id: string;
  title: string;
  content: string;
  isAudio: boolean;
  audioUrl?: string;
  duration?: string;
  createdAt: string;
  images?: Array<{
    url: string;
    caption: string;
  }>;
}

interface NoteModalProps {
  note: Note;
  onClose: () => void;
  onUpdate: () => void;
}

export default function NoteModal({ note, onClose, onUpdate }: NoteModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (note.audioUrl && !audioRef.current) {
      audioRef.current = new Audio(note.audioUrl);

      const setupAudio = () => {
        audioRef.current?.addEventListener("timeupdate", updateProgress);
        audioRef.current?.addEventListener("loadedmetadata", () => {
          setDuration(audioRef.current?.duration || 0);
        });
        audioRef.current?.addEventListener("ended", () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });
      };

      setupAudio();

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("timeupdate", updateProgress);
          audioRef.current.removeEventListener("loadedmetadata", () => {});
          audioRef.current.removeEventListener("ended", () => {});
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [note.audioUrl]);

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
          toast({
            title: "Playback Error",
            description: "Failed to play audio. Please try again.",
            variant: "destructive",
          });
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * duration;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/notes/${note._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (response.ok) {
        onUpdate();
        onClose();
        toast({
          title: "Note updated",
          description: "Your note has been successfully updated.",
        });
      } else {
        throw new Error("Failed to update note");
      }
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Update failed",
        description: "Failed to update the note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAudio = async () => {
    if (note.audioUrl) {
      try {
        const response = await fetch(note.audioUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${note.title.replace(/\s+/g, "_")}_audio.wav`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error("Error downloading audio:", error);
        toast({
          title: "Download failed",
          description: "Failed to download audio. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className={`${
          isFullscreen
            ? "w-screen h-screen max-w-none m-0 rounded-none"
            : "max-w-4xl"
        }`}
      >
        <DialogTitle></DialogTitle>
        <DialogHeader className="flex items-center justify-between">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold flex-1 mr-4"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="content">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            {note.isAudio && <TabsTrigger value="audio">Audio</TabsTrigger>}
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </TabsContent>

          {note.isAudio && (
            <TabsContent value="audio" className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-2">
                  <Button variant="ghost" size="icon" onClick={togglePlay}>
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <div
                    ref={progressRef}
                    className="flex-1 h-2 bg-secondary rounded-full cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>

                  <span className="text-sm text-muted-foreground min-w-[80px] text-right">
                    {formatTime(currentTime)} / {note.duration}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownloadAudio}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Original Recording</span>
                  <span>{note.duration}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Transcription</h3>
                <p className="text-sm text-muted-foreground">{content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(content);
                    toast({
                      title: "Copied",
                      description: "Transcription copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
