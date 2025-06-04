
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
}

interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  lastActivity: Date;
  contextEnabled: boolean;
}

interface AIState {
  // Panel state
  isCollapsed: boolean;
  isLoading: boolean;
  
  // Conversations
  conversations: AIConversation[];
  activeConversationId: string | null;
  
  // Input state
  inputText: string;
  
  // Context system
  contextEnabled: boolean;
  contextData: {
    recentText: string;
    storyBibleEntries: any[];
    sceneSummaries: string[];
    tokenCount: number;
  };
  
  // Settings
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  
  // Actions
  setCollapsed: (collapsed: boolean) => void;
  setLoading: (loading: boolean) => void;
  setInputText: (text: string) => void;
  setContextEnabled: (enabled: boolean) => void;
  setContextData: (data: Partial<AIState['contextData']>) => void;
  setSelectedModel: (model: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  
  // Conversation management
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<AIMessage>) => void;
  clearConversations: () => void;
}

export const useAIStore = create<AIState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isCollapsed: false,
      isLoading: false,
      conversations: [],
      activeConversationId: null,
      inputText: '',
      contextEnabled: true,
      contextData: {
        recentText: '',
        storyBibleEntries: [],
        sceneSummaries: [],
        tokenCount: 0,
      },
      selectedModel: 'meta-llama/llama-3.2-3b-instruct:free',
      temperature: 0.7,
      maxTokens: 1000,
      
      // Actions
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      setLoading: (loading) => set({ isLoading: loading }),
      setInputText: (text) => set({ inputText: text }),
      setContextEnabled: (enabled) => set({ contextEnabled: enabled }),
      setContextData: (data) => set((state) => ({
        contextData: { ...state.contextData, ...data }
      })),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setTemperature: (temp) => set({ temperature: temp }),
      setMaxTokens: (tokens) => set({ maxTokens: tokens }),
      
      // Conversation management
      createConversation: (title = 'New Conversation') => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConversation: AIConversation = {
          id,
          title,
          messages: [],
          lastActivity: new Date(),
          contextEnabled: get().contextEnabled,
        };
        
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }));
        
        return id;
      },
      
      deleteConversation: (id) => set((state) => ({
        conversations: state.conversations.filter(conv => conv.id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
      })),
      
      setActiveConversation: (id) => set({ activeConversationId: id }),
      
      addMessage: (conversationId, message) => {
        const messageWithId: AIMessage = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };
        
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, messageWithId],
                  lastActivity: new Date(),
                }
              : conv
          ),
        }));
      },
      
      updateMessage: (conversationId, messageId, updates) => set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === messageId ? { ...msg, ...updates } : msg
                ),
              }
            : conv
        ),
      })),
      
      clearConversations: () => set({
        conversations: [],
        activeConversationId: null,
      }),
    }),
    {
      name: 'ai-store',
    }
  )
);
