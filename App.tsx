
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, AppView, MonthlyPlan, WorkoutLog } from './types';
import { getMotivationalQuote, generateMonthlyPlan } from './services/geminiService';
import { DumbbellIcon, CheckCircleIcon, PlayIcon, CalendarIcon, FlameIcon, WhatsAppIcon, UploadIcon } from './components/Icons';

// Constants
const STORAGE_USER_KEY = 'ironpath_user';
const STORAGE_PLAN_KEY = 'ironpath_monthly_plan';
const PIX_KEY = "basecalistenia@gmail.com";
const CONTACT_PHONE = "5566981182564";

const WhatsAppButton = () => (
  <a 
    href={`https://wa.me/${CONTACT_PHONE}?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20o%20BaseCalistenia`}
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-500 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center animate-fade-in border-2 border-green-400/30 group"
    title="Fale conosco no WhatsApp"
  >
    <span className="absolute right-full mr-3 bg-white text-black text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
      Fale Conosco
    </span>
    <span className="absolute inset-0 rounded-full border-2 border-green-400 opacity-75 animate-ping"></span>
    <WhatsAppIcon className="w-6 h-6 relative z-10" />
  </a>
);

// --- Video Player Component (Robust CDN-Style) ---
const VideoPlayer = ({ url, title }: { url: string; title: string }) => {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset error state when URL changes
  useEffect(() => {
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [url]);

  if (!url) {
    return (
      <div className="w-full aspect-video bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 group">
        <PlayIcon className="w-20 h-20 text-slate-700 mb-6 group-hover:text-primary transition-colors" />
        <p className="text-slate-400 font-medium text-lg">
          Nenhum vídeo configurado.
        </p>
      </div>
    );
  }

  // --- Logic Helpers ---

  // 1. YouTube Parser
  const getYoutubeEmbedId = (link: string) => {
    if (!link) return null;
    const cleanUrl = link.trim();
    const match = cleanUrl.match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  // 2. Direct File Detection (CDN/Local/MP4)
  const isDirectMediaFile = (link: string) => {
    return link.startsWith('blob:') || !!link.match(/\.(mp4|webm|ogg|mov|m4v)($|\?)/i);
  };

  // 3. Google Drive ID Extractor
  const getGoogleDriveId = (link: string) => {
    return link.match(/\/d\/([^/]+)/)?.[1];
  };

  // --- Source Detection ---
  const youtubeId = getYoutubeEmbedId(url);
  const driveId = getGoogleDriveId(url);
  
  const isYouTube = !!youtubeId;
  const isVimeo = url.includes('vimeo.com');
  const isOneDrive = url.includes('sharepoint.com') || url.includes('1drv.ms');
  const isGoogleDrive = !!driveId; // Can be direct or embed
  
  // CDN Strategy: Prioritize native <video> tag for Drive and Files
  // If native fails (onError), fallback to Iframe.
  const shouldUseNativePlayer = (isDirectMediaFile(url) || isGoogleDrive) && !hasError;

  // --- URL Normalizers ---
  
  const getDirectStreamUrl = (link: string) => {
    if (isGoogleDrive && driveId) {
       // Tenta stream direto (bypass iframe blocks)
       return `https://drive.google.com/uc?export=download&id=${driveId}`;
    }
    return link;
  };

  const getEmbedUrl = (link: string) => {
    if (isYouTube) return `https://www.youtube.com/embed/${youtubeId}`;
    
    if (isVimeo) {
       const vimeoId = link.match(/vimeo\.com\/(\d+)/)?.[1];
       if (vimeoId && !link.includes('player.vimeo.com')) return `https://player.vimeo.com/video/${vimeoId}`;
    }

    if (isGoogleDrive && driveId) {
        // Fallback para o modo Preview oficial se o download direto falhar
        return `https://drive.google.com/file/d/${driveId}/preview`;
    }

    if (isOneDrive && link.includes('/v/')) {
        return link.replace('/v/', '/embed/');
    }

    return link;
  };

  return (
    <div className="space-y-4">
      {/* Main Player Container */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative group z-0 flex items-center justify-center">
        
        {isYouTube ? (
          // YouTube is always reliable via Iframe
          <iframe 
            key={youtubeId}
            width="100%" 
            height="100%" 
            src={`https://www.youtube.com/embed/${youtubeId}`} 
            title={title}
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : isVimeo ? (
          // Vimeo
          <iframe 
            src={getEmbedUrl(url)}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            title={title}
          />
        ) : shouldUseNativePlayer ? (
          // Native Player (CDN Style) - Preferred for Drive/Files
          <video 
            ref={videoRef}
            key={`native-${url}`}
            src={getDirectStreamUrl(url)}
            controls 
            className="w-full h-full object-contain bg-black"
            controlsList="nodownload"
            playsInline
            onError={() => {
                // IMPORTANT: Do NOT log the event object 'e' here to avoid circular JSON errors
                console.warn("Native playback failed, switching to fallback iframe");
                setHasError(true); // Triggers re-render to use iframe fallback
            }}
          >
            Seu navegador não suporta a tag de vídeo.
          </video>
        ) : (
          // Universal Fallback Iframe (Embed Mode)
          <iframe 
            key={`embed-${url}`}
            src={getEmbedUrl(url)}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; encrypted-media"
            title={title}
          />
        )}
      </div>
    </div>
  );
};

const App = () => {
  // Default to LANDING view initially
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [quote, setQuote] = useState<string>("");
  
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlan | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  
  // Active Day State (Default to Day 1 when entering a module)
  const [activeDayNumber, setActiveDayNumber] = useState<number>(1);

  // --- Initialization & Auth Check ---
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_USER_KEY);
    const savedPlan = localStorage.getItem(STORAGE_PLAN_KEY);

    if (savedPlan && savedPlan !== "undefined") {
      try {
        setMonthlyPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error("Failed to parse plan", e);
      }
    }

    if (savedUser && savedUser !== "undefined") {
      try {
        const parsedUser: UserProfile = JSON.parse(savedUser);
        // Ensure history exists for older saved users
        if (!parsedUser.history) parsedUser.history = [];
        setUser(parsedUser);
        // If user exists, go straight to dashboard
        setView(AppView.DASHBOARD);
        loadDashboardData();
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    } else {
      setView(AppView.LANDING);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    const q = await getMotivationalQuote();
    setQuote(q);
  }, []);

  // --- Actions ---

  const handleShareApp = async () => {
    const url = "https://bsde-caslistenia.vercel.app/";
    const title = "BaseCalistenia - Treinos em Casa";
    const text = "Estou treinando com o BaseCalistenia! 4 semanas de treinos gratuitos.";

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copiado para a área de transferência!");
    }
  };

  const handleStartAnonymous = async (goal: string) => {
    const newUser: UserProfile = {
      username: "Atleta",
      goal,
      level: 'intermediate',
      joinedAt: Date.now(),
      history: []
    };
    
    const plan = await generateMonthlyPlan(newUser);
    
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(STORAGE_PLAN_KEY, JSON.stringify(plan));
    
    setUser(newUser);
    setMonthlyPlan(plan);
    setView(AppView.DASHBOARD);
    loadDashboardData();
  };

  const handleResetApp = () => {
      if (confirm("Isso apagará seu progresso e atualizará os treinos. Deseja continuar?")) {
          localStorage.removeItem(STORAGE_USER_KEY);
          localStorage.removeItem(STORAGE_PLAN_KEY);
          // Hard reload to clear potential cache issues
          window.location.href = window.location.href;
      }
  };

  const handleToggleComplete = (weekNum: number, dayNum: number) => {
    if (!monthlyPlan || !user) return;

    let dayTitle = "";

    const updatedWeeks = monthlyPlan.weeks.map(week => {
        if (week.weekNumber !== weekNum) return week;
        return {
            ...week,
            days: week.days.map(day => {
                if (day.dayNumber !== dayNum) return day;
                if (!day.completed) dayTitle = day.title;
                return { ...day, completed: !day.completed };
            })
        };
    });

    const updatedPlan = { ...monthlyPlan, weeks: updatedWeeks };
    setMonthlyPlan(updatedPlan);
    localStorage.setItem(STORAGE_PLAN_KEY, JSON.stringify(updatedPlan));

    if (dayTitle) {
      const newLog: WorkoutLog = {
        timestamp: Date.now(),
        lessonTitle: dayTitle,
        weekNumber: weekNum,
        dayNumber: dayNum
      };

      const updatedHistory = [newLog, ...user.history];
      const updatedUser = { ...user, history: updatedHistory };
      
      setUser(updatedUser);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --- Views ---

  if (view === AppView.LANDING) {
      return (
          <>
            <LandingPage onStart={handleStartAnonymous} />
            <WhatsAppButton />
          </>
      )
  }

  if (view === AppView.DONATION) {
    return (
        <>
            <DonationScreen onBack={() => setView(AppView.DASHBOARD)} />
            <WhatsAppButton />
        </>
    );
  }

  const currentWeek = monthlyPlan?.weeks.find(w => w.weekNumber === selectedWeekId);
  const currentDay = currentWeek?.days.find(d => d.dayNumber === activeDayNumber);
  
  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans pb-10">
      <WhatsAppButton />

      {selectedWeekId === null && (
          <header className="bg-black pt-10 pb-6 text-center px-4 animate-fade-in relative">
            <div className="absolute top-4 right-4 md:right-8 flex gap-2">
                <button 
                    onClick={handleShareApp}
                    className="bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all px-4 py-2 rounded-full text-xs font-black uppercase flex items-center gap-2"
                >
                    <span>📤</span> <span className="hidden md:inline">Compartilhar</span>
                </button>
                <button 
                    onClick={() => setView(AppView.DONATION)}
                    className="bg-slate-900 border border-primary/30 text-primary hover:bg-primary hover:text-black transition-all px-4 py-2 rounded-full text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-primary/10"
                >
                    <span>❤️</span> <span className="hidden md:inline">Apoiar</span>
                </button>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
                Base<span className="text-primary">Calistenia</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base mb-2">
                +4 semanas de treinos. Acesso 100% gratuito.
            </p>
          </header>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        
        {monthlyPlan && selectedWeekId === null && (
            <>
              {/* Donation/Receipt Banner */}
              <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-primary/30 rounded-2xl p-6 md:p-8 mb-10 relative overflow-hidden group shadow-2xl animate-fade-in">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                      <div className="space-y-2 max-w-xl">
                          <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">
                              Gostando do <span className="text-primary">Projeto?</span>
                          </h2>
                          <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
                              Este app é mantido 100% por doações. Se você está tendo resultados, contribua com o <strong className="text-white">valor que achar justo</strong> (sugestão: R$ 19,90).
                          </p>
                          
                          <div className="bg-black/40 border border-primary/20 p-3 rounded-lg mt-3">
                              <p className="text-primary text-xs md:text-sm font-bold flex gap-2 items-start justify-center md:justify-start">
                                  <span className="text-base">🎁</span>
                                  <span>Quer ganhar um bônus exclusivo para te ajudar nos seus resultados? Mande o comprovante e receba!</span>
                              </p>
                          </div>
                      </div>

                      <div className="flex flex-col gap-3 w-full md:w-auto min-w-[240px]">
                          <button 
                              onClick={() => setView(AppView.DONATION)}
                              className="w-full bg-primary hover:bg-primaryHover text-black font-black uppercase py-4 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                          >
                              <span>❤️</span> Fazer Doação
                          </button>
                          
                          <a 
                              href={`https://wa.me/${CONTACT_PHONE}?text=Ol%C3%A1%2C%20segue%20meu%20comprovante%20de%20doa%C3%A7%C3%A3o%20para%20o%20BaseCalistenia%21`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold uppercase text-xs py-3 rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                          >
                              <WhatsAppIcon className="w-4 h-4 text-green-500" />
                              Enviar Comprovante
                          </a>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in mt-4">
                  {monthlyPlan.weeks.map((week) => (
                      <div 
                          key={week.weekNumber} 
                          onClick={() => {
                              setSelectedWeekId(week.weekNumber);
                              setActiveDayNumber(1); 
                          }}
                          className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl cursor-pointer hover:border-primary hover:transform hover:-translate-y-1 transition-all duration-300 group"
                      >
                          <div className="h-48 bg-slate-800 relative">
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                              <div className="absolute inset-0 flex flex-col items-center justify-center z-0 opacity-30">
                                  <span className="text-9xl font-black text-slate-700 select-none">{week.weekNumber}</span>
                              </div>
                              <div className="absolute bottom-4 left-4 right-4 z-20">
                                  <span className="text-primary font-bold uppercase text-xs tracking-[0.2em] mb-1 block">Semana {week.weekNumber}</span>
                                  <h3 className="text-3xl font-black text-white uppercase leading-none break-words">{week.focus}</h3>
                              </div>
                          </div>
                          <div className="p-4 bg-slate-900 flex items-center justify-between border-t border-slate-800">
                              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">7 Aulas</span>
                              <span className="bg-primary text-black text-[10px] font-black uppercase px-3 py-1 rounded">Acessar</span>
                          </div>
                      </div>
                  ))}
              </div>

              {user && user.history && user.history.length > 0 && (
                <div className="mt-16 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <CalendarIcon className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Histórico de Atividades</h2>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {user.history.map((log, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                                <CheckCircleIcon className="w-4 h-4" />
                             </div>
                             <div>
                               <p className="font-bold text-white text-sm">{log.lessonTitle}</p>
                               <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                 Semana {log.weekNumber} • Dia {log.dayNumber}
                               </p>
                             </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold">{formatDate(log.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Footer */}
              <div className="mt-20 border-t border-slate-800 pt-8 flex flex-col items-center justify-center gap-4 pb-8">
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                      v3.0 - Projeto criado por Khalliu para ajudar pessoas
                  </p>
                  <button 
                    onClick={handleResetApp}
                    className="text-xs text-slate-600 hover:text-red-500 transition-colors uppercase tracking-widest font-bold"
                  >
                    Resetar Dados do App
                  </button>
              </div>
            </>
        )}

        {monthlyPlan && selectedWeekId !== null && currentWeek && currentDay && (
            <div className="animate-fade-in">
                <button 
                    onClick={() => setSelectedWeekId(null)}
                    className="mb-8 text-slate-500 hover:text-white flex items-center gap-2 transition-colors font-bold uppercase text-xs tracking-widest"
                >
                    ← Voltar para Módulos
                </button>

                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                        Semana {currentWeek.weekNumber} – {currentWeek.focus}
                    </h1>
                    <p className="text-lg text-primary italic font-medium animate-fade-in">
                        "{quote || "O único treino ruim é aquele que não aconteceu."}"
                    </p>
                </div>

                <div className="max-w-5xl mx-auto mb-10">
                     <VideoPlayer url={currentDay.videoUrl} title={currentDay.title} />

                    <div className="bg-slate-900 border border-slate-800 rounded-b-xl p-6 flex flex-col items-center gap-6 mt-6">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                            Escolha o dia do treino
                        </h3>
                        <div className="flex flex-wrap justify-center gap-3 w-full">
                            {currentWeek.days.map((day) => (
                                <button
                                    key={day.dayNumber}
                                    onClick={() => setActiveDayNumber(day.dayNumber)}
                                    className={`py-3 px-6 rounded border transition-all flex items-center justify-center gap-2 font-black uppercase text-sm min-w-[110px] ${
                                        activeDayNumber === day.dayNumber 
                                        ? 'bg-primary text-black border-primary scale-105 shadow-lg shadow-primary/20' 
                                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-500'
                                    }`}
                                >
                                    {day.completed ? <CheckCircleIcon className="w-4 h-4"/> : <PlayIcon className="w-3 h-3"/>}
                                    Dia {day.dayNumber}
                                </button>
                            ))}
                        </div>
                    </div>

                     {/* Donation CTA - Replaces Admin Panel */}
                     <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/50 p-6 rounded-xl text-center shadow-xl">
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-slate-300 text-sm font-medium">
                                Gostou da aula? Este projeto é mantido por doações voluntárias. <br/>
                                Se este treino te ajudou, considere apoiar!
                            </p>
                            <button 
                                onClick={() => setView(AppView.DONATION)}
                                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-primary text-white hover:text-primary transition-all px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2"
                            >
                                <span>❤️</span> Fazer Doação
                            </button>
                        </div>
                     </div>

                     <div className="mt-6 flex justify-center">
                        <button 
                            onClick={() => handleToggleComplete(selectedWeekId!, activeDayNumber)}
                            className={`px-8 py-3 rounded font-black uppercase tracking-wider transition-all min-w-[200px] flex items-center justify-center gap-2 ${
                                currentDay.completed 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-primary text-black hover:bg-primaryHover'
                            }`}
                        >
                            {currentDay.completed ? <CheckCircleIcon className="w-5 h-5"/> : <DumbbellIcon className="w-5 h-5"/>}
                            {currentDay.completed ? 'Aula Concluída' : 'Concluir Aula'}
                        </button>
                     </div>
                </div>

            </div>
        )}
      </main>
    </div>
  );
};

// --- Sub-components ---

const LandingPage = ({ onStart }: { onStart: (goal: string) => void }) => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-black">
            {/* HERO SECTION */}
            <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                    <div className="space-y-4">
                         <span className="inline-block py-1 px-3 rounded-full bg-slate-900 border border-slate-700 text-xs font-bold uppercase tracking-widest text-primary animate-fade-in">
                            Método 100% Caseiro
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                            Defina seu corpo <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">
                                Sem Academia
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            O projeto definitivo para <strong>homens e mulheres</strong> que buscam emagrecimento e definição, mas têm <strong>pouco tempo</strong>.
                            Transforme seu corpo no conforto de casa usando apenas a Calistenia.
                        </p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl border border-slate-800 shadow-2xl max-w-2xl mx-auto">
                        <p className="text-white font-bold uppercase mb-6 tracking-widest text-sm">Qual é o seu objetivo?</p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <button 
                                onClick={() => onStart('Perda de Peso')}
                                className="flex-1 bg-transparent hover:bg-slate-800 border-2 border-slate-700 hover:border-primary text-white hover:text-primary font-black uppercase px-6 py-5 rounded-xl transition-all group"
                            >
                                <span className="block text-2xl mb-1">🔥</span>
                                <span className="text-sm tracking-wider">Quero Emagrecer</span>
                            </button>
                            <button 
                                onClick={() => onStart('Ganho de Massa')}
                                className="flex-1 bg-primary hover:bg-yellow-400 border-2 border-primary hover:border-yellow-400 text-black font-black uppercase px-6 py-5 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all transform hover:-translate-y-1"
                            >
                                <span className="block text-2xl mb-1">💪</span>
                                <span className="text-sm tracking-wider">Ganhar Massa</span>
                            </button>
                        </div>
                    </div>

                    {/* Donation Explanation */}
                    <div className="mt-8 pt-8 border-t border-slate-800/50 max-w-lg mx-auto">
                        <h3 className="text-white font-bold uppercase mb-2 flex items-center justify-center gap-2">
                            <span>❤️</span> Projeto Mantido por Você
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Nosso objetivo é ajudar pessoas. O acesso é totalmente gratuito. 
                            Se você tiver resultados e gostar, pode fazer uma <strong>doação voluntária</strong> para manter o projeto no ar.
                        </p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                            Projeto criado por Khalliu para ajudar pessoas
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Features Section */}
             <div className="py-20 bg-slate-900/50 border-t border-slate-900">
                <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
                    <div className="p-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FlameIcon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-white font-bold uppercase mb-2">Queima de Gordura</h3>
                        <p className="text-slate-500 text-sm">Treinos metabólicos curtos projetados para ativar a queima de gordura em repouso.</p>
                    </div>
                    <div className="p-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DumbbellIcon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-white font-bold uppercase mb-2">Definição Muscular</h3>
                        <p className="text-slate-500 text-sm">Use o peso do seu corpo para esculpir músculos densos e definidos sem equipamentos.</p>
                    </div>
                    <div className="p-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-white font-bold uppercase mb-2">Praticidade Total</h3>
                        <p className="text-slate-500 text-sm">Ideal para quem tem a rotina corrida. Treine em qualquer lugar, a qualquer hora.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DonationScreen = ({ onBack }: { onBack: () => void }) => {
    const handleCopyPix = () => {
        navigator.clipboard.writeText(PIX_KEY);
        alert(`Chave PIX copiada: ${PIX_KEY}`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 to-black pointer-events-none"></div>
            
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center relative z-10 shadow-2xl">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <span className="text-3xl">❤️</span>
                </div>
                
                <h2 className="text-3xl font-black text-white uppercase mb-4">Apoie o Projeto</h2>
                
                <div className="space-y-4 text-slate-400 mb-8 leading-relaxed">
                    <p>
                        O <strong>BaseCalistenia</strong> foi criado para levar saúde e autoestima para todos, gratuitamente.
                    </p>
                    <p>
                        Não temos investidores nem cobramos mensalidade. Se este projeto te ajudou a ter resultados, considere fazer uma doação para manter os servidores e atualizações.
                    </p>
                </div>

                <div className="bg-black border border-primary/30 p-6 rounded-xl mb-6">
                    <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">Valor Sugerido</p>
                    <p className="text-4xl font-black text-white">R$ 19,90</p>
                    <p className="text-xs text-slate-400 mt-2">Mas você decide! Doe o valor que achar justo.</p>
                </div>

                {/* BONUS BOX */}
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-900/20 to-transparent border border-yellow-600/30 text-left">
                    <p className="text-yellow-400 font-bold text-sm mb-1 flex items-center gap-2">
                        <span>🎁</span> Bônus Exclusivo
                    </p>
                    <p className="text-slate-300 text-xs">
                        Quer ganhar um bônus exclusivo para te ajudar nos seus resultados? <br/>
                        <strong>Me mande o comprovante de doação</strong> e receba seu presente!
                    </p>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={handleCopyPix}
                        className="block w-full bg-green-600 hover:bg-green-500 text-white font-black uppercase py-4 rounded-lg shadow-lg shadow-green-500/20 transition-all active:scale-95"
                    >
                        Fazer Doação (Copiar PIX)
                    </button>
                    <p className="text-[10px] text-slate-500 font-mono select-all">
                        Chave: {PIX_KEY}
                    </p>

                    {/* NEW SEND RECEIPT BUTTON IN DONATION SCREEN */}
                    <a 
                        href={`https://wa.me/${CONTACT_PHONE}?text=Ol%C3%A1%2C%20segue%20meu%20comprovante%20de%20doa%C3%A7%C3%A3o%20para%20o%20BaseCalistenia%21`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold uppercase text-xs py-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                    >
                        <WhatsAppIcon className="w-4 h-4 text-green-500" />
                        Enviar Comprovante
                    </a>
                    
                    <button 
                        onClick={onBack}
                        className="block w-full text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest py-4 mt-2"
                    >
                        Agora não, voltar aos treinos
                    </button>
                </div>

                <div className="mt-8 border-t border-slate-800 pt-4">
                     <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        Projeto criado por Khalliu para ajudar pessoas
                     </p>
                </div>
            </div>
        </div>
    );
};

export default App;
