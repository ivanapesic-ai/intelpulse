export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cei_documents: {
        Row: {
          created_at: string | null
          file_size_bytes: number | null
          file_type: Database["public"]["Enums"]["document_type"]
          filename: string
          id: string
          page_count: number | null
          parse_status: Database["public"]["Enums"]["parse_status"] | null
          parsed_content: Json | null
          source: Database["public"]["Enums"]["document_source"] | null
          storage_path: string
          title: string | null
          updated_at: string | null
          upload_date: string | null
        }
        Insert: {
          created_at?: string | null
          file_size_bytes?: number | null
          file_type: Database["public"]["Enums"]["document_type"]
          filename: string
          id?: string
          page_count?: number | null
          parse_status?: Database["public"]["Enums"]["parse_status"] | null
          parsed_content?: Json | null
          source?: Database["public"]["Enums"]["document_source"] | null
          storage_path: string
          title?: string | null
          updated_at?: string | null
          upload_date?: string | null
        }
        Update: {
          created_at?: string | null
          file_size_bytes?: number | null
          file_type?: Database["public"]["Enums"]["document_type"]
          filename?: string
          id?: string
          page_count?: number | null
          parse_status?: Database["public"]["Enums"]["parse_status"] | null
          parsed_content?: Json | null
          source?: Database["public"]["Enums"]["document_source"] | null
          storage_path?: string
          title?: string | null
          updated_at?: string | null
          upload_date?: string | null
        }
        Relationships: []
      }
      dealroom_api_usage: {
        Row: {
          api_calls_limit: number | null
          api_calls_used: number | null
          created_at: string | null
          id: string
          last_sync_date: string | null
          period_end: string
          period_start: string
          updated_at: string | null
        }
        Insert: {
          api_calls_limit?: number | null
          api_calls_used?: number | null
          created_at?: string | null
          id?: string
          last_sync_date?: string | null
          period_end: string
          period_start: string
          updated_at?: string | null
        }
        Update: {
          api_calls_limit?: number | null
          api_calls_used?: number | null
          created_at?: string | null
          id?: string
          last_sync_date?: string | null
          period_end?: string
          period_start?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dealroom_cache: {
        Row: {
          cache_date: string
          companies_data: Json | null
          company_count: number | null
          created_at: string | null
          id: string
          keyword: string
          total_employees: number | null
          total_funding_eur: number | null
          total_patents: number | null
        }
        Insert: {
          cache_date?: string
          companies_data?: Json | null
          company_count?: number | null
          created_at?: string | null
          id?: string
          keyword: string
          total_employees?: number | null
          total_funding_eur?: number | null
          total_patents?: number | null
        }
        Update: {
          cache_date?: string
          companies_data?: Json | null
          company_count?: number | null
          created_at?: string | null
          id?: string
          keyword?: string
          total_employees?: number | null
          total_funding_eur?: number | null
          total_patents?: number | null
        }
        Relationships: []
      }
      dealroom_companies: {
        Row: {
          created_at: string | null
          dealroom_id: string
          description: string | null
          employees_count: number | null
          founded_year: number | null
          growth_stage: string | null
          hq_city: string | null
          hq_country: string | null
          id: string
          industries: string[] | null
          investors: string[] | null
          last_funding_amount_eur: number | null
          last_funding_date: string | null
          name: string
          news_items: Json | null
          patents_count: number | null
          raw_data: Json | null
          synced_at: string | null
          tagline: string | null
          total_funding_eur: number | null
          valuation_eur: number | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          dealroom_id: string
          description?: string | null
          employees_count?: number | null
          founded_year?: number | null
          growth_stage?: string | null
          hq_city?: string | null
          hq_country?: string | null
          id?: string
          industries?: string[] | null
          investors?: string[] | null
          last_funding_amount_eur?: number | null
          last_funding_date?: string | null
          name: string
          news_items?: Json | null
          patents_count?: number | null
          raw_data?: Json | null
          synced_at?: string | null
          tagline?: string | null
          total_funding_eur?: number | null
          valuation_eur?: number | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          dealroom_id?: string
          description?: string | null
          employees_count?: number | null
          founded_year?: number | null
          growth_stage?: string | null
          hq_city?: string | null
          hq_country?: string | null
          id?: string
          industries?: string[] | null
          investors?: string[] | null
          last_funding_amount_eur?: number | null
          last_funding_date?: string | null
          name?: string
          news_items?: Json | null
          patents_count?: number | null
          raw_data?: Json | null
          synced_at?: string | null
          tagline?: string | null
          total_funding_eur?: number | null
          valuation_eur?: number | null
          website?: string | null
        }
        Relationships: []
      }
      dealroom_sync_logs: {
        Row: {
          api_calls_made: number | null
          completed_at: string | null
          error_message: string | null
          id: string
          keywords_searched: string[] | null
          records_created: number | null
          records_fetched: number | null
          records_updated: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["sync_status"] | null
          sync_type: string
        }
        Insert: {
          api_calls_made?: number | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          keywords_searched?: string[] | null
          records_created?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["sync_status"] | null
          sync_type: string
        }
        Update: {
          api_calls_made?: number | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          keywords_searched?: string[] | null
          records_created?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["sync_status"] | null
          sync_type?: string
        }
        Relationships: []
      }
      document_technology_mentions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          document_id: string | null
          id: string
          keyword_id: string | null
          mention_context: string | null
          page_number: number | null
          policy_reference: string | null
          position_weight: number | null
          relevance_score: number | null
          semantic_similarity: number | null
          trl_mentioned: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          keyword_id?: string | null
          mention_context?: string | null
          page_number?: number | null
          policy_reference?: string | null
          position_weight?: number | null
          relevance_score?: number | null
          semantic_similarity?: number | null
          trl_mentioned?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          keyword_id?: string | null
          mention_context?: string | null
          page_number?: number | null
          policy_reference?: string | null
          position_weight?: number | null
          relevance_score?: number | null
          semantic_similarity?: number | null
          trl_mentioned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_technology_mentions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "cei_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_technology_mentions_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_company_mapping: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          keyword_id: string | null
          relevance_score: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          keyword_id?: string | null
          relevance_score?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          keyword_id?: string | null
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_company_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dealroom_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_company_mapping_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_processing_queue: {
        Row: {
          created_at: string
          error_message: string | null
          file_size_bytes: number | null
          filename: string | null
          id: string
          mentions_extracted: number | null
          processed_at: string | null
          retry_count: number | null
          source_page_id: string | null
          source_type: string
          status: string
          storage_path: string | null
          url: string
          zenodo_record_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_size_bytes?: number | null
          filename?: string | null
          id?: string
          mentions_extracted?: number | null
          processed_at?: string | null
          retry_count?: number | null
          source_page_id?: string | null
          source_type?: string
          status?: string
          storage_path?: string | null
          url: string
          zenodo_record_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_size_bytes?: number | null
          filename?: string | null
          id?: string
          mentions_extracted?: number | null
          processed_at?: string | null
          retry_count?: number | null
          source_page_id?: string | null
          source_type?: string
          status?: string
          storage_path?: string | null
          url?: string
          zenodo_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_processing_queue_source_page_id_fkey"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "scraped_web_content"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_web_content: {
        Row: {
          created_at: string
          id: string
          markdown_content: string | null
          page_type: string
          pdf_links: Json | null
          pdfs_processed: number | null
          scraped_at: string
          title: string | null
          updated_at: string
          url: string
          website: string
        }
        Insert: {
          created_at?: string
          id?: string
          markdown_content?: string | null
          page_type?: string
          pdf_links?: Json | null
          pdfs_processed?: number | null
          scraped_at?: string
          title?: string | null
          updated_at?: string
          url: string
          website: string
        }
        Update: {
          created_at?: string
          id?: string
          markdown_content?: string | null
          page_type?: string
          pdf_links?: Json | null
          pdfs_processed?: number | null
          scraped_at?: string
          title?: string | null
          updated_at?: string
          url?: string
          website?: string
        }
        Relationships: []
      }
      technologies: {
        Row: {
          avg_relevance_score: number | null
          avg_semantic_score: number | null
          avg_trl_mentioned: number | null
          composite_score: number | null
          corpus_rarity_score: number | null
          created_at: string | null
          dealroom_company_count: number | null
          description: string | null
          document_diversity: number | null
          document_mention_count: number | null
          employees_score: number | null
          eu_alignment_score: number | null
          id: string
          investment_score: number | null
          key_players: string[] | null
          keyword_id: string | null
          last_updated: string | null
          name: string
          network_centrality: number | null
          patents_score: number | null
          policy_mention_count: number | null
          total_employees: number | null
          total_funding_eur: number | null
          total_patents: number | null
          trend: Database["public"]["Enums"]["trend_direction"] | null
          trl_score: number | null
          visibility_score: number | null
          weighted_frequency_score: number | null
        }
        Insert: {
          avg_relevance_score?: number | null
          avg_semantic_score?: number | null
          avg_trl_mentioned?: number | null
          composite_score?: number | null
          corpus_rarity_score?: number | null
          created_at?: string | null
          dealroom_company_count?: number | null
          description?: string | null
          document_diversity?: number | null
          document_mention_count?: number | null
          employees_score?: number | null
          eu_alignment_score?: number | null
          id?: string
          investment_score?: number | null
          key_players?: string[] | null
          keyword_id?: string | null
          last_updated?: string | null
          name: string
          network_centrality?: number | null
          patents_score?: number | null
          policy_mention_count?: number | null
          total_employees?: number | null
          total_funding_eur?: number | null
          total_patents?: number | null
          trend?: Database["public"]["Enums"]["trend_direction"] | null
          trl_score?: number | null
          visibility_score?: number | null
          weighted_frequency_score?: number | null
        }
        Update: {
          avg_relevance_score?: number | null
          avg_semantic_score?: number | null
          avg_trl_mentioned?: number | null
          composite_score?: number | null
          corpus_rarity_score?: number | null
          created_at?: string | null
          dealroom_company_count?: number | null
          description?: string | null
          document_diversity?: number | null
          document_mention_count?: number | null
          employees_score?: number | null
          eu_alignment_score?: number | null
          id?: string
          investment_score?: number | null
          key_players?: string[] | null
          keyword_id?: string | null
          last_updated?: string | null
          name?: string
          network_centrality?: number | null
          patents_score?: number | null
          policy_mention_count?: number | null
          total_employees?: number | null
          total_funding_eur?: number | null
          total_patents?: number | null
          trend?: Database["public"]["Enums"]["trend_direction"] | null
          trl_score?: number | null
          visibility_score?: number | null
          weighted_frequency_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "technologies_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: true
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      technology_cooccurrences: {
        Row: {
          avg_combined_relevance: number | null
          cooccurrence_count: number | null
          created_at: string | null
          id: string
          keyword_id_a: string
          keyword_id_b: string
          last_seen_at: string | null
          source_documents: number | null
        }
        Insert: {
          avg_combined_relevance?: number | null
          cooccurrence_count?: number | null
          created_at?: string | null
          id?: string
          keyword_id_a: string
          keyword_id_b: string
          last_seen_at?: string | null
          source_documents?: number | null
        }
        Update: {
          avg_combined_relevance?: number | null
          cooccurrence_count?: number | null
          created_at?: string | null
          id?: string
          keyword_id_a?: string
          keyword_id_b?: string
          last_seen_at?: string | null
          source_documents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "technology_cooccurrences_keyword_id_a_fkey"
            columns: ["keyword_id_a"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technology_cooccurrences_keyword_id_b_fkey"
            columns: ["keyword_id_b"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      technology_keywords: {
        Row: {
          aliases: string[] | null
          created_at: string | null
          dealroom_tags: string[] | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          keyword: string
          parent_keyword_id: string | null
          source: Database["public"]["Enums"]["keyword_source"]
          updated_at: string | null
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string | null
          dealroom_tags?: string[] | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          keyword: string
          parent_keyword_id?: string | null
          source: Database["public"]["Enums"]["keyword_source"]
          updated_at?: string | null
        }
        Update: {
          aliases?: string[] | null
          created_at?: string | null
          dealroom_tags?: string[] | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          keyword?: string
          parent_keyword_id?: string | null
          source?: Database["public"]["Enums"]["keyword_source"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technology_keywords_parent_keyword_id_fkey"
            columns: ["parent_keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      web_technology_mentions: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          keyword_id: string
          mention_context: string | null
          policy_reference: string | null
          position_weight: number | null
          relevance_score: number | null
          semantic_similarity: number | null
          source_url: string | null
          trl_mentioned: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          keyword_id: string
          mention_context?: string | null
          policy_reference?: string | null
          position_weight?: number | null
          relevance_score?: number | null
          semantic_similarity?: number | null
          source_url?: string | null
          trl_mentioned?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          keyword_id?: string
          mention_context?: string | null
          policy_reference?: string | null
          position_weight?: number | null
          relevance_score?: number | null
          semantic_similarity?: number | null
          source_url?: string | null
          trl_mentioned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "web_technology_mentions_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      website_scrape_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          mentions_extracted: number | null
          pages_scraped: number | null
          pdfs_processed: number | null
          scrape_type: string
          started_at: string
          status: string
          website: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          mentions_extracted?: number | null
          pages_scraped?: number | null
          pdfs_processed?: number | null
          scrape_type: string
          started_at?: string
          status?: string
          website: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          mentions_extracted?: number | null
          pages_scraped?: number | null
          pdfs_processed?: number | null
          scrape_type?: string
          started_at?: string
          status?: string
          website?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_eu_alignment_score: {
        Args: { policy_count: number }
        Returns: number
      }
      calculate_network_centrality: { Args: never; Returns: undefined }
      calculate_tfidf_scores: { Args: never; Returns: undefined }
      calculate_trl_score: { Args: { avg_trl: number }; Returns: number }
      calculate_visibility_score: {
        Args: { mention_count: number }
        Returns: number
      }
      refresh_technology_scores: {
        Args: { tech_keyword_id: string }
        Returns: undefined
      }
      upsert_cooccurrence: {
        Args: { kw_a: string; kw_b: string; relevance_score?: number }
        Returns: undefined
      }
    }
    Enums: {
      document_source:
        | "teams"
        | "cei_sphere_website"
        | "eucloudedgeiot"
        | "manual"
        | "scraped"
      document_type: "pdf" | "pptx" | "docx"
      keyword_source: "cei_sphere" | "dealroom" | "manual"
      maturity_score: "0" | "1" | "2"
      parse_status: "pending" | "parsing" | "completed" | "failed"
      sync_status: "pending" | "running" | "completed" | "failed"
      trend_direction: "up" | "down" | "stable"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      document_source: [
        "teams",
        "cei_sphere_website",
        "eucloudedgeiot",
        "manual",
        "scraped",
      ],
      document_type: ["pdf", "pptx", "docx"],
      keyword_source: ["cei_sphere", "dealroom", "manual"],
      maturity_score: ["0", "1", "2"],
      parse_status: ["pending", "parsing", "completed", "failed"],
      sync_status: ["pending", "running", "completed", "failed"],
      trend_direction: ["up", "down", "stable"],
    },
  },
} as const
