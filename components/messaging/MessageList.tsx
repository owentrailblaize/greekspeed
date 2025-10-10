'use client';

import { useEffect, useRef, useState } from 'react';
import { Message } from '@/lib/hooks/useMessages';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { MoreHorizontal, Edit, Trash2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
}

export function MessageList({ 
  messages, 
  loading, 
  hasMore, 
  onLoadMore, 
  onEditMessage, 
  onDeleteMessage 
}: MessageListProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    setShowMenuFor(null);
  };

  const handleSaveEdit = async () => {
    if (editingMessageId && editContent.trim()) {
      try {
        await onEditMessage(editingMessageId, editContent);
        setEditingMessageId(null);
        setEditContent('');
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleDelete = async (messageId: string) => {
    try {
      await onDeleteMessage(messageId);
      setShowMenuFor(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }));
  };

  const messageGroups = groupMessagesByDate(messages);

  if (loading && messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium">No messages yet</p>
          <p className="text-gray-400">Start the conversation by sending a message!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center mb-4">
          <Button
            onClick={onLoadMore}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-navy-600 border-navy-200 hover:bg-navy-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b border-navy-600 mr-2" />
            ) : (
              'Load more messages'
            )}
          </Button>
        </div>
      )}

      {/* Messages */}
      {messageGroups.map(({ date, messages: groupMessages }) => (
        <div key={date} className="space-y-4 mb-6">
          {/* Date separator */}
          <div className="flex items-center justify-center">
            <div className="bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-xs text-gray-500 font-medium">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Messages in this group */}
          {groupMessages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            const isEditing = editingMessageId === message.id;

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
              >
                {/* Left side - Avatar and content for received messages */}
                {!isOwnMessage && (
                  <div className="flex items-end space-x-2 max-w-[70%]">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <UserAvatar
                        user={{ 
                          email: null, 
                          user_metadata: { 
                            avatar_url: message.sender.avatar_url, 
                            full_name: message.sender.full_name 
                          } 
                        }}
                        completionPercent={100}
                        hasUnread={false}
                        size="sm"
                      />
                    </div>
                    
                    {/* Message content */}
                    <div className="flex flex-col">
                      {/* Sender name */}
                      <span className="text-xs text-gray-500 mb-1 px-2">
                        {message.sender.full_name}
                      </span>
                      
                      {/* Message bubble */}
                      <div className="relative group">
                        {isEditing ? (
                          <div className="bg-white border border-navy-200 rounded-lg p-3 shadow-sm">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full resize-none border-none outline-none text-sm"
                              rows={1}
                              autoFocus
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="h-6 px-2 text-xs"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                className="h-6 px-2 text-xs bg-navy-600 hover:bg-navy-700"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg shadow-sm">
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      <span className="text-xs text-gray-400 mt-1 px-2">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Right side - Content and avatar for own messages */}
                {isOwnMessage && (
                  <div className="flex items-end space-x-2 max-w-[70%]">
                    {/* Message content */}
                    <div className="flex flex-col items-end">
                      {/* Message bubble */}
                      <div className="relative group">
                        {isEditing ? (
                          <div className="bg-white border border-navy-200 rounded-lg p-3 shadow-sm">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full resize-none border-none outline-none text-sm"
                              rows={1}
                              autoFocus
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="h-6 px-2 text-xs"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                className="h-6 px-2 text-xs bg-navy-600 hover:bg-navy-700"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-navy-600 text-white px-4 py-2 rounded-lg shadow-sm">
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            
                            {/* Message actions menu */}
                            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowMenuFor(showMenuFor === message.id ? null : message.id)}
                                className="h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-sm"
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                              
                              {showMenuFor === message.id && (
                                <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                                  <button
                                    onClick={() => handleEdit(message)}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                  >
                                    <Edit className="w-3 h-3 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(message.id)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                  >
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      <span className="text-xs text-gray-400 mt-1 px-2">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <UserAvatar
                        user={{ 
                          email: null, 
                          user_metadata: { 
                            avatar_url: message.sender.avatar_url, 
                            full_name: message.sender.full_name 
                          } 
                        }}
                        completionPercent={100}
                        hasUnread={false}
                        size="sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Scroll to bottom reference */}
      <div ref={messagesEndRef} />
    </div>
  );
} 