import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import socket from '../utils/socket';
import { feelingsAPI } from '../utils/api';
import '../styles/home.css';
import FeelingComponent from './FeelingComponent';

const ChildHomePage = () => {
  const [userInfo, setUserInfo] = useState(() => {
    const identity = localStorage.getItem('identity') || '';
    const role = localStorage.getItem('userRole') || '';
    let userId = localStorage.getItem('userId') || '';
    
    // If userId is missing but identity exists, use identity as userId
    if (!userId && identity) {
      userId = identity;
      localStorage.setItem('userId', userId);
    }
    
    return { 
      identity, 
      role, 
      userId 
    };
  });
  const [feelingText, setFeelingText] = useState('');
  const [postedFeelings, setPostedFeelings] = useState([]);
  const [commentBoxes, setCommentBoxes] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCommentIndex, setActiveCommentIndex] = useState(null);
  const [currentLikes, setCurrentLikes] = useState([]);
  const [showLikesModal, setShowLikesModal] = useState(false);

  // Ensure all feelings in state are unique
  const ensureUniqueFeelings = (feelings) => {
    const uniqueFeelings = [];
    const seenIds = new Set();
    
    for (const feeling of feelings) {
      if (!seenIds.has(feeling._id)) {
        seenIds.add(feeling._id);
        uniqueFeelings.push(feeling);
      }
    }
    
    return uniqueFeelings;
  };

  // Effect to periodically clean up duplicates
  useEffect(() => {
    const interval = setInterval(() => {
      setPostedFeelings(prev => {
        const cleaned = ensureUniqueFeelings(prev);
        // Only update if there were actually duplicates
        if (cleaned.length !== prev.length) {
          console.log('Cleaned up duplicate feelings');
          return cleaned;
        }
        return prev;
      });
    }, 5000); // Check every 5 seconds instead of 1
    
    return () => clearInterval(interval);
  }, []);

  // Custom hook to ensure unique feelings
  const addUniqueFeeling = (newFeeling) => {
    setPostedFeelings(prev => {
      // Create a new array with unique feelings only
      const allFeelings = [newFeeling, ...prev];
      const uniqueFeelings = [];
      const seenIds = new Set();
      
      for (const feeling of allFeelings) {
        if (!seenIds.has(feeling._id)) {
          seenIds.add(feeling._id);
          uniqueFeelings.push(feeling);
        }
      }
      
      return uniqueFeelings;
    });
  };

  // Custom hook to set feelings ensuring uniqueness
  const setUniqueFeelings = (newFeelings) => {
    const uniqueFeelings = [];
    const seenIds = new Set();
    
    for (const feeling of newFeelings) {
      if (!seenIds.has(feeling._id)) {
        seenIds.add(feeling._id);
        uniqueFeelings.push(feeling);
      }
    }
    
    setPostedFeelings(uniqueFeelings);
  };

  // Load existing feelings on mount
  useEffect(() => {
    const loadFeelings = async () => {
      try {
        setLoading(true);
        const response = await feelingsAPI.getAllFeelings();
        if (response.data?.success && response.data?.data) {
          console.log('Loaded feelings from API:', response.data.data);
          // Set initial feelings
          setUniqueFeelings(response.data.data);
        }
      } catch (err) {
        console.error('Error loading feelings:', err);
        setError('Failed to load feelings');
      } finally {
        setLoading(false);
      }
    };

    loadFeelings();
  }, []);

  // Socket event listeners
  useEffect(() => {
    // Define named handler functions
    const handleConnect = () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    };

    const handleReceiveFeeling = (feeling) => {
      console.log('Received new feeling via socket:', feeling);
      
      // Check if this feeling is from the current user to prevent duplication
      const isCurrentUserFeeling = feeling.author === userInfo.identity && 
                                  feeling.authorRole === userInfo.role;
      
      // If it's from current user, we already added it optimistically, so skip
      if (isCurrentUserFeeling) {
        console.log('Skipping duplicate feeling from current user');
        return;
      }
      
      // Use our custom function to ensure uniqueness
      addUniqueFeeling(feeling);
    };

    const handleLikeUpdated = (data) => {
      console.log('Like updated:', data);
      setPostedFeelings(prev =>
        prev.map(feeling =>
          feeling._id === data.feelingId
            ? {
                ...feeling,
                likesCount: data.likesCount,
                isLikedByUser: data.wasLiked && data.userId === userInfo.userId
              }
            : feeling
        )
      );
    };

    const handleCommentAdded = (data) => {
      console.log('Comment added:', data);
      
      // Check if this comment is from the current user to prevent duplication
      const isCurrentUserComment = data.comment.author === userInfo.identity && 
                                  data.comment.authorRole === userInfo.role;
      
      // If it's from current user, we already added it optimistically, so skip
      if (isCurrentUserComment) {
        console.log('Skipping duplicate comment from current user');
        return;
      }
      
      setPostedFeelings(prev =>
        prev.map(feeling =>
          feeling._id === data.feelingId
            ? {
                ...feeling,
                comments: [...(feeling.comments || []), data.comment]
              }
            : feeling
        )
      );
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    };

    // Attach listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receiveFeeling', handleReceiveFeeling);
    socket.on('likeUpdated', handleLikeUpdated);
    socket.on('commentAdded', handleCommentAdded);
    socket.on('error', handleError);

    // Cleanup function - properly remove specific listeners
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receiveFeeling', handleReceiveFeeling);
      socket.off('likeUpdated', handleLikeUpdated);
      socket.off('commentAdded', handleCommentAdded);
      socket.off('error', handleError);
    };
  }, [userInfo.userId, userInfo.identity, userInfo.role]);

  const handlePostFeeling = async () => {
    if (!feelingText.trim()) return;

    // Validate user info
    if (!userInfo.identity || !userInfo.role || !userInfo.userId) {
      const missingFields = [];
      if (!userInfo.identity) missingFields.push('identity');
      if (!userInfo.role) missingFields.push('role');
      if (!userInfo.userId) missingFields.push('userId');
      
      setError(`User information incomplete. Missing: ${missingFields.join(', ')}. Please log in again.`);
      console.error('User info validation failed:', { userInfo, missingFields });
      return;
    }

    try {
      setLoading(true);
      setError('');

      const feelingData = {
        text: feelingText,
        author: userInfo.identity,
        authorRole: userInfo.role
      };

      // Optimistically add feeling to UI immediately for better UX
      const newFeeling = {
        _id: 'temp-' + Date.now(), // Temporary ID
        text: feelingText,
        author: userInfo.identity,
        authorRole: userInfo.role,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
        likesCount: 0
      };
      
      // Add to the beginning of the list
      setPostedFeelings(prev => [newFeeling, ...prev]);

      // Emit to server via socket for real-time broadcasting
      // The server will save to database and broadcast to all clients
      socket.emit('newFeeling', feelingData);
      
      // Also send via API as a backup in case socket fails
      try {
        const response = await feelingsAPI.createFeeling(feelingData);
        if (response.data?.success) {
          console.log('Feeling posted successfully via API');
          // Update the temporary feeling with the real ID from server
          const realFeeling = response.data.data;
          setPostedFeelings(prev => 
            prev.map(f => 
              f._id === newFeeling._id ? { ...realFeeling, likesCount: 0 } : f
            )
          );
        }
      } catch (apiErr) {
        console.error('API fallback failed:', apiErr);
        // Remove the optimistic feeling if API fails
        setPostedFeelings(prev => prev.filter(f => f._id !== newFeeling._id));
        throw apiErr; // Re-throw to be caught by the outer catch
      }
      
      // Clear the input field
      setFeelingText('');
      console.log('Feeling posted successfully');
    } catch (err) {
      console.error('Error posting feeling:', err);
      setError('Failed to post feeling: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleHeart = async (feelingId) => {
    // Validate user info
    if (!userInfo.identity || !userInfo.role || !userInfo.userId) {
      const missingFields = [];
      if (!userInfo.identity) missingFields.push('identity');
      if (!userInfo.role) missingFields.push('role');
      if (!userInfo.userId) missingFields.push('userId');
      
      setError(`User information incomplete. Missing: ${missingFields.join(', ')}. Please log in again.`);
      console.error('User info validation failed:', { userInfo, missingFields });
      return;
    }

    try {
      setError('');
      const feeling = postedFeelings.find(f => f._id === feelingId);
      if (!feeling) return;
      
      // Check if the user is the author of the feeling
      if (feeling.author === userInfo.identity) {
        setError("You cannot like your own post");
        return;
      }

      // Optimistically update UI for better user experience
      const currentLikeStatus = isLikedByUser(feeling);
      const newLikesCount = currentLikeStatus ? (feeling.likesCount - 1) : ((feeling.likesCount || 0) + 1);
      
      setPostedFeelings(prev =>
        prev.map(f =>
          f._id === feelingId
            ? {
                ...f,
                isLikedByUser: !currentLikeStatus,
                likesCount: newLikesCount
              }
            : f
        )
      );

      // Emit to server via socket for real-time updates
      const likeData = {
        feelingId,
        userId: userInfo.userId,
        userRole: userInfo.role
      };
      
      socket.emit('toggleLike', likeData);
      
      // Also send via API as a backup
      try {
        const response = await feelingsAPI.toggleLike(feelingId, {
          userId: userInfo.userId,
          userRole: userInfo.role
        });
        if (response.data?.success) {
          console.log('Like toggled successfully via API');
        }
      } catch (apiErr) {
        console.error('API fallback failed:', apiErr);
        // Continue since socket might still work
      }

    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to update like: ' + (err.message || 'Unknown error'));
      
      // Revert optimistic update if there's an error
      try {
        const response = await feelingsAPI.getFeeling(feelingId);
        if (response.data?.success) {
          setPostedFeelings(prev =>
            prev.map(f =>
              f._id === feelingId ? response.data.data : f
            )
          );
        }
      } catch (revertErr) {
        console.error('Failed to revert optimistic update:', revertErr);
      }
    }
  };

  const toggleCommentBox = (index) => {
    // Check if the user is the author of the feeling
    const feeling = postedFeelings[index];
    if (feeling && feeling.author === userInfo.identity) {
      setError("You cannot comment on your own post");
      return;
    }
    
    setActiveCommentIndex(prev => (prev === index ? null : index));
  };
  
  // Function to view comments on your own post
  const viewOwnPostComments = (index) => {
    setCommentBoxes(prev => {
      const newCommentBoxes = [...prev];
      newCommentBoxes[index] = !newCommentBoxes[index];
      return newCommentBoxes;
    });
  };
  
  const handleCommentChange = (feelingId, text) => {
    setCommentInputs({ ...commentInputs, [feelingId]: text });
  };

  const handleAddComment = async (feelingId, index) => {
    // Validate user info
    if (!userInfo.identity || !userInfo.role || !userInfo.userId) {
      const missingFields = [];
      if (!userInfo.identity) missingFields.push('identity');
      if (!userInfo.role) missingFields.push('role');
      if (!userInfo.userId) missingFields.push('userId');
      
      setError(`User information incomplete. Missing: ${missingFields.join(', ')}. Please log in again.`);
      console.error('User info validation failed:', { userInfo, missingFields });
      return;
    }

    const commentText = commentInputs[feelingId]?.trim();
    if (!commentText) return;
    
    // Double-check that user is not commenting on their own post
    const feeling = postedFeelings.find(f => f._id === feelingId);
    if (feeling && feeling.author === userInfo.identity) {
      setError("You cannot comment on your own post");
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const commentData = {
        text: commentText,
        author: userInfo.identity,
        authorRole: userInfo.role
      };

      // Optimistically add comment to UI immediately for better UX
      const newComment = {
        text: commentText,
        author: userInfo.identity,
        authorRole: userInfo.role,
        timestamp: new Date().toISOString()
      };
      
      setPostedFeelings(prev =>
        prev.map(f =>
          f._id === feelingId
            ? {
                ...f,
                comments: [...(f.comments || []), newComment]
              }
            : f
        )
      );

      // Emit to server via socket for real-time broadcasting
      socket.emit('newComment', {
        feelingId,
        ...commentData
      });
      
      // Also send via API as a backup
      try {
        const response = await feelingsAPI.addComment(feelingId, commentData);
        if (response.data?.success) {
          console.log('Comment added successfully via API');
        }
      } catch (apiErr) {
        console.error('API fallback failed:', apiErr);
        // Remove the optimistic comment if API fails
        setPostedFeelings(prev =>
          prev.map(f =>
            f._id === feelingId
              ? {
                  ...f,
                  comments: f.comments.filter(c => 
                    !(c.text === commentText && c.author === userInfo.identity)
                  )
                }
              : f
          )
        );
        throw apiErr; // Re-throw to be caught by the outer catch
      }

      // Clear input and keep comment box open
      setCommentInputs({ ...commentInputs, [feelingId]: '' });
      
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment: ' + (err.message || 'Unknown error'));
      setActiveCommentIndex(null);
    } finally {
      setLoading(false);
    }
  };

  const getAuthorLabel = (feeling) => feeling.author;
  const isLikedByUser = (feeling) => {
    // Check if the feeling has the isLikedByUser property set by the socket update
    if (feeling.isLikedByUser !== undefined) {
      return feeling.isLikedByUser;
    }
    
    // Otherwise check the likes array
    if (feeling.likes && Array.isArray(feeling.likes)) {
      return feeling.likes.some(like => like.userId === userInfo.userId);
    }
    return false;
  };
  
  // Function to show who liked a post
  const showLikes = async (feelingId) => {
    try {
      setLoading(true);
      const response = await feelingsAPI.getFeeling(feelingId);
      if (response.data?.success) {
        const feeling = response.data.data;
        if (feeling.likes && Array.isArray(feeling.likes)) {
          setCurrentLikes(feeling.likes);
          setShowLikesModal(true);
        }
      }
    } catch (err) {
      console.error('Error fetching likes:', err);
      setError('Failed to fetch likes');
    } finally {
      setLoading(false);
    }
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

        {/* Real-time Connection Indicator */}
        {isConnected && (
          <div className="realtime-indicator">
            🔴 Live
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message" style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '4px',
            margin: '10px',
            border: '1px solid #ffcdd2'
          }}>
            <strong>Error:</strong> {error}
            <button 
              onClick={() => setError('')}
              style={{ float: 'right', background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading feelings...</p>
          </div>
        )}

        {/* Feelings Feed */}
        <div className="posted-feelings" style={{ marginTop: '20px', padding: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Loading feelings...</p>
            </div>
          ) : postedFeelings && postedFeelings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3>No feelings posted yet</h3>
              <p>Be the first to share your feelings!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {postedFeelings && postedFeelings.map((feeling, index) => (
                <FeelingComponent
                  key={feeling._id || index}
                  feeling={feeling}
                  index={index}
                  userInfo={userInfo}
                  toggleHeart={toggleHeart}
                  isLikedByUser={isLikedByUser}
                  commentBoxes={commentBoxes}
                  toggleCommentBox={toggleCommentBox}
                  viewOwnPostComments={viewOwnPostComments}
                  commentInputs={commentInputs}
                  handleCommentChange={handleCommentChange}
                  handleAddComment={handleAddComment}
                />
              ))}
            </div>
          )}
        </div>

        {/* Post New Feeling */}
        <div className="inpDiv">
          <div className="feeling-input">
            <p><strong>Posting as:</strong> {userInfo.identity} ({userInfo.role})</p>
            <textarea
              placeholder="Write your feeling here..."
              value={feelingText}
              onChange={(e) => setFeelingText(e.target.value)}
              style={{ 
                height: '80px', 
                padding: '12px',
                width: '100%',
                borderRadius: '4px',
                border: '1px solid #ddd',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <button
              onClick={handlePostFeeling}
              disabled={!feelingText.trim() || loading}
              style={{
                background: feelingText.trim() ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: feelingText.trim() ? 'pointer' : 'not-allowed',
                marginTop: '8px'
              }}
            >
              {loading ? 'Posting...' : 'Post Feeling'}
            </button>
          </div>
        </div>
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

export default ChildHomePage;