import React, { useEffect } from 'react'
import './Sidebar.css'
import { assets } from '../../../public/assets/assets'
import { useState } from 'react'

function Sidebar() {
  const [extended, setExtended] = useState(false)
  const [recentChats, setRecentChats] = useState([]);

  useEffect(() => {
    const fetchRecentChats = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;

      const response = await fetch(`http://localhost:8000/recent_chats/${userId}`);
      const data = await response.json();
      setRecentChats(data.chats);
    };

    fetchRecentChats();
  }, []);

  const handleChatClick = (chat) => {
    // Logic to display the selected chat in the main chat area
    console.log("Selected chat:", chat);
  };

  return (
    <div className='sidebar'>
      <div className="top">
        <img onClick={() => setExtended(prev => !prev)} className='menu' src={assets.menu_icon} alt="" />
        {extended && (
          <div className="new-chart">
            <img src={assets.plus_icon} alt="" />
            <p>New Chat</p>
          </div>
        )}
      </div>
      {extended ? (
        <div className="recent">
          <p className="recent-title">Recent</p>
          {recentChats.length > 0 ? (
            recentChats.map((chat, index) => (
              <div key={index} className="recent-entry" onClick={() => handleChatClick(chat)}>
                <img src={assets.message_icon} alt="" />
                <p>{chat}</p>
              </div>
            ))
          ) : (
            <p>No recent chats available.</p>
          )}
        </div>
      ) : null}
      <div className="bottom">
        <div className="bottom-item recent-entry">
          <img src={assets.question_icon} alt="" />
          {extended ? <p>Help</p> : null}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.history_icon} alt="" />
          {extended ? <p>Activity</p> : null}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.setting_icon} alt="" />
          {extended ? <p>Settings</p> : null}
        </div>
      </div>
    </div>
  )
}

export default Sidebar;



