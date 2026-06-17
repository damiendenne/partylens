"use client";

import { useRef, useEffect, useState, use } from "react";
import { X, Maximize2, Images } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore";

export default function PhotoboothPage({ params }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;

  const videoRef = useRef(null);

  const [flash, setFlash] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [eventData, setEventData] = useState(null);

  const [selectedFrameNumber, setSelectedFrameNumber] = useState(1);
  const [frameUrl, setFrameUrl] = useState(null);
  const [frameUrls, setFrameUrls] = useState([]);
  const [showFrameSelector, setShowFrameSelector] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const docRef = doc(db, "events", eventId);

    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setEventData(snap.data());
        } else {
          console.warn("Document inexistant");
        }
      },
      (error) => {
        console.error("Erreur Firestore:", error);
      }
    );

    return () => unsub();
  }, [eventId]);

  useEffect(() => {
    const loadAllFrames = async () => {
      const urls = [];

      for (let index = 1; index <= 26; index += 1) {
        try {
          const framePath = `photobooth-frames/${index}.png`;
          const frameRef = ref(storage, framePath);
          const url = await getDownloadURL(frameRef);

          urls.push({
            number: index,
            url
          });
        } catch (error) {
          console.error(`Cadre ${index} introuvable :`, error);
        }
      }

      setFrameUrls(urls);
      setFrameUrl(urls[0]?.url || null);
    };

    loadAllFrames();
  }, []);

  useEffect(() => {
    const selectedFrame = frameUrls.find((frame) => frame.number === selectedFrameNumber);

    if (selectedFrame) {
      setFrameUrl(selectedFrame.url);
    }
  }, [selectedFrameNumber, frameUrls]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            aspectRatio: { ideal: 16 / 9 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Erreur caméra:", err);
      }
    };

    startCamera();
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((error) => {
        console.log(error);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const startPhotoProcess = () => {
    let timeLeft = 10;

    setCountdown(timeLeft);

    const timer = setInterval(() => {
      timeLeft -= 1;

      if (timeLeft > 0) {
        setCountdown(timeLeft);
      } else {
        clearInterval(timer);
        setCountdown(null);
        capturePhoto();
      }
    }, 1000);
  };

  const loadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image();

      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  const capturePhoto = async () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;

    if (!video) return;

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (frameUrl) {
      const img = await loadImage(frameUrl);

      if (img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        const fileName = `events/${eventId}/photos/${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, blob);

        const url = await getDownloadURL(storageRef);

        await addDoc(collection(db, "events", eventId, "photos"), {
          url,
          frameNumber: selectedFrameNumber,
          createdAt: serverTimestamp(),
          type: "photo"
        });

        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      } catch (error) {
        console.error("Erreur upload:", error);
      }
    }, "image/jpeg");
  };

  return (
    <main className="fixed inset-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {frameUrl && (
        <img
          key={frameUrl}
          src={frameUrl}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
          alt="Cadre"
        />
      )}

      <div className="absolute bottom-10 left-4 z-50">
        <button
          type="button"
          onClick={() => setShowFrameSelector(!showFrameSelector)}
          className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md"
        >
          <Images size={20} />
          Cadres
        </button>
      </div>

      {showFrameSelector && (
        <div className="absolute bottom-28 left-0 right-0 z-50 px-4">
          <div className="mx-auto flex max-w-[720px] gap-2 overflow-x-auto rounded-full bg-black/60 px-4 py-3 backdrop-blur-md">
            {frameUrls.map((frame) => (
              <button
                key={frame.number}
                type="button"
                onClick={() => {
                  setSelectedFrameNumber(frame.number);
                  setShowFrameSelector(false);
                }}
                className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 transition-transform ${
                  selectedFrameNumber === frame.number
                    ? "scale-110 border-pink-500"
                    : "border-white/40"
                }`}
              >
                <img
                  src={frame.url}
                  alt={`Cadre ${frame.number}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {showToast && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-1 rounded-[32px]">
            <div className="bg-black/90 p-10 rounded-[30px] text-white text-center">
              <h2 className="text-4xl font-bold mb-4">✨ C&apos;est dans la boîte !</h2>
            </div>
          </div>
        </div>
      )}

      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-40 text-[200px] font-bold text-white animate-pulse">
          {countdown}
        </div>
      )}

      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      <div className="absolute bottom-10 w-full flex justify-center items-center gap-6 z-40">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="p-4 bg-black/50 rounded-full text-white"
        >
          <X size={24} />
        </button>

        <button
          type="button"
          onClick={startPhotoProcess}
          className="w-20 h-20 bg-white rounded-full border-4 border-pink-500 hover:scale-105 transition-transform"
          aria-label="Prendre une photo"
        />

        <button
          type="button"
          onClick={toggleFullScreen}
          className="p-4 bg-black/50 rounded-full text-white"
        >
          <Maximize2 size={24} />
        </button>
      </div>
    </main>
  );
}