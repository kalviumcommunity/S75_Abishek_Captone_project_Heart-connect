    import React, { useState, useEffect } from 'react';
    import { Link } from 'react-router-dom';
    import "../styles/home.css";

    const ChildHomePage = () => {
      const [userInfo, setUserInfo] = useState({
        identity: '',
        role: ''
      });
      const [feelingText, setFeelingText] = useState('');
      const [postedFeelings, setPostedFeelings] = useState([]);

      useEffect(() => {
        const storedIdentity = localStorage.getItem('identity');
        const storedRole = localStorage.getItem('userRole');
        setUserInfo({
          identity: storedIdentity || 'Anonymous',
          role: storedRole || 'guest'
        });
      }, []);

      const handlePostFeeling = () => {
        if (feelingText.trim()) {
          const newFeeling = {
            text: feelingText,
            liked: false,
            author: userInfo.identity,
            role: userInfo.role,
            likesCount: 0,
            timestamp: new Date().toISOString()
          };
          setPostedFeelings([newFeeling, ...postedFeelings]);
          setFeelingText('');
        }
      };

      const toggleHeart = (index) => {
        setPostedFeelings(prev => prev.map((feeling, i) => 
          i === index ? {
            ...feeling,
            liked: !feeling.liked,
            likesCount: feeling.liked ? feeling.likesCount - 1 : feeling.likesCount + 1
          } : feeling
        ));
      };

      const getAuthorLabel = (feeling) => {
        return feeling.author; 
      };

      return (
        <div className="cont">
          <div className="child-home">
            <nav className="navbar">
              <ul className="nav-links">
                <li><Link to="/home">Home</Link></li>
                <li><Link to="/chat">Chat</Link></li>
                <li><Link to="/request">Friend Request</Link></li>
                <li><Link to="/analysis">Analysis</Link></li>
                <li><Link to="/profile">Profile</Link></li>
              </ul>
            </nav>

            <div className="posted-feelings">
              {postedFeelings.map((feeling, index) => (
                <div key={feeling.timestamp} className="posted-feeling">
                  <h3>{getAuthorLabel(feeling)}</h3>
                  <p>{feeling.text}</p>
                  <div className="interaction-buttons">
                    <button
                      className={`heart-btn ${feeling.liked ? 'liked' : ''}`}
                      onClick={() => toggleHeart(index)}
                    >
                      {feeling.liked ? '❤️' : '🤍'} Like ({feeling.likesCount})
                    </button>
                    <button className="comment-btn">💬 Comment</button>
                    <button className="share-btn">🔗 Share</button>
                    <button className="friend-btn">👫 Request Friend</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="inpDiv">
              <div className="feeling-input">
                <p><strong>Posting as:</strong> {userInfo.identity}</p>
                <textarea
                  placeholder="Write your feeling here..."
                  value={feelingText}
                  onChange={(e) => setFeelingText(e.target.value)}
                  style={{ height: '60px', padding: '10px' }}
                />
                <button 
                  onClick={handlePostFeeling}
                  disabled={!feelingText.trim()}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    export default ChildHomePage;