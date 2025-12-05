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
    // SEMANA 1 (Já configurado anteriormente)
    "1-1": "https://drive.google.com/file/d/1cT7Du11Re9jsEtzRn3p4PzpykBH_roEw/view?usp=drive_link",

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

  const weeks: WeekPlan[] = weekFocuses.map((focus, index) => {
    const weekNum = index + 1;
    
    // Gerar 7 dias para a semana
    const days: DaySession[] = Array.from({ length: 7 }).map((_, dIndex) => {
      const dayNum = dIndex + 1;
      let title = `Dia ${dayNum} - Treino Completo`;
      let desc = "Siga as instruções do vídeo para completar o treino de hoje.";
      let query = `treino em casa ${user.goal.toLowerCase()} dia ${dayNum}`;

      // Variações simples baseadas no dia
      if (dayNum === 1) { title = `Dia 1 - Full Body (${baseTerm})`; desc = "Trabalho do corpo todo para iniciar a semana."; }
      if (dayNum === 2) { title = `Dia 2 - Superiores & Core`; desc = "Foco em força de braços, peito e abdômen."; query += " superiores"; }
      if (dayNum === 3) { title = `Dia 3 - Cardio & Pernas`; desc = "Aumentando a frequência cardíaca e fortalecendo a base."; query += " pernas cardio"; }
      if (dayNum === 4) { title = `Dia 4 - Descanso Ativo / Alongamento`; desc = "Recuperação muscular e flexibilidade."; query = "alongamento corpo todo 20 min"; }
      if (dayNum === 5) { title = `Dia 5 - ${baseTerm} Intenso`; desc = "O treino mais difícil da semana."; query += " avançado intenso"; }
      if (dayNum === 6) { title = `Dia 6 - Desafio Calistenia`; desc = "Use o peso do corpo para superar limites."; query = "treino calistenia iniciante em casa"; }
      if (dayNum === 7) { title = `Dia 7 - Descanso Total`; desc = "Dia livre para recuperação completa."; query = ""; }

      // Lógica de URL: Tenta buscar no mapa específico, senão gera busca automática
      const specificKey = `${weekNum}-${dayNum}`;
      let videoUrl = specificVideos[specificKey];

      if (!videoUrl) {
          videoUrl = query ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` : "";
      }

      return {
        dayNumber: dayNum,
        title,
        description: desc,
        videoUrl: videoUrl,
        completed: false
      };
    });

    return {
      weekNumber: weekNum,
      focus: focus,
      days: days
    };
  });

  // Retorna o plano montado
  return {
    id: `static-${Date.now()}`,
    title: `Protocolo ${user.goal}`,
    description: "Programa de 4 semanas focado em resultados rápidos.",
    createdAt: Date.now(),
    weeks: weeks
  };
};