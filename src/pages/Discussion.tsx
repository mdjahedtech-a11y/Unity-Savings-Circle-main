import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { MessageSquare, Heart, Send, AlertCircle, Shield, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

type MemberInfo = {
  id: string;
  name: string;
  role: string;
};

type Comment = {
  id: string;
  post_id: string;
  member_id: string;
  content: string;
  created_at: string;
  members: MemberInfo;
};

type Like = {
  id: string;
  post_id: string;
  member_id: string;
};

type Post = {
  id: string;
  member_id: string;
  content: string;
  created_at: string;
  members: MemberInfo;
  comments: Comment[];
  post_likes: Like[];
};

export default function Discussion() {
  const { member, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [commentContents, setCommentContents] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [submittingPost, setSubmittingPost] = useState(false);
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();

    const channel = supabase.channel('discussion_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          members(id, name, role),
          comments(*, members(id, name, role)),
          post_likes(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') { // undefined_table
          setTableError(true);
        }
        throw error;
      }

      // Sort comments by created_at ascending
      const formattedData = (data || []).map(post => ({
        ...post,
        comments: (post.comments || []).sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }));

      setPosts(formattedData);
      setTableError(false);
    } catch (error: any) {
      if (error.code !== '42P01') {
        console.error('Error fetching posts:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !member) return;

    setSubmittingPost(true);
    try {
      const { error } = await supabase.from('posts').insert({
        member_id: member.id,
        content: newPostContent.trim()
      });

      if (error) throw error;
      
      setNewPostContent('');
      toast.success('Post created successfully');
      fetchPosts();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleCreateComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const content = commentContents[postId];
    if (!content?.trim() || !member) return;

    setSubmittingComment(postId);
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        member_id: member.id,
        content: content.trim()
      });

      if (error) throw error;
      
      setCommentContents(prev => ({ ...prev, [postId]: '' }));
      setExpandedComments(prev => ({ ...prev, [postId]: true }));
      fetchPosts();
    } catch (error: any) {
      console.error('Error creating comment:', error);
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!member) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const existingLike = post.post_likes.find(l => l.member_id === member.id);

    try {
      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            member_id: member.id
          });
        if (error) throw error;
      }
      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (tableError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Database Setup Required</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          The discussion tables do not exist in your Supabase database. Please run the following SQL in your Supabase SQL Editor:
        </p>
        <div className="bg-gray-900 text-gray-300 p-4 rounded-lg text-left text-sm font-mono overflow-x-auto w-full max-w-2xl">
          <pre>{`create table posts (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references members(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table post_likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, member_id)
);`}</pre>
        </div>
        <Button onClick={() => window.location.reload()} className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white">
          I've run the SQL, Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-indigo-500" />
            Discussion Board
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Share updates, announcements, and discuss with circle members.
          </p>
        </div>
      </div>

      {/* Create Post Form */}
      <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shrink-0">
                {member?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 space-y-3">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={isAdmin ? "Post an announcement or update..." : "Share something with the circle..."}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 min-h-[100px] resize-none"
                  required
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={submittingPost || !newPostContent.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md px-6"
                  >
                    {submittingPost ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg">No posts yet. Start the conversation!</p>
          </div>
        ) : (
          posts.map((post, index) => {
            const isLikedByMe = post.post_likes.some(l => l.member_id === member?.id);
            const isAuthorAdmin = post.members?.role === 'admin';
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}
              >
                <Card className={`overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${
                  isAuthorAdmin 
                    ? 'border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-indigo-500/5' 
                    : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5'
                }`}>
                  <CardContent className="p-0">
                    <div className="p-4 sm:p-6">
                      {/* Post Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                            isAuthorAdmin ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                          }`}>
                            {post.members?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {post.members?.name || 'Unknown User'}
                              </h3>
                              {isAuthorAdmin && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 uppercase tracking-wider">
                                  <Shield className="w-3 h-3" /> Admin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/50 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(post.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        {(isAdmin || member?.id === post.member_id) && (
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                            title="Delete Post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Post Content */}
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-[15px]">
                        {post.content}
                      </p>

                      {/* Post Actions */}
                      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
                        <button 
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                            isLikedByMe 
                              ? 'text-indigo-600 dark:text-indigo-400' 
                              : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${isLikedByMe ? 'fill-current' : ''}`} />
                          <span>{post.post_likes.length > 0 ? post.post_likes.length : 'Like'}</span>
                        </button>
                        
                        <button 
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <MessageSquare className="w-5 h-5" />
                          <span>{post.comments.length > 0 ? post.comments.length : 'Comment'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {expandedComments[post.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5"
                        >
                          <div className="p-4 sm:p-6 space-y-4">
                            {/* Comment List */}
                            {post.comments.length > 0 ? (
                              <div className="space-y-4 mb-4">
                                {post.comments.map(comment => (
                                  <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0 mt-1">
                                      {comment.members?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 bg-white dark:bg-white/5 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-white/5 shadow-sm">
                                      <div className="flex items-baseline justify-between gap-2 mb-1">
                                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                          {comment.members?.name || 'Unknown'}
                                        </span>
                                        <span className="text-[10px] text-gray-500 dark:text-white/40">
                                          {formatTimeAgo(comment.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {comment.content}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">
                                No comments yet. Be the first to reply!
                              </p>
                            )}

                            {/* Add Comment Form */}
                            <form onSubmit={(e) => handleCreateComment(e, post.id)} className="flex gap-2">
                              <input
                                type="text"
                                value={commentContents[post.id] || ''}
                                onChange={(e) => setCommentContents(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder="Write a comment..."
                                className="flex-1 px-4 py-2 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-full text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                              />
                              <Button 
                                type="submit" 
                                size="icon"
                                disabled={submittingComment === post.id || !commentContents[post.id]?.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shrink-0"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
