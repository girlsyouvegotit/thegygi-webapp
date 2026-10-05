import { useState, useCallback } from "react";
import { X, BarChart3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollPopupProps {
  pollId: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted: boolean;
  onVote: (pollId: string, optionId: string) => void;
  onClose: () => void;
  isHost?: boolean;
}

const PollPopup = ({
  pollId,
  question,
  options,
  totalVotes,
  hasVoted,
  onVote,
  onClose,
  isHost,
}: PollPopupProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleVote = useCallback(() => {
    if (!selectedOption || hasVoted) return;
    onVote(pollId, selectedOption);
    setShowResults(true);
  }, [selectedOption, hasVoted, pollId, onVote]);

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl animate-bounce-in overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">Live Poll</h3>
              <p className="text-white/70 text-xs">
                {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label="Close poll"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">{question}</h4>

          {!showResults && !hasVoted ? (
            <>
              <div className="space-y-2 mb-6">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200",
                      selectedOption === option.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-primary/50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                        selectedOption === option.id
                          ? "border-primary"
                          : "border-gray-300",
                      )}
                    >
                      {selectedOption === option.id && (
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {option.text}
                    </span>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleVote}
                disabled={!selectedOption}
                className="w-full"
              >
                Submit Vote
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              {options.map((option) => {
                const percentage = getPercentage(option.votes);
                const isSelected = option.id === selectedOption;

                return (
                  <div key={option.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {option.text}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isSelected ? "bg-primary" : "bg-gray-300",
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.votes} vote{option.votes !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}

              {isHost && (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={onClose}
                >
                  End Poll
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollPopup;
