import { UserProfile, MonthlyPlan, WeekPlan, DaySession } from '../types';

// Removida a dependência do Google GenAI para acesso instantâneo e estático.

// Banco de dados de frases estáticas para performance
const QUOTES = [
  "A disciplina é a ponte entre metas e realizações.",
  "O único treino ruim é aquele que não aconteceu.",
  "Sua mente desiste antes do seu corpo. Continue.",
  "Transforme sua dor em poder.",
  "O corpo alcança o que a mente acredita."
];

export const getMotivationalQuote = async (): Promise<string> => {
  // Retorna uma frase aleatória instantaneamente
  const randomIndex = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[randomIndex];
};

export const generateMonthlyPlan = async (user: UserProfile): Promise<MonthlyPlan> => {
  // GERAÇÃO ESTÁTICA - SEM IA
  // Cria um plano instantâneo baseado no objetivo
  
  const isGain = user.goal === 'Ganho de Massa';
  const baseTerm = isGain ? "Hipertrofia" : "Queima";
  
  // Definição dos focos semanais
  const weekFocuses = [
    "Base & Adaptação",
    "Progressão de Carga",
    "Intensidade Máxima",
    "Desafio Final & Deload"
  ];

  // Mapa de Vídeos Específicos (Chave: "Semana-Dia")
  const specificVideos: Record<string, string> = {
    // SEMANA 1
    "1-1": "https://drive.google.com/file/d/1cT7Du11Re9jsEtzRn3p4PzpykBH_roEw/view?usp=drive_link",
    "1-2": "https://drive.google.com/file/d/1Z_jlwcJi1uQfcrSaSNyECrsIs8KCACSP/view?usp=drive_link",
    "1-3": "https://drive.google.com/file/d/1a_Op29nzzwRlkXgq1c4BcYzMQ_TcwdP9/view?usp=drive_link",
    "1-4": "https://drive.google.com/file/d/1F3EmxfJmOg7h1WUBvSSsWrbgnM7QQm8u/view?usp=drive_link",
    "1-5": "https://drive.google.com/file/d/1N2gD6xcQKgD3RrR1xA_7YQCWxmhVmzPB/view?usp=drive_link",
    "1-6": "https://drive.google.com/file/d/1beY_s2WcKeFOv-QN0pCKMxABUgcOrLT4/view?usp=drive_link",
    "1-7": "https://drive.google.com/file/d/1hxBGALtKBxiEkcw_PAyOhoTzk7rbsbJC/view?usp=drive_link",

    // SEMANA 2
    "2-1": "https://drive.google.com/file/d/1G_XXZFmDuKvQLW46YQF_d9_fTKqiobCo/view?usp=drive_link",
    "2-2": "https://drive.google.com/file/d/1yx5rzytuIcYVs5sn_DTP6GJpZ_foePFQ/view?usp=drive_link",
    "2-3": "https://drive.google.com/file/d/1Lp5w465FrOns0QTC-TroCYq7jgvWkeGg/view?usp=drive_link",
    "2-4": "https://drive.google.com/file/d/1QBnui8m5-oVZeFdelHfEjRABJqaqhnlV/view?usp=drive_link",
    "2-5": "https://drive.google.com/file/d/10HX2xNJqphYrkBBvjPEuwGwMWpX9xbEO/view?usp=drive_link",
    "2-6": "https://drive.google.com/file/d/1j5nW_POujF0aqWHay-APv3rw4RJYpY9N/view?usp=drive_link",
    "2-7": "https://drive.google.com/file/d/1uUnQDwrBgVIc05cyIBflRJI2wikYZh5i/view?usp=drive_link",

    // SEMANA 3
    "3-1": "https://drive.google.com/file/d/1WIuUxGROKROMNiDZxEYB4KNaf06Ue9xV/view?usp=drive_link",
    "3-2": "https://drive.google.com/file/d/1H4GDNQ3TKAvNHqC6ZLENVkI5aQjsRrjL/view?usp=drive_link",
    "3-3": "https://drive.google.com/file/d/1f7MtMgAv7N1Rsd7W7SCCgJ2TFqYL96Lr/view?usp=drive_link",
    "3-4": "https://drive.google.com/file/d/10ethQf8HDbZIyXB-H9sEFAjcgsKReM84/view?usp=drive_link",
    "3-5": "https://drive.google.com/file/d/1Rcq8yGTrFdmA2ZVSLZuhVKEE1wRNJcoY/view?usp=drive_link",
    "3-6": "https://drive.google.com/file/d/1Np20x0JtO0-UfE1wbAkd8y4wHjzJCuDv/view?usp=drive_link",
    "3-7": "https://drive.google.com/file/d/1PYAT6Pth9qHs-OdamFnIErR6qBYjzfpf/view?usp=drive_link",

    // SEMANA 4
    "4-1": "https://drive.google.com/file/d/1lWgH9rOnN6g-li4xLPnBJCqSY55MqQDO/view?usp=drive_link",
    "4-2": "https://drive.google.com/file/d/1cxyET4Ghh7RKmhtu1qlvYBzqIbfwMgWa/view?usp=drive_link",
    "4-3": "https://drive.google.com/file/d/1ynGUHd9DC7HGd-yRG691rBu1l1xA9goL/view?usp=drive_link",
    "4-4": "https://drive.google.com/file/d/1nP0cqNdXKke2G7egEz1Fz3_XR9gNRN9r/view?usp=drive_link",
    "4-5": "https://drive.google.com/file/d/15SqfXPVcFYvVZEWvchc_BCinfXmqx7dC/view?usp=drive_link",
    "4-6": "https://drive.google.com/file/d/1Fci_iMoxnVRl_Y7-wI4wufLdyPR0ZEKb/view?usp=drive_link",
    "4-7": "https://drive.google.com/file/d/1GJ4GS-pZDN0ACgSEQjbcV-IwrXZ9WR2z/view?usp=drive_link"
  };

  const planWeeks: WeekPlan[] = [];

  for (let w = 1; w <= 4; w++) {
    const days: DaySession[] = [];
    for (let d = 1; d <= 7; d++) {
      
      // Default / Placeholder titles if needed
      let title = `Treino ${baseTerm} - Dia ${d}`;
      let description = `Foco total em ${baseTerm}. Siga o vídeo e respeite seu ritmo.`;
      
      // Customize titles slightly based on day index (static logic)
      if (d === 1) title = `Full Body (${baseTerm})`;
      if (d === 2) title = `Membros Inferiores`;
      if (d === 3) title = `Cardio & Core`;
      if (d === 4) title = `Membros Superiores`;
      if (d === 5) title = `Full Body Intenso`;
      if (d === 6) title = `Desafio Calistênico`;
      if (d === 7) title = `Mobilidade & Alongamento`;

      // Check for specific video override
      const specificKey = `${w}-${d}`;
      let videoUrl = ""; // Default empty
      
      if (specificVideos[specificKey]) {
        videoUrl = specificVideos[specificKey];
      }

      days.push({
        dayNumber: d,
        title,
        description,
        videoUrl,
        completed: false
      });
    }

    planWeeks.push({
      weekNumber: w,
      focus: weekFocuses[w - 1],
      days
    });
  }

  const newPlan: MonthlyPlan = {
    id: Date.now().toString(),
    title: `Protocolo BaseCalistenia - ${user.goal}`,
    description: "4 semanas de transformação com peso do corpo.",
    createdAt: Date.now(),
    weeks: planWeeks
  };

  return newPlan;
};