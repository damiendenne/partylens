"use client";

import { useRef, useEffect, useState, use } from "react";
import { X, Maximize2, Images, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore";

export default function PhotoboothPage({ params }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;

  const videoRef = useRef(null);

  // Gestion des étapes du parcours photobooth
  // 'live' | 'captured' | 'email-choice' | 'email-input' | 'sent'
  const [step, setStep] = useState("live");

  const [flash, setFlash] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [eventData, setEventData] = useState(null);

  const [selectedFrameNumber, setSelectedFrameNumber] = useState(1);
  const [frameUrl, setFrameUrl] = useState(null);
  const [frameUrls, setFrameUrls] = useState([]);
  const [showFrameSelector, setShowFrameSelector] = useState(false);

  // États pour la gestion de l'email et de la photo capturée
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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
        setCapturedPhotoUrl(url);

        await addDoc(collection(db, "events", eventId, "photos"), {
          url,
          frameNumber: selectedFrameNumber,
          createdAt: serverTimestamp(),
          type: "photo"
        });

        // 1. Affiche "C'est dans la boîte !"
        setStep("captured");

        // 2. Après 2.5 secondes, bascule vers le choix d'envoi par mail
        setTimeout(() => {
          setStep("email-choice");
        }, 2500);

      } catch (error) {
        console.error("Erreur upload:", error);
      }
    }, "image/jpeg");
  };

  // Gestion de l'envoi d'email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailInput) return;
    setIsSendingEmail(true);

    try {
      const response = await fetch('/api/send-photobooth-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, photoUrl: capturedPhotoUrl, eventId }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi de l'e-mail");
      }

      setStep("sent");
      setTimeout(() => resetPhotobooth(), 3500);
    } catch (err) {
      console.error("Erreur envoi email:", err);
      alert("Erreur lors de l'envoi de l'e-mail.");
      setIsSendingEmail(false);
    }
  };

  // Remise à zéro pour repartir sur la page photobooth initiale
  const resetPhotobooth = () => {
    setCapturedPhotoUrl(null);
    setEmailInput("");
    setIsSendingEmail(false);
    setStep("live");
  };

  return (
    <main className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      {/* Flux de la caméra (visible uniquement en mode live ou décompte) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 ${step !== 'live' && countdown === null ? 'hidden' : ''}`}
      />

      {frameUrl && step === 'live' && (
        <img
          key={frameUrl}
          src={frameUrl}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
          alt="Cadre"
        />
      )}

      {/* --- ÉTAPE : C'EST DANS LA BOÎTE --- */}
      {step === 'captured' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-300">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-1 rounded-[32px]">
            <div className="bg-black/90 p-10 rounded-[30px] text-white text-center">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-pink-500">✨ C&apos;est dans la boîte !</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Préparation des options...</p>
            </div>
          </div>
        </div>
      )}

      {/* --- ÉTAPE : CHOIX OUI / NON POUR L'EMAIL --- */}
      {step === 'email-choice' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in">
          <div className="w-full max-w-md bg-gray-900 border border-white/10 p-8 rounded-[40px] text-center shadow-2xl">
            {capturedPhotoUrl && (
              <img src={capturedPhotoUrl} alt="Aperçu" className="w-full rounded-2xl mb-6 border border-white/10 object-cover aspect-video" />
            )}
            <h3 className="text-2xl font-black italic uppercase mb-6 tracking-tight text-white">
              Voulez-vous recevoir une copie par mail ?
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStep('email-input')}
                className="bg-pink-600 hover:bg-pink-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all"
              >
                Oui
              </button>
              <button
                type="button"
                onClick={resetPhotobooth}
                className="bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-white/10 transition-all"
              >
                Non
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ÉTAPE : SAISIE DE L'EMAIL --- */}
      {step === 'email-input' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in">
          <div className="w-full max-w-md bg-gray-900 border border-white/10 p-8 rounded-[40px] shadow-2xl">
            <h3 className="text-2xl font-black italic uppercase mb-2 tracking-tight text-center text-white">
              Votre adresse mail
            </h3>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest text-center mb-6">Pour recevoir votre souvenir photo</p>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-pink-500 transition-all placeholder:text-gray-600"
                />
                <Mail size={18} className="absolute right-4 top-4 text-gray-500" />
              </div>

              <button
                type="submit"
                disabled={isSendingEmail}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all flex items-center justify-center gap-2"
              >
                {isSendingEmail ? "Envoi en cours..." : <>Valider l&apos;envoi <ArrowRight size={16} /></>}
              </button>

              <button
                type="button"
                onClick={resetPhotobooth}
                className="w-full text-gray-500 hover:text-white py-2 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Annuler / Recommencer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ÉTAPE : SUCCÈS ENVOI --- */}
      {step === 'sent' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md text-center animate-in zoom-in duration-300">
          <div className="bg-gray-900 border border-white/10 p-10 rounded-[40px] max-w-md w-full mx-4 shadow-2xl">
            <div className="inline-flex p-4 bg-green-500/10 text-green-500 rounded-full mb-4 border border-green-500/20">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-white">
              E-mail bien envoyé !
            </h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
              Pensez à vérifier vos spams si vous ne le recevez pas.
            </p>
            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">
              Retour automatique au photobooth...
            </p>
          </div>
        </div>
      )}

      {/* Bouton de sélection des cadres (affiché uniquement en mode live) */}
      {step === 'live' && (
        <>
          <div className="absolute bottom-10 left-4 z-40">
            <button
              type="button"
              onClick={() => setShowFrameSelector(!showFrameSelector)}
              className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md border border-white/10"
            >
              <Images size={20} />
              Cadres
            </button>
          </div>

          {showFrameSelector && (
            <div className="absolute bottom-28 left-0 right-0 z-40 px-4">
              <div className="mx-auto flex max-w-[720px] gap-2 overflow-x-auto rounded-full bg-black/60 px-4 py-3 backdrop-blur-md border border-white/10">
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
        </>
      )}

      {/* Compte à rebours */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-40 text-[200px] font-black italic text-pink-500 animate-pulse drop-shadow-[0_0_50px_rgba(236,72,153,0.8)]">
          {countdown}
        </div>
      )}

      {/* Flash visuel */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      {/* Barre d'action inférieure (visible uniquement en mode live) */}
      {step === 'live' && countdown === null && (
        <div className="absolute bottom-10 w-full flex justify-center items-center gap-6 z-40">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="p-4 bg-black/50 hover:bg-black/80 border border-white/10 rounded-full text-white transition-all"
          >
            <X size={24} />
          </button>

          <button
            type="button"
            onClick={startPhotoProcess}
            className="w-20 h-20 bg-white rounded-full border-4 border-pink-500 hover:scale-105 shadow-[0_0_30px_rgba(236,72,153,0.6)] transition-transform"
            aria-label="Prendre une photo"
          />

          <button
            type="button"
            onClick={toggleFullScreen}
            className="p-4 bg-black/50 hover:bg-black/80 border border-white/10 rounded-full text-white transition-all"
          >
            <Maximize2 size={24} />
          </button>
        </div>
      )}
    </main>
  );
}