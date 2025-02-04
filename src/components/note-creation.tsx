import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Loader2, Square, ImageIcon } from "lucide-react";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { toast } from "@/hooks/use-toast";

interface NoteCreationProps {
  onNoteCreated: () => void;
}

export default function NoteCreation({ onNoteCreated }: NoteCreationProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isRecording,
    duration,
    audioBlob,
    handleStartRecording,
    handleStopRecording,
  } = useAudioRecording();

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useSpeechRecognition();

  useEffect(() => {
    if (error) {
      toast({
        title: "Speech Recognition Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  useEffect(() => {
    setContent(transcript);
  }, [transcript]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    if (audioBlob) {
      formData.append("audio", audioBlob);
      formData.append("isAudio", "true");
      formData.append("duration", duration);
    }

    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setTitle("");
        setContent("");
        setImages([]);
        resetTranscript();
        onNoteCreated();
        toast({
          title: "Success",
          description: "Note created successfully",
        });
      } else {
        throw new Error("Failed to create note");
      }
    } catch (error) {
      console.error("Failed to create note:", error);
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordingStart = () => {
    handleStartRecording();
    startListening();
    setContent("");
    resetTranscript();
  };

  const handleRecordingStop = async () => {
    await handleStopRecording();
    stopListening();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages((prevImages) => [...prevImages, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto flex flex-col gap-4"
      >
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mb-2"
            />
            <Textarea
              placeholder="Start typing or record audio..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "secondary"}
              onClick={isRecording ? handleRecordingStop : handleRecordingStart}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button type="submit" disabled={isRecording || isProcessing}>
              Save
            </Button>
          </div>
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {images.map((image, index) => (
              <div key={index} className="flex flex-col gap-2">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Uploaded image ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveImage(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
        {isRecording && (
          <div className="absolute top-0 left-0 right-0 -translate-y-full bg-destructive text-destructive-foreground p-2 text-center">
            Recording... {duration}
            {isListening && " (Transcribing...)"}
          </div>
        )}
      </form>
    </div>
  );
}