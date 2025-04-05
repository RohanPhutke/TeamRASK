import React from "react";

interface PersonaSelectorProps {
  selectedPersonality: string;
  setSelectedPersonality: (value: string) => void;
  understandingLevel: "normal" | "easy" | "very_easy";
  setUnderstandingLevel: (level: "normal" | "easy" | "very_easy") => void;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  selectedPersonality,
  setSelectedPersonality,
  understandingLevel,
  setUnderstandingLevel,
}) => {
  return (
    <div className="flex gap-3 mb-4">
      <select
        value={selectedPersonality}
        onChange={(e) => setSelectedPersonality(e.target.value)}
        className="flex-1 px-4 py-2.5 border border-gray-300/80 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
      >
        <option value="Professor">🧑‍🏫 Professor</option>
        <option value="Mentor">🧙 Mentor</option>
        <option value="Friend">😊 Friend</option>
        <option value="Comedian">🤡 Comedian</option>
        <option value="Socratic Teacher">🏛️ Socratic</option>
      </select>

      <select
        value={understandingLevel}
        onChange={(e) =>
          setUnderstandingLevel(
            e.target.value as "normal" | "easy" | "very_easy"
          )
        }
        className="flex-1 px-4 py-2.5 border border-gray-300/80 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
      >
        <option value="normal">📚 Normal</option>
        <option value="easy">🎓 Easier with examples</option>
        <option value="very_easy">🧒 Explain like I'm 10</option>
      </select>
    </div>
  );
};

export default PersonaSelector;
