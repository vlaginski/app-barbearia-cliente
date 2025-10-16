'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient, isSupabaseConfigured, resetSupabaseInstance } from '@/lib/supabase'
import type { User } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há usuário logado no localStorage (apenas no cliente)
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('barbershop_user')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          console.error('Erro ao parsear usuário salvo:', error)
          localStorage.removeItem('barbershop_user')
        }
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Resetar instância para forçar nova verificação
      resetSupabaseInstance()
      
      // Verificar se o Supabase está configurado
      if (!isSupabaseConfigured()) {
        throw new Error('Para usar o sistema de login, você precisa configurar o banco de dados. Vá em Configurações do Projeto → Integrações → Selecione um projeto Supabase.')
      }

      const supabase = createSupabaseClient()
      
      if (!supabase) {
        throw new Error('Erro na conexão com o banco de dados. Verifique se o projeto Supabase está selecionado nas configurações.')
      }

      // Buscar usuário na tabela barbershop_users
      const { data: userData, error } = await supabase
        .from('barbershop_users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (error || !userData) {
        if (error?.code === 'PGRST116') {
          throw new Error('Email ou senha incorretos')
        }
        throw new Error('Erro na conexão com o banco de dados: ' + (error?.message || 'Erro desconhecido'))
      }

      const user = userData as User
      setUser(user)
      
      // Salvar no localStorage apenas no cliente
      if (typeof window !== 'undefined') {
        localStorage.setItem('barbershop_user', JSON.stringify(user))
      }
      
      return { success: true, user }
    } catch (error: any) {
      console.error('Erro no login:', error)
      return { success: false, error: error.message || 'Email ou senha incorretos' }
    }
  }

  const register = async (name: string, email: string, phone: string, password: string) => {
    try {
      // Resetar instância para forçar nova verificação
      resetSupabaseInstance()
      
      // Verificar se o Supabase está configurado
      if (!isSupabaseConfigured()) {
        throw new Error('Para usar o sistema de cadastro, você precisa configurar o banco de dados. Vá em Configurações do Projeto → Integrações → Selecione um projeto Supabase.')
      }

      const supabase = createSupabaseClient()
      
      if (!supabase) {
        throw new Error('Erro na conexão com o banco de dados. Verifique se o projeto Supabase está selecionado nas configurações.')
      }

      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('barbershop_users')
        .select('email')
        .eq('email', email)
        .single()

      if (existingUser) {
        throw new Error('Este email já está cadastrado')
      }

      // Criar novo usuário com senha
      const { data: userData, error } = await supabase
        .from('barbershop_users')
        .insert([
          {
            name,
            email,
            phone,
            password, // Salvando a senha (em produção deveria ser hash)
            role: 'user'
          }
        ])
        .select()
        .single()

      if (error) {
        if (error.code === '42P01') {
          throw new Error('Tabela do banco de dados não encontrada. Verifique se o banco está configurado corretamente.')
        }
        throw new Error('Erro ao criar conta: ' + error.message)
      }

      const user = userData as User
      setUser(user)
      
      // Salvar no localStorage apenas no cliente
      if (typeof window !== 'undefined') {
        localStorage.setItem('barbershop_user', JSON.stringify(user))
      }
      
      return { success: true, user }
    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      return { success: false, error: error.message || 'Erro ao criar conta' }
    }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('barbershop_user')
    }
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    isSupabaseConfigured: isSupabaseConfigured()
  }
}