export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          order_number: string
          customer_first_name: string
          customer_last_name: string
          customer_email: string
          shipping_address: string
          shipping_city: string
          shipping_state: string
          shipping_zip: string
          total_amount: number
          order_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_first_name: string
          customer_last_name: string
          customer_email: string
          shipping_address: string
          shipping_city: string
          shipping_state: string
          shipping_zip: string
          total_amount: number
          order_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_email?: string
          shipping_address?: string
          shipping_city?: string
          shipping_state?: string
          shipping_zip?: string
          total_amount?: number
          order_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: number
          product_name: string
          product_tagline: string
          price: number
          quantity: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: number
          product_name: string
          product_tagline: string
          price: number
          quantity: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: number
          product_name?: string
          product_tagline?: string
          price?: number
          quantity?: number
          subtotal?: number
          created_at?: string
        }
      }
    }
  }
}
