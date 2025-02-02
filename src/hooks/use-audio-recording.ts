import { useState, useRef, useEffect } from "react"

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState("00:00")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRecording) {
      startTimeRef.current = Date.now()
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        // Stop at 60 seconds
        if (elapsed >= 60) {
          handleStopRecording()
          return
        }

        const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0")
        const seconds = (elapsed % 60).toString().padStart(2, "0")
        setDuration(`${minutes}:${seconds}`)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRecording])

  const handleStartRecording = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(streamRef.current)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        setAudioBlob(audioBlob)
      }

      mediaRecorderRef.current.start(1000)
      setIsRecording(true)
      startTimeRef.current = Date.now()
    } catch (error) {
      console.error("Error starting recording:", error)
      throw new Error("Failed to start recording")
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }

  return {
    isRecording,
    duration,
    audioBlob,
    handleStartRecording,
    handleStopRecording,
    resetRecording: () => setAudioBlob(null)
  }
}
