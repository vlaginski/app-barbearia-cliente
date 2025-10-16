import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Variável para armazenar a instância do cliente
let supabaseInstance: SupabaseClient | null = null

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

  // Verificar se as variáveis de ambiente estão definidas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

// Export da instância para compatibilidade com código existente
export const supabase = createSupabaseClient()

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