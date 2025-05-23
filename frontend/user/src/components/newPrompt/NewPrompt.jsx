import { useEffect, useRef, useState } from "react";
import "./newPrompt.css";
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NewPrompt = ({ data }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const endRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data, question, answer]);

  const queryClient = useQueryClient();

  // Mutation for saving chat history
  const saveMutation = useMutation({
    mutationFn: (chatData) => {
      if (!data?._id) {
        throw new Error("Chat ID is missing");
      }

      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatData),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", data._id] });
      formRef.current?.reset();
      setQuestion("");
      setAnswer("");
    },
    onError: (err) => {
      console.error("Save error:", err);
      setError("Failed to save chat");
    },
  });

  // Function to query the RAG backend
  const queryRAG = async (questionText) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/v1/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questionText,
          max_sources: 3,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setAnswer(result.answer);

      // Save the conversation
      saveMutation.mutate({
        question: questionText,
        answer: result.answer,
      });
    } catch (err) {
      console.error("RAG query error:", err);
      setError("Failed to get answer from the AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = e.target.text.value.trim();
    if (!text) return;

    setQuestion(text);
    await queryRAG(text);
  };

  // Load initial question if exists
  const hasRun = useRef(false);
  useEffect(() => {
    if (!hasRun.current && data?.history?.length === 1) {
      const initialQuestion = data.history[0].parts[0].text;
      setQuestion(initialQuestion);
      queryRAG(initialQuestion);
    }
    hasRun.current = true;
  }, [data]);

  return (
    <>
      {/* Chat messages */}
      {question && <div className="message user">{question}</div>}
      {isLoading && <div className="message">Thinking...</div>}
      {error && <div className="message error">{error}</div>}
      {answer && (
        <div className="message">
          <Markdown>{answer}</Markdown>
        </div>
      )}

      <div className="endChat" ref={endRef}></div>

      {/* Input form */}
      <form className="newForm" onSubmit={handleSubmit} ref={formRef}>
        <input
          type="text"
          name="text"
          placeholder="Ask anything..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          <img src="/arrow.png" alt="Send" />
        </button>
      </form>
    </>
  );
};

export default NewPrompt;
