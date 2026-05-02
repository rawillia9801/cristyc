"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, Maximize2, Minus, Send, Sparkles, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "chef";
  text: string;
};

type ClaudeChefProps = {
  sessionToken?: string;
};

const suggestions = [
  "What can I make with chicken and spinach?",
  "Dessert ideas for a dinner party",
  "Substitute for heavy cream",
  "Recipes with fresh lemons"
];

const FAILURE_MESSAGE = "Claude Chef had trouble reaching the kitchen just now. Please ask again.";

export function ClaudeChef({ sessionToken }: ClaudeChefProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "chef",
      text: "Hi Cristy! I'm Claude Chef. Ask me for substitutions, recipe ideas, cooking tips, or anything ingredient related."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, isExpanded]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>, quickMessage?: string) {
    event?.preventDefault();
    const message = (quickMessage ?? input).trim();

    if (!message || isLoading) {
      return;
    }

    setIsExpanded(true);
    setInput("");
    setIsLoading(true);

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: message
      }
    ]);

    try {
      const response = await fetch("/api/chef", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { "x-cristy-session": sessionToken } : {})
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error("Claude Chef request failed.");
      }

      const data = (await response.json()) as { reply?: string };
      const reply = data.reply?.trim() || FAILURE_MESSAGE;

      setMessages((current) => [
        ...current,
        {
          id: `chef-${Date.now()}`,
          role: "chef",
          text: reply
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `chef-error-${Date.now()}`,
          role: "chef",
          text: FAILURE_MESSAGE
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <aside className="panel chefPanel">
        <div className="chefHeader">
          <span className="chefMark">
            <ChefHat size={22} />
          </span>
          <div>
            <h2>Claude Chef ✨</h2>
            <p>Your Personal Kitchen Assistant</p>
          </div>
          <button className="chefExpand" aria-label="Expand Claude Chef" onClick={() => setIsExpanded(true)}>
            <Maximize2 size={16} />
          </button>
        </div>

        <button className="chefIntroBubble" onClick={() => setIsExpanded(true)}>
          Hi Cristy! I can help with substitutions, dinner ideas, cooking tips, and fresh ingredient inspiration.
        </button>

        <div className="suggestionChips">
          {suggestions.map((suggestion) => (
            <button key={suggestion} onClick={() => void sendMessage(undefined, suggestion)} disabled={isLoading}>
              {suggestion}
            </button>
          ))}
        </div>

        <form className="chefInputWrap" onSubmit={(event) => void sendMessage(event)}>
          <input
            aria-label="Ask Claude Chef"
            placeholder="Ask Claude anything..."
            value={input}
            onFocus={() => setIsExpanded(true)}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLoading}
          />
          <button aria-label="Send question" disabled={isLoading || !input.trim()}>
            <Send size={15} />
          </button>
        </form>
        <button
          className="wakeChef"
          onClick={() => void sendMessage(undefined, "Wake up Claude Chef and suggest something cozy for tonight.")}
          disabled={isLoading}
        >
          <Sparkles size={15} />
          Wake Claude
        </button>
      </aside>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="chefModalBackdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              className="chefModal"
              initial={{ y: 24, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 180 }}
              role="dialog"
              aria-modal="true"
              aria-label="Claude Chef chat"
            >
              <header className="chefModalHeader">
                <span className="chefMark large">
                  <ChefHat size={26} />
                </span>
                <div>
                  <h2>Claude Chef ✨</h2>
                  <p>Roomy kitchen help for substitutions, planning, troubleshooting, and ideas.</p>
                </div>
                <button aria-label="Minimize Claude Chef" onClick={() => setIsExpanded(false)}>
                  <Minus size={18} />
                </button>
                <button aria-label="Close Claude Chef" onClick={() => setIsExpanded(false)}>
                  <X size={18} />
                </button>
              </header>

              <div className="chefModalMessages" ref={scrollRef} aria-live="polite">
                {messages.map((message) => (
                  <div key={message.id} className={`chefModalBubble ${message.role === "user" ? "userBubble" : "assistantBubble"}`}>
                    {message.text}
                  </div>
                ))}
                {isLoading && <div className="chefTyping">Claude Chef is thinking...</div>}
              </div>

              <div className="chefModalSuggestions">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} onClick={() => void sendMessage(undefined, suggestion)} disabled={isLoading}>
                    {suggestion}
                  </button>
                ))}
              </div>

              <form className="chefModalInput" onSubmit={(event) => void sendMessage(event)}>
                <input
                  aria-label="Ask Claude Chef in expanded chat"
                  placeholder="Ask about ingredients, menus, substitutions, timing..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                <button disabled={isLoading || !input.trim()}>
                  <Send size={18} />
                  Send
                </button>
              </form>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
