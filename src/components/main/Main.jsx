import React, { useState } from "react";
import "./Main.css";
import { assets } from "../../../public/assets/assets";
import ReactMarkdown from "react-markdown";
import Loader from "../Loader/Loader";

export const Main = () => {
  // some local state to use 
  const [input, setInput] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      const data = await res.json();
      setResponse(data.answer);
    } catch (error) {
      console.error("Error fetching response:", error);
      setResponse("Error getting response. Try again!");
    }

    setLoading(false);
    setInput("");
  };

  return (
    <div className="main">
      <div className="nav">
        <p>RAG</p>
        <img src={assets.user_icon} alt="" />
      </div>
      
      {response && (
        <div className="popup">
          <div className="popup-content">
            <button className="close-btn" onClick={() => setResponse(null)}>X</button>
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </div>
      )}

      <div className="main-container">
        <div className="greet">
          <p><span>Hello, Lewis</span></p>
          <p>How can I help you?</p>
        </div>

        <div className="search-box">
          <input 
            type="text"
            placeholder="Enter prompt"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <div>
            <img src={assets.gallery_icon} alt="" />
            <img src={assets.mic_icon} alt="" />
            <img src={assets.send_icon} alt="" onClick={sendMessage} />
          </div>
        </div>

        {loading && <Loader />}

      </div>
    </div>
  );
};