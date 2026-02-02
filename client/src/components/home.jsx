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

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCommentIndex, setActiveCommentIndex] = useState(null);
  const [currentLikes, setCurrentLikes] = useState([]);
  const [showLikesModal, setShowLikesModal] = useState(false);

  // Load existing feelings on mount
  useEffect(() => {
    const loadFeelings = async () => {
      try {
        setLoading(true);
        const response = await feelingsAPI.getAllFeelings();
        if (response.data?.success && response.data?.data) {
          console.log('Loaded feelings from API:', response.data.data);
          setPostedFeelings(response.data.data);
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
      setError('');
    };

    const handleDisconnect = () => {
      console.log('❌ Disconnected from server');
      setError('Lost connection to server. Messages may not update in real-time.');
    };

    const handleReconnect = () => {
      console.log('🔄 Reconnected to server');
      setError('');
    };

    const handleReconnectError = (error) => {
      console.error('❌ Reconnection error:', error);
      setError('Failed to reconnect to server. Please refresh the page.');
    };

    const handleReconnectFailed = () => {
      console.error('❌ Reconnection failed');
      setError('Could not reconnect to server. Please check your connection and refresh the page.');
    };

    const handleReceiveFeeling = (feeling) => {
      console.log('Received new feeling via socket:', feeling);
      
      setPostedFeelings(prev => {
        // Skip if feeling already exists (check by ID)
        const exists = prev.some(f => f._id === feeling._id);
        if (exists) {
          console.log(`Feeling ${feeling._id} already exists, skipping duplicate`);
          return prev;
        }
        
        // Skip if it's a temporary ID (from our own optimistic update)
        if (typeof feeling._id === 'string' && feeling._id.startsWith('temp-')) {
          console.log('Skipping temporary feeling ID from socket');
          return prev;
        }
        
        // Add the new feeling to the beginning
        console.log('Adding new feeling to feed');
        return [feeling, ...prev];
      });
    };

    const handleLikeUpdated = (data) => {
      console.log('Like updated via socket:', data);
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
      console.log('Comment added via socket:', data);
      
      setPostedFeelings(prev =>
        prev.map(feeling => {
          if (feeling._id === data.feelingId) {
            // Simple duplicate check - only check if exact same comment exists
            const commentExists = feeling.comments?.some(c => 
              c.text === data.comment.text && 
              c.author === data.comment.author &&
              c.timestamp === data.comment.timestamp
            );
            
            if (commentExists) {
              console.log('Duplicate comment detected, skipping');
              return feeling;
            }
            
            return {
              ...feeling,
              comments: [...(feeling.comments || []), data.comment]
            };
          }
          return feeling;
        })
      );
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    };

    // Attach listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_error', handleReconnectError);
    socket.on('reconnect_failed', handleReconnectFailed);
    socket.on('receiveFeeling', handleReceiveFeeling);
    socket.on('likeUpdated', handleLikeUpdated);
    socket.on('commentAdded', handleCommentAdded);
    socket.on('error', handleError);

    // Cleanup function - properly remove specific listeners
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_error', handleReconnectError);
      socket.off('reconnect_failed', handleReconnectFailed);
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
      const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const newFeeling = {
        _id: tempId,
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

      // Send via API
      try {
        const response = await feelingsAPI.createFeeling(feelingData);
        if (response.data?.success) {
          console.log('Feeling posted successfully via API');
          const realFeeling = response.data.data;
          
          // Replace temporary feeling with real one from server
          setPostedFeelings(prev => {
            // Remove the temporary feeling
            const withoutTemp = prev.filter(f => f._id !== tempId);
            
            // Check if the real feeling already exists (from socket broadcast)
            const realExists = withoutTemp.some(f => f._id === realFeeling._id);
            
            if (realExists) {
              // Socket already added it, just remove temp
              console.log('Real feeling already added by socket, removing temp');
              return withoutTemp;
            } else {
              // Socket hasn't added it yet, add it ourselves
              console.log('Adding real feeling from API response');
              return [{ ...realFeeling, likesCount: 0 }, ...withoutTemp];
            }
          });
        }
      } catch (apiErr) {
        console.error('API call failed:', apiErr);
        // Remove the optimistic feeling if API fails
        setPostedFeelings(prev => prev.filter(f => f._id !== tempId));
        throw apiErr;
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

      // Send via API
      try {
        const response = await feelingsAPI.toggleLike(feelingId, {
          userId: userInfo.userId,
          userRole: userInfo.role
        });
        if (response.data?.success) {
          console.log('Like toggled successfully via API');
          // Update with actual data from server
          const updatedFeeling = response.data.data;
          setPostedFeelings(prev =>
            prev.map(f =>
              f._id === feelingId
                ? {
                    ...f,
                    likesCount: updatedFeeling.likesCount || updatedFeeling.likes?.length || 0,
                    isLikedByUser: updatedFeeling.likes?.some(like => like.userId === userInfo.userId)
                  }
                : f
            )
          );
        }
      } catch (apiErr) {
        console.error('API call failed:', apiErr);
        // Revert optimistic update
        setPostedFeelings(prev =>
          prev.map(f =>
            f._id === feelingId
              ? {
                  ...f,
                  isLikedByUser: currentLikeStatus,
                  likesCount: currentLikeStatus ? newLikesCount + 1 : newLikesCount - 1
                }
              : f
          )
        );
        throw apiErr;
      }

    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to update like: ' + (err.message || 'Unknown error'));
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
      const tempTimestamp = new Date().toISOString();
      const newComment = {
        text: commentText,
        author: userInfo.identity,
        authorRole: userInfo.role,
        timestamp: tempTimestamp,
        _tempId: 'temp-comment-' + Date.now()
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

      // Send via API
      try {
        const response = await feelingsAPI.addComment(feelingId, commentData);
        if (response.data?.success) {
          console.log('Comment added successfully via API');
          
          // Replace temp comment with real one if needed
          setPostedFeelings(prev =>
            prev.map(f => {
              if (f._id === feelingId) {
                // Remove temp comment
                const commentsWithoutTemp = f.comments.filter(c => c._tempId !== newComment._tempId);
                
                // Check if real comment already exists (from socket)
                const realCommentExists = commentsWithoutTemp.some(c =>
                  c.text === commentText &&
                  c.author === userInfo.identity &&
                  Math.abs(new Date(c.timestamp) - new Date(tempTimestamp)) < 2000
                );
                
                if (realCommentExists) {
                  // Socket already added it
                  return { ...f, comments: commentsWithoutTemp };
                } else {
                  // Add the real comment from API
                  const realComment = response.data.comment || {
                    ...commentData,
                    timestamp: new Date().toISOString()
                  };
                  return { ...f, comments: [...commentsWithoutTemp, realComment] };
                }
              }
              return f;
            })
          );
        }
      } catch (apiErr) {
        console.error('API call failed:', apiErr);
        // Remove the optimistic comment if API fails
        setPostedFeelings(prev =>
          prev.map(f =>
            f._id === feelingId
              ? {
                  ...f,
                  comments: f.comments.filter(c => c._tempId !== newComment._tempId)
                }
              : f
          )
        );
        throw apiErr;
      }

      // Clear input and keep comment box open
      setCommentInputs({ ...commentInputs, [feelingId]: '' });
      
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment: ' + (err.message || 'Unknown error'));
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

        {/* Feelings Feed */}
        <div className="posted-feelings" style={{ marginTop: '20px', padding: '10px' }}>
          {loading && postedFeelings.length === 0 ? (
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
                  key={feeling._id}
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