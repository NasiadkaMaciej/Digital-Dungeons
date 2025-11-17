'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { gamesApi, likesApi, commentsApi } from '@/lib/api';

export default function GameDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [game, setGame] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    loadGameDetails();
  }, [params.id]);

  const loadGameDetails = async () => {
    setLoading(true);
    try {
      const gameData = await gamesApi.getGameById(params.id);
      setGame(gameData);

      const commentsData = await commentsApi.getGameComments(params.id);
      setComments(commentsData.comments);

      if (isAuthenticated) {
        const likeStatus = await likesApi.checkLike(params.id);
        setIsLiked(likeStatus.liked);
      }
    } catch (err) {
      console.error('Failed to load game:', err);
      alert('Failed to load game details');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like games');
      return;
    }

    try {
      if (isLiked) {
        await likesApi.unlikeGame(params.id);
        setIsLiked(false);
        setGame({ ...game, likes_count: Math.max(0, game.likes_count - 1) });
      } else {
        await likesApi.likeGame(params.id);
        setIsLiked(true);
        setGame({ ...game, likes_count: game.likes_count + 1 });
      }
    } catch (err) {
      alert('Failed to update like: ' + err.message);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to comment');
      return;
    }

    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await commentsApi.createComment(params.id, commentText);
      setComments([response.comment, ...comments]);
      setCommentText('');
    } catch (err) {
      alert('Failed to post comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingCommentText.trim()) return;

    try {
      const response = await commentsApi.updateComment(commentId, editingCommentText);
      setComments(comments.map(c => c.comment_id === commentId ? response.comment : c));
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      alert('Failed to update comment: ' + err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await commentsApi.deleteComment(commentId);
      setComments(comments.filter(c => c.comment_id !== commentId));
    } catch (err) {
      alert('Failed to delete comment: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-foreground/60">Loading...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground/60">Game not found</p>
        <Link href="/marketplace" className="text-blue-500 hover:underline mt-4 inline-block">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isAuthor = user?.userId === game.author_id;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Game Header */}
      <div className="bg-foreground/5 rounded-lg p-6 border border-foreground/10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
            <p className="text-foreground/60">by {game.author_name}</p>
          </div>
          {isAuthor && (
            <Link
              href={`/editor?gameId=${game.game_id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors"
            >
              Edit Game
            </Link>
          )}
        </div>

        {game.description && (
          <p className="text-foreground/80 mt-4">{game.description}</p>
        )}

        <div className="flex items-center gap-6 mt-6 text-foreground/60">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${
              isLiked ? 'text-red-500' : 'hover:text-foreground'
            }`}
            disabled={!isAuthenticated}
          >
            <svg className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="font-medium">{game.likes_count || 0}</span>
          </button>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{game.plays_count || 0} plays</span>
          </span>
          <span className="text-sm">
            Created {new Date(game.create_date).toLocaleDateString()}
          </span>
        </div>

        <div className="mt-6">
          <Link
            href={`/play/${game.game_id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-md font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Play Game
          </Link>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-foreground/5 rounded-lg p-6 border border-foreground/10">
        <h2 className="text-2xl font-bold mb-6">
          Comments ({comments.length})
        </h2>

        {/* Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-4 py-3 bg-background border border-foreground/20 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-foreground/60">
                {commentText.length}/1000
              </span>
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-foreground/10 disabled:text-foreground/40 rounded-md transition-colors"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-foreground/5 rounded-md text-center">
            <p className="text-foreground/60">
              <Link href="/login" className="text-blue-500 hover:underline">Log in</Link>
              {' '}to leave a comment
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-foreground/60 py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map(comment => (
              <div
                key={comment.comment_id}
                className="p-4 bg-background rounded-md border border-foreground/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{comment.author_name}</span>
                    <span className="text-sm text-foreground/60 ml-2">
                      {new Date(comment.date_posted).toLocaleDateString()}
                      {comment.is_edited && ' (edited)'}
                    </span>
                  </div>
                  {user?.userId === comment.user_id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCommentId(comment.comment_id);
                          setEditingCommentText(comment.content);
                        }}
                        className="text-sm text-blue-500 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.comment_id)}
                        className="text-sm text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {editingCommentId === comment.comment_id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      className="w-full px-3 py-2 bg-foreground/5 border border-foreground/20 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      maxLength={1000}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditComment(comment.comment_id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingCommentText('');
                        }}
                        className="px-3 py-1 bg-foreground/10 hover:bg-foreground/20 rounded text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground/80 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
