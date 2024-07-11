// src/App.tsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const ffmpeg = new FFmpeg();

const App: React.FC = () => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [croppedVideoSrc, setCroppedVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = async () => {
    setIsLoading(true);
    if (!videoSrc || !croppedAreaPixels) return;

    const file = await fetch(videoSrc).then((r) => r.blob());
    if (!ffmpeg.loaded) await ffmpeg.load();

    ffmpeg.writeFile("input.mp4", await fetchFile(file));

    const { x, y, width, height } = croppedAreaPixels;
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-vf",
      `crop=${width}:${height}:${x}:${y}`,
      "output.mp4",
    ]);

    const data = await ffmpeg.readFile("output.mp4");
    const url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }));

    setCroppedVideoSrc(url);
    setIsLoading(false);
  };

  const handleSave = () => {
    if (croppedVideoSrc) {
      const a = document.createElement("a");
      a.href = croppedVideoSrc;
      a.download = "cropped_video.mp4";
      a.click();
    }
  };

  return (
    <div>
      <h1>Video Cropper</h1>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      {videoSrc && (
        <div style={{ position: "relative", width: "640px", height: "360px" }}>
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            style={{ display: "none" }}
          />
          <Cropper
            video={videoSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
          <button
            onClick={handleCrop}
            disabled={isLoading}
            style={{ position: "absolute", bottom: "-200px" }}
          >
            {isLoading ? "Cropping..." : "Crop Video"}
          </button>
        </div>
      )}
      {croppedVideoSrc && (
        <div>
          <video src={croppedVideoSrc} controls width="320" />
          <button onClick={handleSave}>Save Cropped Video</button>
        </div>
      )}
    </div>
  );
};

export default App;
