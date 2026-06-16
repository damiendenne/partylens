"use client";
import { useRef, useEffect, useState, use } from 'react';
import { X, Zap, Maximize2 } from 'lucide-react';
import { db, storage } from "@/lib/firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const THEMES = [
  { id: 'none', name: 'Aucun', overlay: null },
  { id: 'birthday', name: 'Anniversaire', overlay: '/frames/birthday.png' },
  { id: 'hawaii', name: 'Hawaï', overlay: '/frames/hawaii.png' },
];

export default function PhotoboothPage({ params }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;

  const videoRef = useRef(null);
  const [theme, setTheme] = useState(THEMES[0]);
  const [userName, setUserName] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', aspectRatio: { ideal: 16 / 9 } } 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { console.error("Erreur caméra:", err); }
    };
    startCamera();
  }, []);

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

  const capturePhoto = async () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(video, 0, 0);

    if (userName) {
      ctx.font = 'bold 50px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(userName, canvas.width / 2, canvas.height - 50);
    }

    if (theme.overlay) {
      const img = new Image();
      img.src = theme.overlay;
      await new Promise((resolve) => { img.onload = resolve; });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const fileName = `events/${eventId}/${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        await addDoc(collection(db, "events", eventId, "photos"), {
          url: url,
          createdAt: serverTimestamp(),
          type: "photo"
        });
        console.log("Photo enregistrée !");
      } catch (error) { console.error("Erreur :", error); }
    }, 'image/jpeg');
  };

  return (
    <main className="fixed inset-0 bg-black flex flex-col items-center">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

      {/* Interface de personnalisation */}
      <div className="absolute top-10 flex flex-col gap-4 z-40">
        <input 
          type="text" 
          placeholder="Entrez un prénom..." 
          className="p-3 rounded-xl bg-black/50 text-white border border-white/20"
          onChange={(e) => setUserName(e.target.value)}
        />
        <select 
          onChange={(e) => setTheme(THEMES.find(t => t.id === e.target.value))} 
          className="p-3 rounded-xl bg-black/50 text-white border border-white/20"
        >
          {THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-40 text-[200px] font-bold text-white">
          {countdown}
        </div>
      )}

      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      <button 
        onClick={startPhotoProcess} 
        className="absolute bottom-10 w-20 h-20 bg-white rounded-full border-4 border-pink-500 z-40 hover:scale-105" 
      />
    </main>
  );
}