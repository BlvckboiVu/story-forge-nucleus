
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { openRouterService } from '@/services/openrouter';
import { SecureStorage } from '@/utils/encryption';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
}

export interface AIConversation {
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
  isProcessingContext: boolean;
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
  setApiKey: (key: string) => Promise<void>;
  getApiKey: () => Promise<string | null>;
  
  // Conversation management
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  clearConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<AIMessage>) => void;
  
  // Message handling
  sendMessage: (content: string) => Promise<void>;
}

const secureStorage = SecureStorage.getInstance();

// Computed selector for current messages
export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      // Initial state
      isCollapsed: false,
      isLoading: false,
      conversations: [],
      activeConversationId: null,
      inputText: '',
      contextEnabled: false,
      isProcessingContext: false,
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

      setApiKey: async (key) => {
        await openRouterService.setApiKey(key);
      },

      getApiKey: async () => {
        return secureStorage.getApiKey('openrouter');
      },

      // Conversation management
      createConversation: (title = 'New Conversation') => {
        const id = Date.now().toString();
        set((state) => ({
          conversations: [
            ...state.conversations,
            {
              id,
              title,
              messages: [],
              lastActivity: new Date(),
              contextEnabled: state.contextEnabled,
            }
          ],
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
        }));
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      clearConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, messages: [] } : c
          ),
        }));
      },

      addMessage: (conversationId, message) => {
        const newMessage = {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date(),
        };

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, newMessage],
                  lastActivity: new Date(),
                }
              : c
          ),
        }));
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                }
              : c
          ),
        }));
      },

      // Message handling
      sendMessage: async (content) => {
        const state = get();
        if (!state.activeConversationId) {
          state.createConversation();
        }

        const conversationId = state.activeConversationId!;
        state.setLoading(true);

        try {
          // Add user message
          state.addMessage(conversationId, {
            role: 'user',
            content,
          });

          // Prepare context if enabled
          let context = '';
          if (state.contextEnabled) {
            set({ isProcessingContext: true });
            context = `${state.contextData.recentText}\n\n${
              state.contextData.storyBibleEntries
                .map((entry) => `${entry.name}: ${entry.description}`)
                .join('\n\n')
            }`;
            set({ isProcessingContext: false });
          }

          // Build messages for API
          const conversation = state.conversations.find(c => c.id === conversationId);
          const messages = conversation?.messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })) || [];

          // Get API response
          const response = await openRouterService.generateCompletion(messages, {
            model: state.selectedModel,
            temperature: state.temperature,
            maxTokens: state.maxTokens,
          });

          // Add AI response
          state.addMessage(conversationId, {
            role: 'assistant',
            content: response.choices[0].message.content,
            tokens: response.usage?.total_tokens,
          });
        } catch (error) {
          console.error('Failed to send message:', error);
          throw error;
        } finally {
          state.setLoading(false);
        }
      },
    }),
    {
      name: 'ai-store',
      partialize: (state) => ({
        conversations: state.conversations,
        selectedModel: state.selectedModel,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        contextEnabled: state.contextEnabled,
      }),
    }
  )
);

// Computed selector for current conversation messages
export const useCurrentMessages = () => {
  return useAIStore((state) => {
    const conversation = state.conversations.find(
      (c) => c.id === state.activeConversationId
    );
    return conversation?.messages || [];
  });
};
