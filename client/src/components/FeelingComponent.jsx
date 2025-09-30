import React, { useState } from 'react';
import axios from 'axios';

const FeelingComponent = ({ 
  feeling, 
  index, 
  userInfo, 
  toggleHeart, 
  isLikedByUser, 
  commentBoxes, 
  toggleCommentBox, 
  viewOwnPostComments,
  commentInputs,
  handleCommentChange,
  handleAddComment
}) => {
  console.log("Rendering feeling:", feeling); // Debug log
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [currentLikes, setCurrentLikes] = useState([]);

  // Function to show who liked a post
  const showLikes = (feelingId) => {
    try {
      if (feeling && feeling.likes && Array.isArray(feeling.likes)) {
        setCurrentLikes(feeling.likes);
      } else {
        setCurrentLikes([]);
      }
      
      setShowLikesModal(true);
    } catch (err) {
      console.error('Error showing likes:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={`feeling-card ${feeling.author === userInfo.identity ? 'own-post' : ''}`} style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '15px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {feeling.author === userInfo.identity && (
        <div className="own-post-indicator" style={{
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
          padding: '4px 8px',
          borderRadius: '4px',
          display: 'inline-block',
          marginBottom: '10px',
          fontWeight: 'bold'
        }}>Your Post</div>
      )}
      <div className="feeling-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px'
      }}>
        <div className="author-info">
          <span className="author-name" style={{ fontWeight: 'bold' }}>{feeling.author}</span>
          <span className={`author-role ${feeling.authorRole}`} style={{ 
            marginLeft: '8px',
            color: feeling.authorRole === 'child' ? '#2196f3' : '#ff9800',
            fontSize: '0.9rem'
          }}>({feeling.authorRole})</span>
        </div>
        <span className="feeling-date" style={{ color: '#666', fontSize: '0.9rem' }}>{formatDate(feeling.createdAt)}</span>
      </div>
      <div className="feeling-content" style={{
        fontSize: '1.1rem',
        lineHeight: '1.5',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
      }}>{feeling.text}</div>
      <div className="feeling-footer" style={{ 
        marginTop: '10px',
        borderTop: '1px solid #eee',
        paddingTop: '10px'
      }}>
        <div className="interaction-buttons" style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <div className="like-container" style={{ position: 'relative' }}>
            {feeling.author === userInfo.identity ? (
              <>
                <button 
                  className={`heart-btn`}
                  disabled={true}
                  style={{
                    opacity: 0.5,
                    cursor: 'not-allowed'
                  }}
                >
                  🤍 Like ({feeling.likesCount || 0})
                  <span className="tooltip-text" style={{fontSize: '0.7rem'}}> (Can't like own post)</span>
                </button>
                {feeling.likesCount > 0 && (
                  <button 
                    className="see-likes-btn" 
                    onClick={() => showLikes(feeling._id)}
                    style={{
                      marginLeft: '5px',
                      padding: '5px 10px',
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    👁️ See who liked
                  </button>
                )}
              </>
            ) : (
              <button 
                className={`heart-btn ${isLikedByUser(feeling) ? 'liked' : ''}`}
                onClick={() => toggleHeart(feeling._id)}
                style={{
                  cursor: 'pointer'
                }}
              >
                {isLikedByUser(feeling) ? '❤️' : '🤍'} Like ({feeling.likesCount || 0})
              </button>
            )}
          </div>
          
          <button 
            className="comment-btn" 
            onClick={() => toggleCommentBox(index)}
            style={{
              cursor: 'pointer'
            }}
          >
            💬 Comment ({feeling.comments?.length || 0})
          </button>
          <button className="share-btn">🔗 Share</button>
          {feeling.authorRole !== userInfo.role && (
            <button className="friend-btn">👋 Friend Request</button>
          )}
        </div>
        
        {commentBoxes[index] && (
          <div className="comment-section">
            {feeling.author !== userInfo.identity && (
              <div className="add-comment">
                <textarea
                  placeholder="Write a comment..."
                  value={commentInputs[feeling._id] || ''}
                  onChange={(e) => handleCommentChange(feeling._id, e.target.value)}
                />
                <button onClick={() => handleAddComment(feeling._id)}>Post</button>
              </div>
            )}
            
            <div className="comments-list">
              {feeling.comments && feeling.comments.map((comment, commentIndex) => (
                <div key={commentIndex} className="comment">
                  <div className="comment-header">
                    <div className="comment-author">
                      <span className="author-name">{comment.author}</span>
                      <span className={`author-role ${comment.authorRole}`}>{comment.authorRole}</span>
                    </div>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                  <div className="comment-text">{comment.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Likes Modal */}
      {showLikesModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: 0 }}>People who liked this post</h3>
              <button 
                onClick={() => setShowLikesModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="likes-list">
              {currentLikes.length === 0 ? (
                <p>No likes yet</p>
              ) : (
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0,
                  margin: 0
                }}>
                  {currentLikes.map((like, index) => (
                    <li key={index} style={{
                      padding: '10px',
                      borderBottom: index < currentLikes.length - 1 ? '1px solid #eee' : 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <div style={{ marginRight: '10px', fontSize: '20px' }}>❤️</div>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{like.userId}</div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666',
                          backgroundColor: like.userRole === 'child' ? '#3498db' : '#e74c3c',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          display: 'inline-block',
                          marginTop: '3px'
                        }}>
                          {like.userRole}
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>
                        {new Date(like.timestamp).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeelingComponent;