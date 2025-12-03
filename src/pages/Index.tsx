import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

const Index = () => {
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      // For now, just clear - this is a playground for asking questions
      setQuestion("");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl animate-fade-in">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">playground</span>
          </div>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight text-foreground">
            Ask me anything
          </h1>
          <p className="text-lg text-muted-foreground">
            What can be built? What are the limits? Let's explore.
          </p>
        </header>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="group relative rounded-xl border border-border bg-card transition-all duration-300 focus-within:border-primary/50 focus-within:glow-primary hover:border-muted-foreground/30">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question..."
              className="min-h-[120px] w-full resize-none bg-transparent px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="font-mono text-xs text-muted-foreground">
                Press Enter to send
              </span>
              <button
                type="submit"
                disabled={!question.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        </form>

        {/* Hint */}
        <p className="mt-6 text-center font-mono text-xs text-muted-foreground">
          This is your sandbox to explore possibilities
        </p>
      </div>
    </main>
  );
};

export default Index;
