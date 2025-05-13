import React, { useState, useEffect } from "react";
import "./Main.css";
import { assets } from "../../../public/assets/assets";
import ReactMarkdown from "react-markdown";
import Loader from "../Loader/Loader";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const Main = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      navigate("/login");
    }
  }, [navigate]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        toast.error("Please log in to use the chatbot.");
        setLoading(false);
        return;
      }

      const res = await fetch("https://opulent-funicular-5gvxgrrg7v5q377xx-8000.app.github.dev/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      const data = await res.json();
      setResponse(data.answer);

      // Save chat to the database
      await fetch("https://opulent-funicular-5gvxgrrg7v5q377xx-8000.app.github.dev/save_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message: input }),
      });

      setChatHistory((prev) => [...prev, { isUser: true, message: input }, { isUser: false, message: data.answer }]);
      toast.success("Message sent and saved!");
    } catch (error) {
      console.error("Error fetching response:", error);
      setResponse("Error getting response. Try again!");
      toast.error("Failed to send message.");
    }

    setLoading(false);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="main">
      <div className="nav">
        <p>RAG</p>
        <img src={assets.user_icon} alt="" />
      </div>

      <div className="chat-container">
        {chatHistory.map((chat, index) => (
          <div key={index} className={`chat-message ${chat.isUser ? "user" : "bot"}`}>
            <ReactMarkdown>{chat.message}</ReactMarkdown>
          </div>
        ))}
      </div>

      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={3}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      {loading && <Loader />}
    </div>
  );
};