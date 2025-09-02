"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResearchQuestion {
  id: number;
  question: string;
  options: string[];
}

interface ResearchPreferences {
  [key: number]: string;
}

interface ResearchQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (preferences: ResearchPreferences) => void;
}

const researchQuestions: ResearchQuestion[] = [
  {
    "id": 1,
    "question": "What is the main goal of your research?",
    "options": [
      "Market trends & opportunities",
      "Competitor analysis",
      "Customer pain points & needs",
      "Technology landscape & tools",
      "Funding & investors"
    ]
  },
  {
    "id": 3,
    "question": "Which industry or market should I focus on?",
    "options": [
      "AI & Tech Startups",
      "Healthcare / Biotech",
      "E-commerce / Retail",
      "Finance & Fintech",
      "Clean Energy / Sustainability",
      "Other (custom input)"
    ]
  },
  {
    "id": 4,
    "question": "Do you want competitor profiles included?",
    "options": [
      "Yes, top 3 competitors",
      "Yes, top 5 competitors",
      "Only direct competitors",
      "No, skip competitors"
    ]
  },
  {
    "id": 5,
    "question": "Which data sources should I rely on?",
    "options": [
      "News articles & blogs",
      "Research papers & whitepapers",
      "Market reports (Gartner, McKinsey, etc.)",
      "Social media & online discussions",
      "A mix of all above"
    ]
  },
  {
    "id": 6,
    "question": "How would you like the research delivered?",
    "options": [
      "Bullet-point notes",
      "Structured PDF report",
      "Excel with data tables",
      "Interactive dashboard (charts + summaries)"
    ]
  },
  {
    "id": 7,
    "question": "How recent should the information be?",
    "options": [
      "Last 3 months",
      "Last 6 months",
      "Last 1 year",
      "No time limit (historical + recent)"
    ]
  },
  {
    "id": 8,
    "question": "Which aspect should I prioritize?",
    "options": [
      "Market size & growth potential",
      "Customer demographics & behavior",
      "Technology adoption & innovations",
      "Business models & revenue streams",
      "Risks & challenges"
    ]
  },
  {
    "id": 9,
    "question": "How should the final summary be structured?",
    "options": [
      "Business Model Canvas (Key Partnerships, Customer Segments, Value Propositions, Channels, Key Resources, Customer Relationships, Revenue Streams, Key Activities, Cost Structure)",
      "Executive Summary (problem, solution, market, competition, growth potential)",
      "SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)",
      "Comparative Table (side-by-side competitor insights)",
      "Flexible (mix of all above as needed)"
    ]
  }
];

export function ResearchQuestionsModal({ isOpen, onClose, onComplete }: ResearchQuestionsModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [preferences, setPreferences] = useState<ResearchPreferences>({});
  const [customInput, setCustomInput] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const currentQuestion = researchQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === researchQuestions.length - 1;
  const canProceed = preferences[currentQuestion.id] || (showCustomInput && customInput.trim());

  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIndex(0);
      setPreferences({});
      setCustomInput("");
      setShowCustomInput(false);
    }
  }, [isOpen]);

  const handleOptionSelect = (option: string) => {
    if (option === "Other (custom input)") {
      setShowCustomInput(true);
      setPreferences(prev => ({ ...prev, [currentQuestion.id]: "" }));
    } else {
      setShowCustomInput(false);
      setCustomInput("");
      setPreferences(prev => ({ ...prev, [currentQuestion.id]: option }));
    }
  };

  const handleCustomInputChange = (value: string) => {
    setCustomInput(value);
    setPreferences(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete(preferences);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowCustomInput(false);
      setCustomInput("");
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowCustomInput(false);
      setCustomInput("");
    }
  };

  const handleSkip = () => {
    if (isLastQuestion) {
      onComplete(preferences);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowCustomInput(false);
      setCustomInput("");
    }
  };

  const progressPercentage = ((currentQuestionIndex + 1) / researchQuestions.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[#0a0a0a] rounded-2xl border border-white/[0.1] shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/[0.1] bg-gradient-to-r from-indigo-500/[0.1] to-purple-500/[0.1]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{currentQuestionIndex + 1}</span>
                  </div>
                  Research Preferences
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/[0.1] rounded-full h-2">
                <motion.div
                  className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-white/60 text-sm mt-2">
                Question {currentQuestionIndex + 1} of {researchQuestions.length}
              </p>
            </div>

            {/* Question Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-semibold text-white mb-6 leading-relaxed">
                  {currentQuestion.question}
                </h3>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full p-4 text-left rounded-xl border transition-all duration-200 ${
                        preferences[currentQuestion.id] === option
                          ? "border-indigo-500 bg-indigo-500/[0.1] text-white"
                          : "border-white/[0.1] bg-white/[0.02] text-white/80 hover:border-white/[0.2] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {preferences[currentQuestion.id] === option ? (
                          <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-white/40 flex-shrink-0" />
                        )}
                        <span className="text-sm leading-relaxed">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Input Field */}
                {showCustomInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => handleCustomInputChange(e.target.value)}
                      placeholder="Enter your custom input..."
                      className="w-full p-4 bg-white/[0.05] border border-indigo-500/50 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
                    />
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/[0.1] bg-gradient-to-r from-white/[0.02] to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  {currentQuestionIndex > 0 && (
                    <Button
                      onClick={handleBack}
                      variant="ghost"
                      className="px-6 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1] hover:border-white/[0.2] rounded-lg"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleSkip}
                    variant="ghost"
                    className="px-6 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1] hover:border-white/[0.2] rounded-lg"
                  >
                    Skip
                  </Button>
                </div>
                
                <Button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="px-8 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLastQuestion ? "Complete Setup" : "Next"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}