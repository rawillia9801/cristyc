"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChefHat, Send, Sparkles, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "chef";
  text: string;
};

const FAILURE_MESSAGE = "Claude Chef had trouble reaching the kitchen just now — please ask again.";

export function ClaudeChef() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "chef",
      text: "Hi Cristy -- I am Claude Chef. Ask me for substitutions, dinners, desserts, or ingredient help."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const visibleMessages = useMemo(() => messages.slice(-4), [messages]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>, quickMessage?: string) {
    event?.preventDefault();
    const message = (quickMessage ?? input).trim();

    if (!message || isLoading) {
      return;
    }

    setInput("");
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: message
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const response = await fetch("/api/chef", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
    <aside className="chefPanel">
      <div className="chefHeader">
        <div className="chefTitle">
          <span className="chefIcon">
            <ChefHat size={22} fill="#fff9eb" />
          </span>
          <h2>Claude Chef</h2>
          <Sparkles size={17} className="sparkleIcon" />
        </div>
        <button className="chefClose" aria-label="Close Claude Chef">
          <X size={18} />
        </button>
      </div>

      <div className="chefMessages" aria-live="polite">
        {visibleMessages.map((message) => (
          <div key={message.id} className={`chefBubble ${message.role === "user" ? "userBubble" : "assistantBubble"}`}>
            {message.text}
          </div>
        ))}
        {isLoading && <div className="chefThinking">Claude Chef is thinking...</div>}
      </div>

      <form className="chefInputWrap" onSubmit={(event) => void sendMessage(event)}>
        <input
          aria-label="Ask Claude anything"
          placeholder="Ask Claude anything..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isLoading}
        />
        <button aria-label="Send question" disabled={isLoading || !input.trim()}>
          <Send size={14} fill="currentColor" />
        </button>
      </form>
      <button
        className="wakeChef"
        onClick={() => void sendMessage(undefined, "Give me a cozy family dinner idea for tonight.")}
        disabled={isLoading}
      >
        <ChefHat size={16} />
        Wake Chef
      </button>
      <div className="floatingChef" aria-hidden="true">
        <ChefHat size={31} fill="#fff8e8" />
        <span>1</span>
      </div>
    </aside>
  );
}
