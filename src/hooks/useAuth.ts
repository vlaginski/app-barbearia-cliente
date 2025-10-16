'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
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
      const supabase = createSupabaseClient()
      
      if (!supabase) {
        throw new Error('Supabase não configurado')
      }

      // Buscar usuário na tabela barbershop_users
      const { data: userData, error } = await supabase
        .from('barbershop_users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (error || !userData) {
        throw new Error('Email ou senha incorretos')
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
      const supabase = createSupabaseClient()
      
      if (!supabase) {
        throw new Error('Supabase não configurado')
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

      if (error) throw error

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
    logout
  }
}