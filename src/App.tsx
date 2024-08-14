import React, { useRef, useState } from 'react';

const WebcamRecorder: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Media devices not supported');
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                setRecordedChunks((prev) => [...prev, event.data]);
            }
        };

        mediaRecorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleSendToServer = async () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('video', blob, 'recording.webm');

        try {
            const response = await fetch('/api/upload-video', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('Video uploaded successfully!');
            } else {
                alert('Failed to upload video');
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            alert('Error uploading video');
        }
    };

    return (
        <div>
            <video 
                ref={videoRef} 
                width="640" 
                height="480" 
                autoPlay 
                muted 
            />
            <div>
                {!isRecording ? (
                    <button onClick={startRecording}>Start Recording</button>
                ) : (
                    <button onClick={stopRecording}>Stop Recording</button>
                )}
            </div>
            {recordedChunks.length > 0 && (
                <div>
                    <button onClick={handleSendToServer}>Send to Server</button>
                </div>
            )}
        </div>
    );
};

export default WebcamRecorder;
