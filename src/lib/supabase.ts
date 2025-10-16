import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Variável para armazenar a instância do cliente
let supabaseInstance: SupabaseClient | null = null

// Função para obter as variáveis de ambiente do Supabase
function getSupabaseConfig() {
  // Tentar diferentes formas de acessar as variáveis
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     (typeof window !== 'undefined' && (window as any).ENV?.NEXT_PUBLIC_SUPABASE_URL)
  
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                         (typeof window !== 'undefined' && (window as any).ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  return { supabaseUrl, supabaseAnonKey }
}

// Função para criar o cliente Supabase apenas quando necessário
export function createSupabaseClient(): SupabaseClient | null {
  // Verificar se estamos no lado do cliente
  if (typeof window === 'undefined') {
    return null
  }

  // Se já temos uma instância, retornar ela
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Obter configurações do Supabase
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Variáveis de ambiente do Supabase não configuradas')
    return null
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
    return supabaseInstance
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error)
    return null
  }
}

// Função para verificar se o Supabase está configurado
export function isSupabaseConfigured(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
  
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase'))
}

// Função para resetar a instância (útil para reconfiguração)
export function resetSupabaseInstance() {
  supabaseInstance = null
}

// Tipos para o banco de dados
export interface User {
  id: string
  email: string
  name: string
  phone: string
  password?: string // Campo opcional para senha
  role: 'admin' | 'user'
  created_at: string
}

export interface Appointment {
  id: string
  user_id: string
  date: string
  time: string
  service: string
  barber: string
  status: 'agendado' | 'cancelado' | 'concluido'
  price: number
  client_name: string
  client_phone: string
  created_at: string
}