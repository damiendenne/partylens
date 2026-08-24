"use client";
import { useState, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Mic, Square, Send, Loader2, CheckCircle2, BookOpen } from 'lucide-react';

export default function AudioGuestbook({ eventId }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [author, setAuthor] = useState('');
  const [transcript, setTranscript] = useState(''); // Le texte retranscrit
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // Démarrer l'enregistrement et la transcription en même temps
  const startRecording = async () => {
    audioChunksRef.current = [];
    setTranscript('');

    try {
      // 1. Capture du son (pour Firebase Storage)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start();

      // 2. Transcription vocale en direct (Speech-to-Text)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR'; // Langue française
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTranscript(prev => prev + (finalTranscript ? ' ' + finalTranscript : ''));
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setRecording(true);
    } catch (err) {
      console.error("Erreur accès micro:", err);
      alert("Impossible d'accéder au microphone. Vérifie les autorisations.");
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setRecording(false);
  };

  // Envoyer sur Firebase (Audio + Texte injecté dans le livre d'or écrit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioBlob || !author.trim()) return;

    setLoading(true);
    try {
      const fileName = `audio_${Date.now()}.webm`;
      const storageRef = ref(storage, `events/${eventId}/audio/${fileName}`);
      
      // Upload du fichier audio
      await uploadBytes(storageRef, audioBlob);
      const downloadUrl = await getDownloadURL(storageRef);

      const finalMessage = transcript.trim() ? transcript.trim() : "[Message vocal sans transcription texte]";

      // 1. Envoi dans la collection du livre d'or audio
      await addDoc(collection(db, "events", eventId, "audioGuestbook"), {
        author: author.trim(),
        url: downloadUrl,
        message: finalMessage,
        createdAt: serverTimestamp()
      });

      // 2. INJECTION AUTOMATIQUE dans le livre d'or écrit existant !
      await addDoc(collection(db, "events", eventId, "guestbook"), {
        author: `${author.trim()} 🎤 (Audio)`,
        message: finalMessage,
        audioUrl: downloadUrl, // On peut même stocker le lien audio ici si tu veux l'écouter directement dans le livre d'or écrit !
        createdAt: serverTimestamp()
      });

      setSuccessMsg(true);
      setAudioBlob(null);
      setAudioUrl(null);
      setAuthor('');
      setTranscript('');
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) {
      console.error("Erreur envoi audio:", err);
      alert("Erreur lors de l'envoi.");
    }
    setLoading(false);
  };

  return (
    <div className="glass-card p-8 rounded-[40px]">
      <h2 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3">
        <Mic size={20} className="text-purple-400" /> Livre d'or Audio & Magique ✨
      </h2>
      <p className="text-xs text-gray-400 mb-6 font-medium">
        Enregistre ton message : il sera converti en texte et ajouté automatiquement au livre d'or écrit, tout en gardant l'audio original !
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text" 
          placeholder="Ton nom / signature" 
          value={author} 
          onChange={(e) => setAuthor(e.target.value)} 
          className="w-full bg-black border border-white/20 p-5 rounded-2xl outline-none focus:border-purple-500 transition text-sm text-white font-bold placeholder:text-gray-600"
        />

        {!recording && !audioUrl && (
          <button 
            type="button" 
            onClick={startRecording}
            className="w-full py-6 bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition"
          >
            <Mic size={28} className="text-purple-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-white">Appuyer pour parler</span>
          </button>
        )}

        {recording && (
          <div className="space-y-4">
            <button 
              type="button" 
              onClick={stopRecording}
              className="w-full py-6 bg-red-500/20 border-2 border-red-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition animate-pulse"
            >
              <Square size={28} className="text-red-500 fill-red-500" />
              <span className="text-xs font-black uppercase tracking-widest text-red-400">Enregistrement en cours... (Clique pour stopper)</span>
            </button>
            {/* Aperçu du texte en direct */}
            <div className="p-4 bg-black/60 rounded-2xl border border-white/10 text-xs text-gray-300 italic min-h-[60px]">
              <span className="text-purple-400 font-bold not-italic block mb-1">Transcription en direct :</span>
              {transcript || "Parle, le texte va s'afficher ici..."}
            </div>
          </div>
        )}

        {audioUrl && !recording && (
          <div className="space-y-4">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/10 flex flex-col gap-3">
              <audio src={audioUrl} controls className="w-full" />
              <div className="text-xs text-gray-300 bg-black/50 p-3 rounded-xl border border-white/5">
                <span className="text-purple-400 font-bold block mb-1">Texte généré :</span>
                <textarea 
                  value={transcript} 
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-white resize-none text-xs"
                  rows={3}
                  placeholder="Tu peux corriger le texte ici si besoin..."
                />
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => { setAudioBlob(null); setAudioUrl(null); setTranscript(''); }}
              className="text-[10px] text-gray-400 uppercase tracking-widest underline cursor-pointer bg-transparent border-none block mx-auto"
            >
              Recommencer l'enregistrement
            </button>
          </div>
        )}

        {audioUrl && (
          <button 
            type="submit" 
            disabled={loading || !author.trim()} 
            className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            {loading ? "Publication..." : "Ajouter au livre d'or écrit & audio 🚀"}
          </button>
        )}

        {successMsg && (
          <div className="flex items-center justify-center gap-2 text-green-400 text-xs font-black uppercase tracking-wider mt-2">
            <CheckCircle2 size={16} /> Envoyé et retranscrit avec succès !
          </div>
        )}
      </form>
    </div>
  );
}