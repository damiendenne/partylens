"use client";

import { useRef, useEffect, useState, use } from "react";
import { X, Maximize2, Images, Mail, ArrowRight, CheckCircle2, Shuffle, Sun, Moon } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore";

// Liste riche de 200 défis collectifs, drôles et décalés
const FUN_CHALLENGES = [
  "Faites votre meilleure tête de zombie tous ensemble !",
  "Prenez une pose de super-héros au sommet de leur gloire !",
  "Tout le monde doit tirer la langue en même temps !",
  "Faites un énorme câlin collectif serré !",
  "Imitez des statues grecques figées dans le temps !",
  "Faites une tête de surprise totale comme si vous voyiez un fantôme !",
  "Le groupe doit former un grand cœur avec les mains !",
  "Tout le monde doit fermer les yeux et sourire béatement !",
  "Faites semblant d'exploser de rire sans retenue !",
  "Le groupe doit pointer du doigt la personne la plus drôle !",
  "Tout le monde doit lever les bras au ciel en criant 'OUAH' !",
  "Prenez une pose de mannequin de haute couture sur un podium !",
  "Un seul invité fait une grimace horrible, tous les autres gardent un visage hyper sérieux !",
  "Tout le monde doit faire un clin d'œil appuyé à la caméra !",
  "Le groupe doit faire semblant de sauter en l'air !",
  "Faites une pose de rockstar avec des guitares imaginaires enflammées !",
  "Tout le monde doit se cacher les yeux avec les mains !",
  "Faites une pose de méditation zen absolue !",
  "Le groupe doit montrer ses plus beaux sourires ultra-bright !",
  "Faites une pyramide humaine improvisée (sans rien casser !)",
  "Un invité fait l'avion, les autres font les spectateurs ébahis !",
  "Tout le monde doit envoyer un énorme bisou volant vers l'objectif !",
  "Faites semblant de dévorer un gâteau géant imaginaire !",
  "Tout le monde doit se toucher le bout du nez !",
  "Faites une pose de danse disco tout droit venue des années 80 !",
  "Le groupe doit pointer le ciel du doigt tous ensemble !",
  "Tout le monde doit faire des cornes de rockeur avec les doigts !",
  "Faites semblant d'être coincés dans une boîte invisible trop petite !",
  "Le groupe se met en cercle serré et se regarde intensément !",
  "Faites une pose de karatéka prêt à frapper !",
  "Tout le monde doit faire un pouce levé de validation !",
  "Imitez des animaux de la jungle en délire !",
  "Le groupe doit faire semblant de courir à toute vitesse sur place !",
  "Faites une pose de détective qui cherche un indice louche !",
  "Tout le monde doit se tirer les oreilles en grimaçant !",
  "Faites semblant de porter un objet extrêmement lourd qui pèse des tonnes !",
  "Un invité doit porter un autre invité sur son dos ou ses épaules !",
  "Tout le monde fait une grimace en plaçant ses doigts sur ses joues !",
  "Faites une pose de plongeur professionnel sur le point de sauter !",
  "Le groupe doit regarder fixement vers la droite d'un air intrigué !",
  "Faites une tête de premier de la classe bien sage !",
  "Tout le monde fait une tête de méchant de dessin animé !",
  "Le groupe entier fait semblant de dormir debout !",
  "Faites une mine boudeuse de bébé capricieux !",
  "Tout le monde retient sa respiration en gonflant les joues au maximum !",
  "Faites un regard ténébreux de star de cinéma dramatique !",
  "Le groupe simule une peur bleue en se protégeant la tête !",
  "Tout le monde fait un signe de paix (V avec les doigts) lumineux !",
  "Imitez une équipe de football qui vient de marquer en finale !",
  "Faites semblant de jouer aux marionnettes désarticulées !",
  "Le groupe pointe l'objectif du doigt avec autorité !",
  "Tout le monde fait une moue de poisson (duckface exagérée) !",
  "Faites semblant de tenir une conversation ultra secoue-tête !",
  "Le groupe simule un vent glacial en frissonnant de tous ses membres !",
  "Tout le monde lève les mains en l'air en mode 'je m'rends' !",
  "Faites une pose de bodybuilder fier de ses muscles !",
  "Le groupe entier se penche à gauche d'un seul bloc !",
  "Le groupe entier se penche à droite d'un seul bloc !",
  "Faites une tête de savant fou en train de créer une potion magique !",
  "Tout le monde fait un grand sourire forcé et ultra rigide !",
  "Imitez un groupe de touristes éblouis par un monument !",
  "Faites semblant de jouer d'un instrument de musique farfelu (trompette, harpe...)",
  "Tout le monde croise les bras d'un air très mécontent !",
  "Faites semblant de recevoir un énorme coup de vent dans la figure !",
  "Le groupe entier fait une révérence royale de courtoisie !",
  "Tout le monde tire une tête de vaincu fatigué !",
  "Faites une pose d'explorateur perdu dans la jungle avec une loupe invisible !",
  "Le groupe fait un 'High Five' géant vers le centre !",
  "Tout le monde fait semblant d'avoir un fou rire silencieux !",
  "Faites une pose de majorette ou de pom-pom boy en délire !",
  "Imitez des robots en panne de batterie",
  "Le groupe entier fait une grimace asymétrique !",
  "Tout le monde fait semblant de porter des lunettes de soleil de stars !",
  "Faites une pose de flamant rose sur un seul pied (attention à l'équilibre !)",
  "Le groupe entier montre ses muscles avec un air rigolo !",
  "Faites semblant d'être aspirés par un trou noir sur le côté !",
  "Tout le monde fait une tête de paparazzi en train de prendre une photo !",
  "Imitez des chefs cuisiniers en train de goûter un plat trop pimenté !",
  "Le groupe entier fait une ola de joie !",
  "Faites semblant de retenir le plafond qui s'effondre tous ensemble !",
  "Tout le monde fait un clin d'œil avec les deux yeux alternativement !",
  "Faites une pose de défilé militaire complètement loufoque !",
  "Le groupe simule une discussion passionnée sur un sujet invisible !",
  "Tout le monde fait une moue boudeuse trop mignonne !",
  "Faites semblant de jouer au tir à la corde en deux camps !",
  "Imitez des passants surpris par une averse soudaine !",
  "Le groupe entier se cache les yeux, la bouche et les oreilles (les 3 singes sages) !",
  "Faites une pose de torero face à un taureau imaginaire !",
  "Tout le monde fait un sourire de grand timide !",
  "Faites semblant de pousser un mur invisible qui avance vers vous !",
  "Le groupe entier lève son verre imaginaire pour un toast endiablé !",
  "Imitez des skieurs en pleine descente de slalom géant !",
  "Faites une tête de personne qui vient de comprendre une blague nulle !",
  "Tout le monde fait un geste de silence (chut !) très expressif !",
  "Faites une pose de disc-jockey en train de mixer sur des platines !",
  "Le groupe entier fait un signe de ralliement secret de pirates !",
  "Faites semblant d'être des extraterrestres découvrant la Terre !",
  "Tout le monde fait une mine dégoûtée devant un plat immangeable !",
  "Imitez des boxeurs sur un ring prêts à en découdre !",
  "Le groupe entier fait un grand signe de la main pour dire au revoir !",
  "Faites une pose de pianiste virtuose en plein solo enflammé !",
  "Tout le monde fait une tête de zombie affamé de sucreries !",
  "Faites semblant de regarder par le hublot d'un vaisseau spatial !",
  "Le groupe entier fait un sourire ultra bright en montrant toutes ses dents !",
  "Imitez des coureurs du 100 mètres sur la ligne de départ !",
  "Faites une pose de magicien faisant apparaître un lapin !",
  "Tout le monde fait une mine interrogative avec un point d'interrogation imaginaire au-dessus de la tête !",
  "Faites semblant de recevoir un flash de projecteur dans les yeux !",
  "Le groupe entier se met en position de garde-corps protecteur !",
  "Imitez des surfeurs attendant la plus grosse vague de l'été !",
  "Faites une tête de personne très concentrée sur un jeu vidéo difficile !",
  "Tout le monde fait un grand signe de victoire avec les deux mains !",
  "Faites semblant de marcher sur la Lune en apesanteur totale !",
  "Le groupe entier fait une grimace avec les sourcils froncés au maximum !",
  "Imitez des agents secrets en mission ultra confidentielle !",
  "Faites une pose de grand penseur (style Le Penseur de Rodin) !",
  "Tout le monde fait un sourire ultra narquois !",
  "Faites semblant de frimer avec une voiture de sport imaginaire !",
  "Le groupe entier fait un signe de cœur avec les bras au-dessus de la tête !",
  "Imitez des supporters de foot en train de chanter à s'en rompre les cordes vocales !",
  "Faites une tête de personne qui découvre un magnifique cadeau !",
  "Tout le monde fait une mine boudeuse de chaton triste !",
  "Faites semblant de diriger un orchestre symphonique grandiose !",
  "Le groupe entier fait un grand cri de soulagement collectif !",
  "Imitez des touristes perdus avec une carte à l'envers !",
  "Faites une pose de cascadeur prêt à faire une folie !",
  "Tout le monde fait un clin d'œil doublé d'un sourire malicieux !",
  "Faites semblant de respirer l'odeur d'une fleur merveilleuse !",
  "Le groupe entier fait un geste d'encouragement dynamique !",
  "Imitez des marins luttant contre une tempête en mer agitée !",
  "Faites une tête de personne surprise par une bonne nouvelle inattendue !",
  "Tout le monde fait une moue boudeuse de gourmand privé de dessert !",
  "Faites semblant de tenir un parapluie sous une pluie battante !",
  "Le groupe entier fait un signe de 'cool' avec le pouce et l'auriculaire !",
  "Imitez des fashionistas analysant une tenue ridicule !",
  "Faites une pose de portier de grand palace très strict !",
  "Tout le monde fait un sourire forcé de photo de classe obligatoire !",
  "Faites semblant de vous réveiller après une nuit très courte !",
  "Le groupe entier fait un geste d'applaudissements chaleureux !",
  "Imitez des pingouins sur la banquise glissante !",
  "Faites une tête de personne qui a oublié quelque chose d'important !",
  "Tout le monde fait un signe de tête complice et mystérieux !",
  "Faites semblant de jouer au bowling et de faire un strike parfait !",
  "Le groupe entier fait un geste de 'stop' avec la paume de la main !",
  "Imitez des détectives privés observant un suspect à la jumelle !",
  "Faites une pose de star sur un tapis rouge sous les flashs !",
  "Tout le monde fait un sourire ultra éclatant de pub pour dentifrice !",
  "Faites semblant de porter un sac à dos beaucoup trop lourd !",
  "Le groupe entier fait un signe de salut romain ou royal décalé !",
  "Imitez des astronautes dans une capsule spatiale en secousse !",
  "Faites une tête de personne qui attend un bus qui ne vient jamais !",
  "Tout le monde fait une moue boudeuse de chef d'orchestre contrarié !",
  "Faites semblant de faire du hula-hoop avec énergie !",
  "Le groupe entier fait un geste de victoire les poings serrés !",
  "Imitez des personnages de jeux vidéo pixélisés en train de sauter !",
  "Faites une pose de dandy chic avec une canne imaginaire !",
  "Tout le monde fait un clin d'œil théâtral et exagéré !",
  "Faites semblant de soulever un trophée de champion du monde !",
  "Le groupe entier fait un signe de main amical et souriant !",
  "Imitez des chats qui s'étirent paresseusement au soleil !",
  "Faites une tête de personne qui regarde un tour de magie fascinant !",
  "Tout le monde fait un sourire radieux de premier jour de vacances !",
  "Faites semblant de jouer de la batterie dans un concert de rock !",
  "Le groupe entier fait un geste d'étonnement les mains sur les joues !",
  "Imitez des coureurs cyclistes en pleine échappée en montagne !",
  "Faites une pose de modèle photo allongé sur un canapé imaginaire !",
  "Tout le monde fait une mine boudeuse adorable et irrésistible !",
  "Faites semblant de faire du saut à l'élastique en hurlant de rire !",
  "Le groupe entier fait un signe de paix avec les deux mains levées !",
  "Imitez des personnages de western prêts à dégainer !",
  "Faites une tête de personne qui écoute la meilleure blague de sa vie !",
  "Tout le monde fait un sourire mystérieux de Joconde !",
  "Faites semblant de porter une couronne royale un peu trop lourde !",
  "Le groupe entier fait un geste de complicité absolue !",
  "Imitez des plongeurs sous-marins qui font signe que tout va bien (OK) !",
  "Faites une pose de gardien de but prêt à arrêter un penalty décisif !"
];

export default function PhotoboothPage({ params }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;

  const videoRef = useRef(null);

  const [darkMode, setDarkMode] = useState(true);
  const [step, setStep] = useState("live");
  const [flash, setFlash] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [eventData, setEventData] = useState(null);

  const [selectedFrameNumber, setSelectedFrameNumber] = useState(1);
  const [frameUrl, setFrameUrl] = useState(null);
  const [frameUrls, setFrameUrls] = useState([]);
  const [showFrameSelector, setShowFrameSelector] = useState(false);

  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [challengeTimer, setChallengeTimer] = useState(null);

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

  const startChallengeProcess = () => {
    const randomIndex = Math.floor(Math.random() * FUN_CHALLENGES.length);
    setCurrentChallenge(FUN_CHALLENGES[randomIndex]);

    let timeLeft = 15;
    setChallengeTimer(timeLeft);

    const timer = setInterval(() => {
      timeLeft -= 1;

      if (timeLeft > 0) {
        setChallengeTimer(timeLeft);
      } else {
        clearInterval(timer);
        setChallengeTimer(null);
        setCurrentChallenge(null);
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

        setStep("captured");

        setTimeout(() => {
          setStep("email-choice");
        }, 2500);

      } catch (error) {
        console.error("Erreur upload:", error);
      }
    }, "image/jpeg");
  };

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

  const resetPhotobooth = () => {
    setCapturedPhotoUrl(null);
    setEmailInput("");
    setIsSendingEmail(false);
    setStep("live");
  };

  return (
    <main className={`fixed inset-0 flex flex-col items-center justify-center font-sans overflow-hidden transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#0f071e] text-slate-100 selection:bg-orange-500 selection:text-white' 
        : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      
      {/* BOUTON SWITCH MODE CLAIR / SOMBRE (FIXÉ EN HAUT À DROITE) */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 z-[10000] flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md border cursor-pointer ${
          darkMode 
            ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
            : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
        }`}
        aria-label="Changer le mode d'affichage"
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
      </button>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 ${step !== 'live' && countdown === null && challengeTimer === null ? 'hidden' : ''}`}
      />

      {/* OVERLAY MODE CLAIR POUR LISIBILITÉ DU FLUX VIDÉO SI NÉCESSAIRE */}
      {!darkMode && step === 'live' && countdown === null && challengeTimer === null && (
        <div className="absolute inset-0 bg-slate-200/10 pointer-events-none z-0" />
      )}

      {frameUrl && step === 'live' && (
        <img
          key={frameUrl}
          src={frameUrl}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
          alt="Cadre"
        />
      )}

      {step === 'captured' && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md animate-in zoom-in duration-300 ${
          darkMode ? 'bg-[#0f071e]/90' : 'bg-[#f4f4f6]/90'
        }`}>
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-1 rounded-[36px] shadow-[0_0_50px_rgba(249,115,22,0.4)]">
            <div className={`border p-10 rounded-[34px] text-center ${
              darkMode ? 'bg-[#170c2c]/95 border-white/10 text-white' : 'bg-[#eaeaea]/95 border-slate-300 text-slate-900'
            }`}>
              <h2 className="text-4xl font-black italic uppercase tracking-tight mb-2 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                ✨ C&apos;est dans la boîte !
              </h2>
              <p className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-orange-200/80' : 'text-orange-700'}`}>Préparation des options...</p>
            </div>
          </div>
        </div>
      )}

      {step === 'email-choice' && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md p-6 animate-in fade-in ${
          darkMode ? 'bg-[#0f071e]/90' : 'bg-[#f4f4f6]/90'
        }`}>
          <div className={`w-full max-w-md border p-8 rounded-[40px] text-center shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl ${
            darkMode ? 'bg-[#170c2c]/90 border-white/15 text-white' : 'bg-[#eaeaea]/95 border-slate-300 text-slate-900'
          }`}>
            {capturedPhotoUrl && (
              <img src={capturedPhotoUrl} alt="Aperçu" className={`w-full rounded-2xl mb-6 object-cover aspect-video shadow-lg border ${darkMode ? 'border-white/10' : 'border-slate-300'}`} />
            )}
            <h3 className={`text-2xl font-black italic uppercase mb-6 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Voulez-vous recevoir une copie par mail ?
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStep('email-input')}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all cursor-pointer border border-orange-400/30 active:scale-95"
              >
                Oui
              </button>
              <button
                type="button"
                onClick={resetPhotobooth}
                className={`py-4 rounded-2xl font-black uppercase text-xs tracking-widest border transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
                  darkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/15' : 'bg-[#dedede] hover:bg-[#d4d4d4] text-slate-800 border-slate-300'
                }`}
              >
                Non
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'email-input' && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md p-6 animate-in fade-in ${
          darkMode ? 'bg-[#0f071e]/90' : 'bg-[#f4f4f6]/90'
        }`}>
          <div className={`w-full max-w-md border p-8 rounded-[40px] shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl ${
            darkMode ? 'bg-[#170c2c]/90 border-white/15 text-white' : 'bg-[#eaeaea]/95 border-slate-300 text-slate-900'
          }`}>
            <h3 className={`text-2xl font-black italic uppercase mb-2 tracking-tight text-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Votre adresse mail
            </h3>
            <p className={`text-[10px] font-black uppercase tracking-widest text-center mb-6 ${darkMode ? 'text-orange-200/80' : 'text-orange-700'}`}>Pour recevoir votre souvenir photo</p>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  autoFocus
                  className={`w-full p-4 rounded-2xl text-xs font-bold outline-none transition-all border ${
                    darkMode 
                      ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-orange-500' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-orange-500'
                  }`}
                />
                <Mail size={18} className="absolute right-4 top-4 text-orange-400" />
              </div>

              <button
                type="submit"
                disabled={isSendingEmail}
                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer border border-orange-400/30 active:scale-95 disabled:opacity-50"
              >
                {isSendingEmail ? "Envoi en cours..." : <>Valider l&apos;envoi <ArrowRight size={16} /></>}
              </button>

              <button
                type="button"
                onClick={resetPhotobooth}
                className={`w-full py-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  darkMode ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Annuler / Recommencer
              </button>
            </form>
          </div>
        </div>
      )}

      {step === 'sent' && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md text-center animate-in zoom-in duration-300 ${
          darkMode ? 'bg-[#0f071e]/90' : 'bg-[#f4f4f6]/90'
        }`}>
          <div className={`border p-10 rounded-[40px] max-w-md w-full mx-4 shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl ${
            darkMode ? 'bg-[#170c2c]/90 border-white/15 text-white' : 'bg-[#eaeaea]/95 border-slate-300 text-slate-900'
          }`}>
            <div className="inline-flex p-4 bg-emerald-500/20 text-emerald-400 rounded-full mb-4 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={48} />
            </div>
            <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              E-mail bien envoyé !
            </h3>
            <p className={`text-xs font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-orange-200/80' : 'text-orange-700'}`}>
              Pensez à vérifier vos spams si vous ne le recevez pas.
            </p>
            <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-white/40' : 'text-slate-500'}`}>
              Retour automatique au photobooth...
            </p>
          </div>
        </div>
      )}

      {step === 'live' && (
        <>
          <div className="absolute bottom-10 left-4 z-[9999] pointer-events-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFrameSelector(!showFrameSelector)}
              className={`flex items-center gap-2 rounded-full px-4 py-3 text-sm font-black uppercase tracking-wider backdrop-blur-xl transition-all cursor-pointer shadow-xl active:scale-95 border ${
                darkMode 
                  ? 'bg-white/10 hover:bg-white/25 text-white border-white/20 hover:border-orange-400' 
                  : 'bg-[#eaeaea] hover:bg-[#dedede] text-slate-800 border-slate-300 hover:border-orange-500'
              }`}
            >
              <Images size={20} className="text-orange-500" />
              Cadres
            </button>
          </div>

          {showFrameSelector && (
            <div className="absolute bottom-28 left-0 right-0 z-[9999] pointer-events-auto px-4">
              <div className={`mx-auto flex max-w-[720px] gap-2 overflow-x-auto rounded-full px-4 py-3 backdrop-blur-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${
                darkMode ? 'bg-[#170c2c]/95 border-white/20' : 'bg-[#eaeaea]/95 border-slate-300'
              }`}>
                {frameUrls.map((frame) => (
                  <button
                    key={frame.number}
                    type="button"
                    onClick={() => {
                      setSelectedFrameNumber(frame.number);
                      setShowFrameSelector(false);
                    }}
                    className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 transition-transform cursor-pointer ${
                      selectedFrameNumber === frame.number
                        ? "scale-110 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.6)]"
                        : darkMode ? "border-white/30 hover:border-white/60" : "border-slate-300 hover:border-slate-500"
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

      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-40 text-[200px] font-black italic bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent animate-pulse drop-shadow-[0_0_50px_rgba(249,115,22,0.8)]">
          {countdown}
        </div>
      )}

      {challengeTimer !== null && currentChallenge && (
        <div className="absolute top-12 inset-x-4 z-40 flex flex-col items-center pointer-events-none">
          <div className={`border-2 border-amber-400 px-8 py-6 rounded-[35px] max-w-xl w-full text-center shadow-[0_0_50px_rgba(251,191,36,0.5)] backdrop-blur-2xl animate-in zoom-in duration-200 ${
            darkMode ? 'bg-[#170c2c]/95' : 'bg-[#eaeaea]/95'
          }`}>
            <div className="flex items-center justify-center gap-2 text-amber-300 text-xs font-black uppercase tracking-widest mb-2">
              <Shuffle size={16} className="animate-spin text-orange-400" /> Défi Flash en cours ({challengeTimer}s)
            </div>
            <h3 className={`text-2xl md:text-3xl font-black italic uppercase tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {currentChallenge}
            </h3>
          </div>
        </div>
      )}

      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      {step === 'live' && countdown === null && challengeTimer === null && (
        <div className="absolute bottom-10 w-full flex justify-center items-center gap-6 z-40">
          <button
            type="button"
            onClick={() => window.history.back()}
            className={`p-4 border backdrop-blur-xl rounded-full transition-all cursor-pointer shadow-lg active:scale-95 ${
              darkMode ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' : 'bg-[#eaeaea] hover:bg-[#dedede] border-slate-300 text-slate-800'
            }`}
          >
            <X size={24} />
          </button>

          <button
            type="button"
            onClick={startChallengeProcess}
            className="flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 rounded-full border-2 border-amber-300 hover:scale-105 shadow-[0_0_25px_rgba(245,158,11,0.6)] transition-all cursor-pointer text-white"
            aria-label="Lancer un défi aléatoire"
          >
            <Shuffle size={20} className="stroke-[2.5]" />
            <span className="text-[9px] font-black uppercase tracking-tighter">Défi</span>
          </button>

          <button
            type="button"
            onClick={startPhotoProcess}
            className="w-20 h-20 bg-white rounded-full border-4 border-orange-500 hover:scale-105 shadow-[0_0_35px_rgba(249,115,22,0.8)] transition-transform cursor-pointer"
            aria-label="Prendre une photo"
          />

          <button
            type="button"
            onClick={toggleFullScreen}
            className={`p-4 border backdrop-blur-xl rounded-full transition-all cursor-pointer shadow-lg active:scale-95 ${
              darkMode ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' : 'bg-[#eaeaea] hover:bg-[#dedede] border-slate-300 text-slate-800'
            }`}
          >
            <Maximize2 size={24} />
          </button>
        </div>
      )}
    </main>
  );
}