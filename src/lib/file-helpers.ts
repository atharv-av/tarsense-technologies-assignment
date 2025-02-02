export const uploadAudioFile = async (audioBlob: Blob, token: string): Promise<string> => {
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.wav')
    formData.append('type', 'audio')
  
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
  
    if (!response.ok) {
      throw new Error('Failed to upload audio file')
    }
  
    const data = await response.json()
    return data.url
  }