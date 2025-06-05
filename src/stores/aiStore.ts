
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}

interface AIStore {
  // UI State
  isCollapsed: boolean;
  isLoading: boolean;
  contextEnabled: boolean;
  
  // Conversations
  conversations: AIConversation[];
  activeConversationId: string | null;
  
  // Actions
  toggleCollapse: () => void;
  setLoading: (loading: boolean) => void;
  setContextEnabled: (enabled: boolean) => void;
  
  // Conversation Management
  createConversation: (title: string) => string;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  clearConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isCollapsed: false,
      isLoading: false,
      contextEnabled: true,
      conversations: [],
      activeConversationId: null,

      // UI Actions
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setContextEnabled: (enabled: boolean) => set({ contextEnabled: enabled }),

      // Conversation Management
      createConversation: (title: string) => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConversation: AIConversation = {
          id,
          title: title || 'New Conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        set((state) => ({
          conversations: [...state.conversations, newConversation],
          activeConversationId: id,
        }));
        
        return id;
      },

      setActiveConversation: (id: string | null) => {
        set({ activeConversationId: id });
      },

      addMessage: (conversationId: string, message: Omit<AIMessage, 'id' | 'timestamp'>) => {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newMessage: AIMessage = {
          ...message,
          id: messageId,
          timestamp: Date.now(),
        };

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, newMessage],
                  updatedAt: Date.now(),
                }
              : conv
          ),
        }));
      },

      clearConversation: (id: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, messages: [], updatedAt: Date.now() }
              : conv
          ),
        }));
      },

      deleteConversation: (id: string) => {
        set((state) => {
          const filteredConversations = state.conversations.filter((conv) => conv.id !== id);
          return {
            conversations: filteredConversations,
            activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
          };
        });
      },
    }),
    {
      name: 'ai-store',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        contextEnabled: state.contextEnabled,
        isCollapsed: state.isCollapsed,
      }),
    }
  )
);
