import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationType = 'ai_score' | 'message' | 'system' | 'lead_hot'

export type Notification = {
  id: string
  title: string
  description: string
  time: string
  type: NotificationType
  read: boolean
  leadId?: string
}

export type Conversation = {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
  status: 'hot' | 'warm' | 'cold'
  avatar: string
  estado?: 'ACTIVO' | 'EXCLUIR'
}

export type Toast = {
  id: string
  title: string
  description?: string
  type?: 'default' | 'success' | 'error' | 'warning'
}

export type Lead = {
  id: string
  name: string
  company: string
  score: number
  source: string
  value: string
  assignee: string
  stage: string
  estado?: 'ACTIVO' | 'EXCLUIR'
}

export type Task = {
  id: string
  title: string
  leadName: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  type: 'call' | 'email' | 'demo' | 'followup'
}

export type UserProfile = {
  name: string
  email: string
  initials: string
}

interface AppState {
  notifications: Notification[]
  conversations: Conversation[]
  activeConversationId: string
  toasts: Toast[]
  pipelineLeads: Lead[]
  tasks: Task[]
  user: UserProfile
  branding: {
    primaryColor: string
    logoUrl: string
  }
  company: {
    name: string
    website: string
    address: string
  }
  _hasHydrated: boolean
  
  setHasHydrated: (state: boolean) => void
  
  setActiveConversationId: (id: string) => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  markConversationAsRead: (id: string) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  
  toggleLeadEstado: (id: string, estado: 'ACTIVO' | 'EXCLUIR') => void
  updateLeadStage: (id: string, stage: string) => void
  addTask: (task: Omit<Task, 'id'>) => void
  toggleTask: (id: string) => void
  updateBranding: (branding: Partial<AppState['branding']>) => void
  updateCompany: (company: Partial<AppState['company']>) => void
  setLeadsData: (leads: Lead[], conversations: Conversation[]) => void
  setUser: (user: UserProfile) => void
}

const INITIAL_NOTIFICATIONS: Notification[] = []

const INITIAL_CONVERSATIONS: Conversation[] = []

const INITIAL_LEADS: Lead[] = []

const INITIAL_TASKS: Task[] = []

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      notifications: INITIAL_NOTIFICATIONS,
      conversations: INITIAL_CONVERSATIONS,
      pipelineLeads: INITIAL_LEADS,
      tasks: INITIAL_TASKS,
      activeConversationId: '1',
      toasts: [],
      user: { name: '', email: '', initials: '' },
      branding: {
        primaryColor: '#10b981', // emerald-500 default
        logoUrl: '',
      },
      company: {
        name: 'FAIREX AI',
        website: 'https://fairex.com',
        address: '123 Innovation Drive, Tech City'
      },
      _hasHydrated: false,
      
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      setActiveConversationId: (id) => 
        set({ activeConversationId: id }),
      
      markNotificationAsRead: (id) => 
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        })),
        
      markAllNotificationsAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        })),

      markConversationAsRead: (id) =>
        set((state) => ({
          conversations: state.conversations.map(c =>
            c.id === id ? { ...c, unread: 0 } : c
          )
        })),

      addToast: (toast) => set((state) => {
        const id = Math.random().toString(36).substring(7)
        return { toasts: [...state.toasts, { ...toast, id }] }
      }),
      
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),

      toggleLeadEstado: (id, estado) => set((state) => ({
        pipelineLeads: state.pipelineLeads.map(l =>
          l.id === id ? { ...l, estado } : l
        ),
        conversations: state.conversations.map(c =>
          c.id === id ? { ...c, estado } : c
        )
      })),

      updateLeadStage: (id, stage) => set((state) => ({
        pipelineLeads: state.pipelineLeads.map(l =>
          l.id === id ? { ...l, stage } : l
        )
      })),

      addTask: (task) => set((state) => {
        const id = Math.random().toString(36).substring(7)
        return { tasks: [{ ...task, id }, ...state.tasks] }
      }),

      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map(t =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      })),

      updateBranding: (brandingParams) => set((state) => ({
        branding: { ...state.branding, ...brandingParams }
      })),

      updateCompany: (companyParams) => set((state) => ({
        company: { ...state.company, ...companyParams }
      })),

      setLeadsData: (leads, conversations) => set(() => ({
        pipelineLeads: leads,
        conversations: conversations
      })),

      setUser: (user) => set(() => ({ user }))
    }),
    {
      name: 'fairex-v1-storage', // clean state for V1 to purge ghost mocks
      partialize: (state) => ({
        pipelineLeads: state.pipelineLeads,
        tasks: state.tasks,
        branding: state.branding,
        company: state.company,
        notifications: state.notifications,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId
      }), // persist all editable state
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
        }
      }
    }
  )
)
