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

// Função helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Função para criar cliente Supabase apenas quando necessário
export const createSupabaseClient = async () => {
  if (typeof window === 'undefined') return null
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Erro ao criar cliente Supabase:', error)
    return null
  }
}

// Cliente Supabase (lazy initialization)
let supabaseClient: any = null

export const getSupabase = async () => {
  if (typeof window === 'undefined') return null
  
  if (!supabaseClient) {
    supabaseClient = await createSupabaseClient()
  }
  return supabaseClient
}

// Export do cliente para compatibilidade (será null durante build)
export const supabase = null