import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import "./App.css";

function dataURIToBlob(dataURI: string) {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // Create a Blob from the typed array with the appropriate MIME type
  return new Blob([ab], { type: mimeString });
}

const WebcamCapture: React.FC<void> = () => {
  const webcamRef = useRef<Webcam>(null);
  const [image, setImage] = useState<string | ArrayBuffer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);

  useEffect(() => {
    if (recording) {
      const interval = setInterval(() => {
        capture();
      }, 300);
      return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
    }
  }, [recording]);

  async function sendImageToServerasync(image: Blob) {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", image, "image.png");

      const response = await fetch("http://localhost:8888/meshes/image", {
        method: "POST",
        body: formData,
      });
      const responseBlob = await response.blob();
      console.log(responseBlob);
      if (!response.ok) {
        throw new Error("Error uploading image");
      }
      if (recording) {
        const imageUrl = URL.createObjectURL(responseBlob);
        setImage(imageUrl);
      }
    } catch (error) {
      console.error("Error sending image to server:", error);
    } finally {
      setLoading(false);
    }
  }

  const capture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      const blob = dataURIToBlob(imageSrc!);
      sendImageToServerasync(blob);
    }
  };

  return (
    <body className="bg-gray-100 text-gray-800">
      <div className="video-container">
        <Webcam
          className="video-box"
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user",
          }}
        />
        <div className="video-box">
          {image && (
            <img
              src={image as string}
              alt="Uploaded"
              style={{ width: "640", height: 480, objectFit: "fill" }}
            />
          )}
        </div>
      </div>
      <div className="toggle-button">
        <button
          id="recordButton"
          onClick={() => {
            setRecording(!recording);
          }}
        >
          {recording ? "Stop" : "Start"}
        </button>
      </div>
    </body>
  );
};

export default WebcamCapture;
