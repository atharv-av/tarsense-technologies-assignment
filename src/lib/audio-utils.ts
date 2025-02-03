type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript: string = Array.from(event.results)
        .map((result: SpeechRecognitionResult) => result[0].transcript)
        .join(" ");
      resolve(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    // Create an audio element to play the blob
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.play();
    recognition.start();
  });
}

export async function uploadAudioFile(
  audioBlob: Blob,
  token: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.wav");

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload audio file");
  }

  const data = await response.json();
  return data.url;
}
