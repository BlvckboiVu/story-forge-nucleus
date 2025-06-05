
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

export interface AIContextData {
  recentText: string;
  storyBibleEntries: Array<{ id: string; name: string; content: string }>;
  sceneSummaries: Array<{ id: string; title: string; summary: string }>;
  tokenCount: number;
}

interface AIStore {
  // UI State
  isCollapsed: boolean;
  isLoading: boolean;
  contextEnabled: boolean;
  isProcessingContext: boolean;
  
  // AI Settings
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
  
  // Context Data
  contextData: AIContextData;
  
  // Conversations
  conversations: AIConversation[];
  activeConversationId: string | null;
  
  // Actions
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setLoading: (loading: boolean) => void;
  setContextEnabled: (enabled: boolean) => void;
  setProcessingContext: (processing: boolean) => void;
  
  // AI Settings Actions
  setSelectedModel: (model: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setApiKey: (key: string) => Promise<void>;
  getApiKey: () => Promise<string>;
  
  // Messaging
  sendMessage: (message: string) => Promise<void>;
  
  // Conversation Management
  createConversation: (title?: string) => string;
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
      isProcessingContext: false,
      selectedModel: 'meta-llama/llama-3.2-3b-instruct:free',
      temperature: 0.7,
      maxTokens: 1000,
      apiKey: '',
      contextData: {
        recentText: '',
        storyBibleEntries: [],
        sceneSummaries: [],
        tokenCount: 0,
      },
      conversations: [],
      activeConversationId: null,

      // UI Actions
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (collapsed: boolean) => set({ isCollapsed: collapsed }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setContextEnabled: (enabled: boolean) => set({ contextEnabled: enabled }),
      setProcessingContext: (processing: boolean) => set({ isProcessingContext: processing }),

      // AI Settings Actions
      setSelectedModel: (model: string) => set({ selectedModel: model }),
      setTemperature: (temp: number) => set({ temperature: temp }),
      setMaxTokens: (tokens: number) => set({ maxTokens: tokens }),
      setApiKey: async (key: string) => {
        set({ apiKey: key });
        // In a real implementation, this would use secure storage
        localStorage.setItem('ai_api_key', key);
      },
      getApiKey: async () => {
        const state = get();
        return state.apiKey || localStorage.getItem('ai_api_key') || '';
      },

      // Messaging
      sendMessage: async (message: string) => {
        const state = get();
        if (!state.activeConversationId) {
          const conversationId = get().createConversation();
          set({ activeConversationId: conversationId });
        }
        
        // Add user message
        get().addMessage(state.activeConversationId!, {
          role: 'user',
          content: message,
        });

        set({ isLoading: true });
        
        try {
          // Simulate AI response for now
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          get().addMessage(state.activeConversationId!, {
            role: 'assistant',
            content: `I understand you want to discuss: "${message}". This is a placeholder response.`,
          });
        } catch (error) {
          console.error('Error sending message:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Conversation Management
      createConversation: (title?: string) => {
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
        selectedModel: state.selectedModel,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
      }),
    }
  )
);
