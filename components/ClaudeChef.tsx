"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChefHat, Send, Sparkles } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "chef";
  text: string;
};

type ClaudeChefProps = {
  sessionToken: string;
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "chef",
      text: "Hi Cristy! I'm Claude Chef. Ask me for substitutions, recipe ideas, cooking tips, or anything ingredient related."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const visibleMessages = useMemo(() => messages.slice(-5), [messages]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>, quickMessage?: string) {
    event?.preventDefault();
    const message = (quickMessage ?? input).trim();

    if (!message || isLoading) {
      return;
    }

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
          "x-cristy-session": sessionToken
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
    <aside className="panel chefPanel">
      <div className="chefHeader">
        <span className="chefMark">
          <ChefHat size={22} />
        </span>
        <div>
          <h2>Claude Chef ✨</h2>
          <p>Your Personal Kitchen Assistant</p>
        </div>
      </div>

      <div className="chefMessages" aria-live="polite">
        {visibleMessages.map((message) => (
          <div key={message.id} className={`chefBubble ${message.role === "user" ? "userBubble" : "assistantBubble"}`}>
            {message.text}
          </div>
        ))}
        {isLoading && <div className="chefThinking">Claude Chef is stirring on it...</div>}
      </div>

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
  );
}
