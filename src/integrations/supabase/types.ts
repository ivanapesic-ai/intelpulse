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
      company_technology_evidence: {
        Row: {
          company_id: string | null
          confidence_score: number | null
          context: string | null
          created_at: string | null
          id: string
          keyword_id: string | null
          policy_reference: string | null
          source_reference: string
          source_type: string
          trl_mentioned: number | null
        }
        Insert: {
          company_id?: string | null
          confidence_score?: number | null
          context?: string | null
          created_at?: string | null
          id?: string
          keyword_id?: string | null
          policy_reference?: string | null
          source_reference: string
          source_type: string
          trl_mentioned?: number | null
        }
        Update: {
          company_id?: string | null
          confidence_score?: number | null
          context?: string | null
          created_at?: string | null
          id?: string
          keyword_id?: string | null
          policy_reference?: string | null
          source_reference?: string
          source_type?: string
          trl_mentioned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_technology_evidence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dealroom_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_technology_evidence_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "company_technology_evidence_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "company_technology_evidence_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "company_technology_evidence_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_scoring_factors: {
        Row: {
          concept_id: number | null
          created_at: string | null
          data_source: string | null
          evidence: string | null
          factor_name: string
          factor_type: string
          factor_value: string
          id: string
          keyword_id: string | null
          score_contribution: number
        }
        Insert: {
          concept_id?: number | null
          created_at?: string | null
          data_source?: string | null
          evidence?: string | null
          factor_name: string
          factor_type: string
          factor_value: string
          id?: string
          keyword_id?: string | null
          score_contribution: number
        }
        Update: {
          concept_id?: number | null
          created_at?: string | null
          data_source?: string | null
          evidence?: string | null
          factor_name?: string
          factor_type?: string
          factor_value?: string
          id?: string
          keyword_id?: string | null
          score_contribution?: number
        }
        Relationships: [
          {
            foreignKeyName: "concept_scoring_factors_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "concept_scoring_factors_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concept_heatmap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_scoring_factors_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concept_scoring_summary"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "concept_scoring_factors_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "domain_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_scoring_factors_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["domain_id"]
          },
          {
            foreignKeyName: "concept_scoring_factors_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "ontology_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_scoring_factors_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "sdv_ecosystem_companies"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "concept_scoring_factors_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "concept_scoring_factors_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "concept_scoring_factors_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "concept_scoring_factors_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      crunchbase_companies: {
        Row: {
          created_at: string | null
          crunchbase_url: string | null
          data_quality_score: number | null
          description: string | null
          founded_date: string | null
          full_description: string | null
          funding_rounds_count: number | null
          hq_country: string | null
          hq_location: string | null
          id: string
          industries: string[] | null
          industry_groups: string[] | null
          investor_count: number | null
          last_funding_date: string | null
          last_funding_type: string | null
          lead_investors: string[] | null
          number_of_articles: number | null
          number_of_employees: string | null
          operating_status: string | null
          organization_name: string
          patents_count: number | null
          source_export: string | null
          technology_keywords: string[] | null
          top_5_investors: string[] | null
          total_funding_usd: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          crunchbase_url?: string | null
          data_quality_score?: number | null
          description?: string | null
          founded_date?: string | null
          full_description?: string | null
          funding_rounds_count?: number | null
          hq_country?: string | null
          hq_location?: string | null
          id?: string
          industries?: string[] | null
          industry_groups?: string[] | null
          investor_count?: number | null
          last_funding_date?: string | null
          last_funding_type?: string | null
          lead_investors?: string[] | null
          number_of_articles?: number | null
          number_of_employees?: string | null
          operating_status?: string | null
          organization_name: string
          patents_count?: number | null
          source_export?: string | null
          technology_keywords?: string[] | null
          top_5_investors?: string[] | null
          total_funding_usd?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          crunchbase_url?: string | null
          data_quality_score?: number | null
          description?: string | null
          founded_date?: string | null
          full_description?: string | null
          funding_rounds_count?: number | null
          hq_country?: string | null
          hq_location?: string | null
          id?: string
          industries?: string[] | null
          industry_groups?: string[] | null
          investor_count?: number | null
          last_funding_date?: string | null
          last_funding_type?: string | null
          lead_investors?: string[] | null
          number_of_articles?: number | null
          number_of_employees?: string | null
          operating_status?: string | null
          organization_name?: string
          patents_count?: number | null
          source_export?: string | null
          technology_keywords?: string[] | null
          top_5_investors?: string[] | null
          total_funding_usd?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      crunchbase_import_logs: {
        Row: {
          companies_with_keywords: number | null
          completed_at: string | null
          data_quality_summary: Json | null
          error_rows: number | null
          errors: Json | null
          filename: string
          id: string
          imported_rows: number | null
          keyword_distribution: Json | null
          skipped_rows: number | null
          started_at: string | null
          status: string | null
          total_rows: number | null
        }
        Insert: {
          companies_with_keywords?: number | null
          completed_at?: string | null
          data_quality_summary?: Json | null
          error_rows?: number | null
          errors?: Json | null
          filename: string
          id?: string
          imported_rows?: number | null
          keyword_distribution?: Json | null
          skipped_rows?: number | null
          started_at?: string | null
          status?: string | null
          total_rows?: number | null
        }
        Update: {
          companies_with_keywords?: number | null
          completed_at?: string | null
          data_quality_summary?: Json | null
          error_rows?: number | null
          errors?: Json | null
          filename?: string
          id?: string
          imported_rows?: number | null
          keyword_distribution?: Json | null
          skipped_rows?: number | null
          started_at?: string | null
          status?: string | null
          total_rows?: number | null
        }
        Relationships: []
      }
      crunchbase_keyword_mapping: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          keyword_id: string | null
          match_confidence: number | null
          match_source: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          keyword_id?: string | null
          match_confidence?: number | null
          match_source?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          keyword_id?: string | null
          match_confidence?: number | null
          match_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "automotive_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crunchbase_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "sdv_ecosystem_companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
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
          acquired_by: string | null
          acquired_date: string | null
          acquisition_amount_eur: number | null
          created_at: string | null
          dealroom_id: string
          description: string | null
          employee_growth: number | null
          employees_count: number | null
          founded_year: number | null
          funding_rounds: Json | null
          growth_stage: string | null
          hq_city: string | null
          hq_country: string | null
          id: string
          industries: string[] | null
          investors: string[] | null
          is_quality_company: boolean | null
          jobs_count: number | null
          last_funding_amount_eur: number | null
          last_funding_date: string | null
          lead_investors: string[] | null
          name: string
          news_items: Json | null
          patents_count: number | null
          raw_data: Json | null
          status: string | null
          synced_at: string | null
          tagline: string | null
          tech_stack: string[] | null
          total_funding_eur: number | null
          valuation_eur: number | null
          website: string | null
        }
        Insert: {
          acquired_by?: string | null
          acquired_date?: string | null
          acquisition_amount_eur?: number | null
          created_at?: string | null
          dealroom_id: string
          description?: string | null
          employee_growth?: number | null
          employees_count?: number | null
          founded_year?: number | null
          funding_rounds?: Json | null
          growth_stage?: string | null
          hq_city?: string | null
          hq_country?: string | null
          id?: string
          industries?: string[] | null
          investors?: string[] | null
          is_quality_company?: boolean | null
          jobs_count?: number | null
          last_funding_amount_eur?: number | null
          last_funding_date?: string | null
          lead_investors?: string[] | null
          name: string
          news_items?: Json | null
          patents_count?: number | null
          raw_data?: Json | null
          status?: string | null
          synced_at?: string | null
          tagline?: string | null
          tech_stack?: string[] | null
          total_funding_eur?: number | null
          valuation_eur?: number | null
          website?: string | null
        }
        Update: {
          acquired_by?: string | null
          acquired_date?: string | null
          acquisition_amount_eur?: number | null
          created_at?: string | null
          dealroom_id?: string
          description?: string | null
          employee_growth?: number | null
          employees_count?: number | null
          founded_year?: number | null
          funding_rounds?: Json | null
          growth_stage?: string | null
          hq_city?: string | null
          hq_country?: string | null
          id?: string
          industries?: string[] | null
          investors?: string[] | null
          is_quality_company?: boolean | null
          jobs_count?: number | null
          last_funding_amount_eur?: number | null
          last_funding_date?: string | null
          lead_investors?: string[] | null
          name?: string
          news_items?: Json | null
          patents_count?: number | null
          raw_data?: Json | null
          status?: string | null
          synced_at?: string | null
          tagline?: string | null
          tech_stack?: string[] | null
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
      dealroom_taxonomy: {
        Row: {
          company_count: number | null
          created_at: string | null
          dealroom_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          parent_name: string | null
          slug: string | null
          taxonomy_type: string
        }
        Insert: {
          company_count?: number | null
          created_at?: string | null
          dealroom_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          parent_name?: string | null
          slug?: string | null
          taxonomy_type: string
        }
        Update: {
          company_count?: number | null
          created_at?: string | null
          dealroom_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          parent_name?: string | null
          slug?: string | null
          taxonomy_type?: string
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
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "document_technology_mentions_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "document_technology_mentions_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
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
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_company_mapping_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_company_mapping_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
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
      keyword_industry_mappings: {
        Row: {
          confidence_score: number
          created_at: string
          dealroom_term: string
          id: string
          keyword_id: string
          mapped_by: string
          reasoning: string | null
          relationship_type: string
          term_type: string
          updated_at: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          confidence_score: number
          created_at?: string
          dealroom_term: string
          id?: string
          keyword_id: string
          mapped_by?: string
          reasoning?: string | null
          relationship_type: string
          term_type: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          confidence_score?: number
          created_at?: string
          dealroom_term?: string
          id?: string
          keyword_id?: string
          mapped_by?: string
          reasoning?: string | null
          relationship_type?: string
          term_type?: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_industry_mappings_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_industry_mappings_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_industry_mappings_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_industry_mappings_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_signal_snapshots: {
        Row: {
          company_count: number | null
          composite_score: number | null
          created_at: string
          id: string
          investment_score: number | null
          keyword_id: string
          news_mention_count: number | null
          patents_score: number | null
          snapshot_date: string
          total_employees: number | null
          total_funding_usd: number | null
          total_patents: number | null
          visibility_score: number | null
        }
        Insert: {
          company_count?: number | null
          composite_score?: number | null
          created_at?: string
          id?: string
          investment_score?: number | null
          keyword_id: string
          news_mention_count?: number | null
          patents_score?: number | null
          snapshot_date?: string
          total_employees?: number | null
          total_funding_usd?: number | null
          total_patents?: number | null
          visibility_score?: number | null
        }
        Update: {
          company_count?: number | null
          composite_score?: number | null
          created_at?: string
          id?: string
          investment_score?: number | null
          keyword_id?: string
          news_mention_count?: number | null
          patents_score?: number | null
          snapshot_date?: string
          total_employees?: number | null
          total_funding_usd?: number | null
          total_patents?: number | null
          visibility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_signal_snapshots_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_signal_snapshots_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_signal_snapshots_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_signal_snapshots_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_standards: {
        Row: {
          body_type: string
          created_at: string
          description: string | null
          id: string
          issuing_body: string
          keyword_id: string
          standard_code: string
          standard_title: string
          status: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          body_type?: string
          created_at?: string
          description?: string | null
          id?: string
          issuing_body: string
          keyword_id: string
          standard_code: string
          standard_title: string
          status?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          body_type?: string
          created_at?: string
          description?: string | null
          id?: string
          issuing_body?: string
          keyword_id?: string
          standard_code?: string
          standard_title?: string
          status?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_standards_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_standards_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_standards_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_standards_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      news_items: {
        Row: {
          created_at: string
          description: string | null
          fetched_at: string
          id: string
          image_url: string | null
          published_at: string | null
          source_feed: string
          source_name: string | null
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fetched_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_feed: string
          source_name?: string | null
          title: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fetched_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_feed?: string
          source_name?: string | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      news_keyword_matches: {
        Row: {
          created_at: string
          id: string
          keyword_id: string
          match_confidence: number | null
          match_source: string | null
          news_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          keyword_id: string
          match_confidence?: number | null
          match_source?: string | null
          news_id: string
        }
        Update: {
          created_at?: string
          id?: string
          keyword_id?: string
          match_confidence?: number | null
          match_source?: string | null
          news_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_keyword_matches_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "news_keyword_matches_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "news_keyword_matches_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "news_keyword_matches_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_keyword_matches_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_items"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_concepts: {
        Row: {
          acronym: string | null
          challenge_score: number | null
          concept_level: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          domain_id: number | null
          growth_rate_yoy: number | null
          id: number
          is_core: boolean | null
          last_scored_at: string | null
          market_size_eur: number | null
          maturity_stage: string | null
          name: string
          opportunity_score: number | null
          parent_concept_id: number | null
          synonyms: string[] | null
        }
        Insert: {
          acronym?: string | null
          challenge_score?: number | null
          concept_level?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          domain_id?: number | null
          growth_rate_yoy?: number | null
          id?: number
          is_core?: boolean | null
          last_scored_at?: string | null
          market_size_eur?: number | null
          maturity_stage?: string | null
          name: string
          opportunity_score?: number | null
          parent_concept_id?: number | null
          synonyms?: string[] | null
        }
        Update: {
          acronym?: string | null
          challenge_score?: number | null
          concept_level?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          domain_id?: number | null
          growth_rate_yoy?: number | null
          id?: number
          is_core?: boolean | null
          last_scored_at?: string | null
          market_size_eur?: number | null
          maturity_stage?: string | null
          name?: string
          opportunity_score?: number | null
          parent_concept_id?: number | null
          synonyms?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ontology_concepts_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "ontology_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_concepts_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "sdv_ecosystem_companies"
            referencedColumns: ["domain_id"]
          },
          {
            foreignKeyName: "ontology_concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "ontology_concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "concept_heatmap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "concept_scoring_summary"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "ontology_concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "domain_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["domain_id"]
          },
          {
            foreignKeyName: "ontology_concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "ontology_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "sdv_ecosystem_companies"
            referencedColumns: ["concept_id"]
          },
        ]
      }
      ontology_domains: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      ontology_relationships: {
        Row: {
          concept_from_id: number | null
          concept_to_id: number | null
          created_at: string | null
          description: string | null
          id: number
          relationship_type: string
          strength: number | null
        }
        Insert: {
          concept_from_id?: number | null
          concept_to_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          relationship_type: string
          strength?: number | null
        }
        Update: {
          concept_from_id?: number | null
          concept_to_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          relationship_type?: string
          strength?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ontology_relationships_concept_from_id_fkey"
            columns: ["concept_from_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_from_id_fkey"
            columns: ["concept_from_id"]
            isOneToOne: false
            referencedRelation: "concept_heatmap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_from_id_fkey"
            columns: ["concept_from_id"]
            isOneToOne: false
            referencedRelation: "concept_scoring_summary"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_from_id_fkey"
            columns: ["concept_from_id"]
            isOneToOne: false
            referencedRelation: "domain_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_from_id_fkey"
            columns: ["concept_from_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["domain_id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_from_id_fkey"
            columns: ["concept_from_id"]
            isOneToOne: false
            referencedRelation: "ontology_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_from_id_fkey"
            columns: ["concept_from_id"]
            isOneToOne: false
            referencedRelation: "sdv_ecosystem_companies"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_to_id_fkey"
            columns: ["concept_to_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_to_id_fkey"
            columns: ["concept_to_id"]
            isOneToOne: false
            referencedRelation: "concept_heatmap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_to_id_fkey"
            columns: ["concept_to_id"]
            isOneToOne: false
            referencedRelation: "concept_scoring_summary"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_to_id_fkey"
            columns: ["concept_to_id"]
            isOneToOne: false
            referencedRelation: "domain_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_to_id_fkey"
            columns: ["concept_to_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["domain_id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_to_id_fkey"
            columns: ["concept_to_id"]
            isOneToOne: false
            referencedRelation: "ontology_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ontology_relationships_concept_to_id_fkey"
            columns: ["concept_to_id"]
            isOneToOne: false
            referencedRelation: "sdv_ecosystem_companies"
            referencedColumns: ["concept_id"]
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
      processing_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          progress: number | null
          result: Json | null
          status: string
          target_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          progress?: number | null
          result?: Json | null
          status?: string
          target_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          progress?: number | null
          result?: Json | null
          status?: string
          target_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      research_signals: {
        Row: {
          citation_count: number | null
          co_author_network: Json | null
          created_at: string
          growth_rate_yoy: number | null
          h_index: number | null
          id: string
          keyword_id: string
          research_score: number | null
          snapshot_date: string
          top_institutions: Json | null
          top_papers: Json | null
          total_works: number | null
          works_last_2y: number | null
          works_last_5y: number | null
        }
        Insert: {
          citation_count?: number | null
          co_author_network?: Json | null
          created_at?: string
          growth_rate_yoy?: number | null
          h_index?: number | null
          id?: string
          keyword_id: string
          research_score?: number | null
          snapshot_date?: string
          top_institutions?: Json | null
          top_papers?: Json | null
          total_works?: number | null
          works_last_2y?: number | null
          works_last_5y?: number | null
        }
        Update: {
          citation_count?: number | null
          co_author_network?: Json | null
          created_at?: string
          growth_rate_yoy?: number | null
          h_index?: number | null
          id?: string
          keyword_id?: string
          research_score?: number | null
          snapshot_date?: string
          top_institutions?: Json | null
          top_papers?: Json | null
          total_works?: number | null
          works_last_2y?: number | null
          works_last_5y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "research_signals_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "research_signals_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "research_signals_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "research_signals_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_feed_sources: {
        Row: {
          created_at: string
          fetch_frequency_hours: number | null
          id: string
          is_active: boolean
          last_fetched_at: string | null
          name: string
          url: string
        }
        Insert: {
          created_at?: string
          fetch_frequency_hours?: number | null
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          name: string
          url: string
        }
        Update: {
          created_at?: string
          fetch_frequency_hours?: number | null
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          name?: string
          url?: string
        }
        Relationships: []
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
          challenge_score: number | null
          composite_score: number | null
          corpus_rarity_score: number | null
          created_at: string | null
          dealroom_company_count: number | null
          description: string | null
          document_diversity: number | null
          document_insights: Json | null
          document_mention_count: number | null
          employees_score: number | null
          eu_alignment_score: number | null
          id: string
          investment_score: number | null
          key_players: string[] | null
          keyword_id: string | null
          last_updated: string | null
          log_composite_score: number | null
          market_signals: Json | null
          name: string
          network_centrality: number | null
          news_mention_count: number | null
          opportunity_score: number | null
          patents_score: number | null
          policy_mention_count: number | null
          recent_news: Json | null
          research_citations: number | null
          research_growth_rate: number | null
          research_score: number | null
          sector_tags: string[] | null
          total_employees: number | null
          total_funding_eur: number | null
          total_patents: number | null
          total_research_works: number | null
          trend: Database["public"]["Enums"]["trend_direction"] | null
          trl_score: number | null
          visibility_score: number | null
          weighted_frequency_score: number | null
        }
        Insert: {
          avg_relevance_score?: number | null
          avg_semantic_score?: number | null
          avg_trl_mentioned?: number | null
          challenge_score?: number | null
          composite_score?: number | null
          corpus_rarity_score?: number | null
          created_at?: string | null
          dealroom_company_count?: number | null
          description?: string | null
          document_diversity?: number | null
          document_insights?: Json | null
          document_mention_count?: number | null
          employees_score?: number | null
          eu_alignment_score?: number | null
          id?: string
          investment_score?: number | null
          key_players?: string[] | null
          keyword_id?: string | null
          last_updated?: string | null
          log_composite_score?: number | null
          market_signals?: Json | null
          name: string
          network_centrality?: number | null
          news_mention_count?: number | null
          opportunity_score?: number | null
          patents_score?: number | null
          policy_mention_count?: number | null
          recent_news?: Json | null
          research_citations?: number | null
          research_growth_rate?: number | null
          research_score?: number | null
          sector_tags?: string[] | null
          total_employees?: number | null
          total_funding_eur?: number | null
          total_patents?: number | null
          total_research_works?: number | null
          trend?: Database["public"]["Enums"]["trend_direction"] | null
          trl_score?: number | null
          visibility_score?: number | null
          weighted_frequency_score?: number | null
        }
        Update: {
          avg_relevance_score?: number | null
          avg_semantic_score?: number | null
          avg_trl_mentioned?: number | null
          challenge_score?: number | null
          composite_score?: number | null
          corpus_rarity_score?: number | null
          created_at?: string | null
          dealroom_company_count?: number | null
          description?: string | null
          document_diversity?: number | null
          document_insights?: Json | null
          document_mention_count?: number | null
          employees_score?: number | null
          eu_alignment_score?: number | null
          id?: string
          investment_score?: number | null
          key_players?: string[] | null
          keyword_id?: string | null
          last_updated?: string | null
          log_composite_score?: number | null
          market_signals?: Json | null
          name?: string
          network_centrality?: number | null
          news_mention_count?: number | null
          opportunity_score?: number | null
          patents_score?: number | null
          policy_mention_count?: number | null
          recent_news?: Json | null
          research_citations?: number | null
          research_growth_rate?: number | null
          research_score?: number | null
          sector_tags?: string[] | null
          total_employees?: number | null
          total_funding_eur?: number | null
          total_patents?: number | null
          total_research_works?: number | null
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
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technologies_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: true
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technologies_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: true
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
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
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technology_cooccurrences_keyword_id_a_fkey"
            columns: ["keyword_id_a"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technology_cooccurrences_keyword_id_a_fkey"
            columns: ["keyword_id_a"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
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
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technology_cooccurrences_keyword_id_b_fkey"
            columns: ["keyword_id_b"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technology_cooccurrences_keyword_id_b_fkey"
            columns: ["keyword_id_b"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
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
          dealroom_industries: string[] | null
          dealroom_sub_industries: string[] | null
          dealroom_tags: string[] | null
          description: string | null
          display_name: string
          excluded_from_sdv: boolean | null
          id: string
          is_active: boolean | null
          keyword: string
          ontology_concept_id: number | null
          parent_keyword_id: string | null
          source: Database["public"]["Enums"]["keyword_source"]
          updated_at: string | null
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string | null
          dealroom_industries?: string[] | null
          dealroom_sub_industries?: string[] | null
          dealroom_tags?: string[] | null
          description?: string | null
          display_name: string
          excluded_from_sdv?: boolean | null
          id?: string
          is_active?: boolean | null
          keyword: string
          ontology_concept_id?: number | null
          parent_keyword_id?: string | null
          source: Database["public"]["Enums"]["keyword_source"]
          updated_at?: string | null
        }
        Update: {
          aliases?: string[] | null
          created_at?: string | null
          dealroom_industries?: string[] | null
          dealroom_sub_industries?: string[] | null
          dealroom_tags?: string[] | null
          description?: string | null
          display_name?: string
          excluded_from_sdv?: boolean | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          ontology_concept_id?: number | null
          parent_keyword_id?: string | null
          source?: Database["public"]["Enums"]["keyword_source"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["ontology_concept_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["ontology_concept_id"]
            isOneToOne: false
            referencedRelation: "concept_heatmap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["ontology_concept_id"]
            isOneToOne: false
            referencedRelation: "concept_scoring_summary"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["ontology_concept_id"]
            isOneToOne: false
            referencedRelation: "domain_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["ontology_concept_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["domain_id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["ontology_concept_id"]
            isOneToOne: false
            referencedRelation: "ontology_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["ontology_concept_id"]
            isOneToOne: false
            referencedRelation: "sdv_ecosystem_companies"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "technology_keywords_parent_keyword_id_fkey"
            columns: ["parent_keyword_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technology_keywords_parent_keyword_id_fkey"
            columns: ["parent_keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technology_keywords_parent_keyword_id_fkey"
            columns: ["parent_keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technology_keywords_parent_keyword_id_fkey"
            columns: ["parent_keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          created_at: string
          id: string
          keyword_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          keyword_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          keyword_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_watchlist_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "user_watchlist_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "user_watchlist_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "user_watchlist_keyword_id_fkey"
            columns: ["keyword_id"]
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
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "web_technology_mentions_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "web_technology_mentions_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
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
      automotive_companies: {
        Row: {
          created_at: string | null
          crunchbase_url: string | null
          data_quality_score: number | null
          description: string | null
          founded_date: string | null
          full_description: string | null
          funding_rounds_count: number | null
          hq_country: string | null
          hq_location: string | null
          id: string | null
          industries: string[] | null
          industry_groups: string[] | null
          investor_count: number | null
          last_funding_date: string | null
          last_funding_type: string | null
          lead_investors: string[] | null
          number_of_articles: number | null
          number_of_employees: string | null
          operating_status: string | null
          organization_name: string | null
          patents_count: number | null
          source_export: string | null
          technology_keywords: string[] | null
          top_5_investors: string[] | null
          total_funding_usd: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          crunchbase_url?: string | null
          data_quality_score?: number | null
          description?: string | null
          founded_date?: string | null
          full_description?: string | null
          funding_rounds_count?: number | null
          hq_country?: string | null
          hq_location?: string | null
          id?: string | null
          industries?: string[] | null
          industry_groups?: string[] | null
          investor_count?: number | null
          last_funding_date?: string | null
          last_funding_type?: string | null
          lead_investors?: string[] | null
          number_of_articles?: number | null
          number_of_employees?: string | null
          operating_status?: string | null
          organization_name?: string | null
          patents_count?: number | null
          source_export?: string | null
          technology_keywords?: string[] | null
          top_5_investors?: string[] | null
          total_funding_usd?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          crunchbase_url?: string | null
          data_quality_score?: number | null
          description?: string | null
          founded_date?: string | null
          full_description?: string | null
          funding_rounds_count?: number | null
          hq_country?: string | null
          hq_location?: string | null
          id?: string | null
          industries?: string[] | null
          industry_groups?: string[] | null
          investor_count?: number | null
          last_funding_date?: string | null
          last_funding_type?: string | null
          lead_investors?: string[] | null
          number_of_articles?: number | null
          number_of_employees?: string | null
          operating_status?: string | null
          organization_name?: string | null
          patents_count?: number | null
          source_export?: string | null
          technology_keywords?: string[] | null
          top_5_investors?: string[] | null
          total_funding_usd?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      co_matrix_distribution: {
        Row: {
          avg_challenge: number | null
          avg_opportunity: number | null
          concept_count: number | null
          investment_priority: number | null
          strategic_quadrant: string | null
          total_companies: number | null
          total_funding_billions: number | null
        }
        Relationships: []
      }
      combined_technology_graph: {
        Row: {
          composite_score: number | null
          concept_id: number | null
          concept_name: string | null
          domain_name: string | null
          is_core: boolean | null
          keyword_id: string | null
          keyword_name: string | null
          sdv_company_count: number | null
          total_funding_usd: number | null
          total_patents: number | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          data_source: string | null
          description: string | null
          founded_date: string | null
          headquarters_location: string | null
          hq_country: string | null
          id: string | null
          industries: string[] | null
          industry_groups: string[] | null
          last_funding_date: string | null
          last_funding_type: string | null
          last_updated: string | null
          lead_investors: string[] | null
          name: string | null
          number_of_employees: string | null
          operating_status: string | null
          patents_count: number | null
          top_5_investors: string[] | null
          total_funding_eur: number | null
          total_funding_usd: number | null
          website: string | null
        }
        Insert: {
          data_source?: never
          description?: string | null
          founded_date?: string | null
          headquarters_location?: string | null
          hq_country?: string | null
          id?: string | null
          industries?: string[] | null
          industry_groups?: string[] | null
          last_funding_date?: string | null
          last_funding_type?: string | null
          last_updated?: string | null
          lead_investors?: string[] | null
          name?: string | null
          number_of_employees?: string | null
          operating_status?: string | null
          patents_count?: number | null
          top_5_investors?: string[] | null
          total_funding_eur?: never
          total_funding_usd?: number | null
          website?: string | null
        }
        Update: {
          data_source?: never
          description?: string | null
          founded_date?: string | null
          headquarters_location?: string | null
          hq_country?: string | null
          id?: string | null
          industries?: string[] | null
          industry_groups?: string[] | null
          last_funding_date?: string | null
          last_funding_type?: string | null
          last_updated?: string | null
          lead_investors?: string[] | null
          name?: string | null
          number_of_employees?: string | null
          operating_status?: string | null
          patents_count?: number | null
          top_5_investors?: string[] | null
          total_funding_eur?: never
          total_funding_usd?: number | null
          website?: string | null
        }
        Relationships: []
      }
      company_concept_mapping: {
        Row: {
          company_id: string | null
          concept_id: number | null
          created_at: string | null
          data_source: string | null
          id: string | null
          match_source: string | null
          relevance_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "automotive_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crunchbase_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "sdv_ecosystem_companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concept_heatmap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concept_scoring_summary"
            referencedColumns: ["concept_id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "domain_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["domain_id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "ontology_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technology_keywords_ontology_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "sdv_ecosystem_companies"
            referencedColumns: ["concept_id"]
          },
        ]
      }
      company_keyword_mapping: {
        Row: {
          company_id: string | null
          created_at: string | null
          data_source: string | null
          id: string | null
          keyword_id: string | null
          match_source: string | null
          relevance_score: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          data_source?: never
          id?: string | null
          keyword_id?: string | null
          match_source?: string | null
          relevance_score?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          data_source?: never
          id?: string | null
          keyword_id?: string | null
          match_source?: string | null
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "automotive_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crunchbase_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "sdv_ecosystem_companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "crunchbase_keyword_mapping_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_heatmap: {
        Row: {
          acronym: string | null
          challenge_score: number | null
          company_count: number | null
          concept: string | null
          description: string | null
          domain_code: string | null
          domain_name: string | null
          growth_rate_yoy: number | null
          id: number | null
          investment_priority: number | null
          is_core: boolean | null
          last_scored_at: string | null
          market_size_eur: number | null
          maturity_stage: string | null
          opportunity_score: number | null
          strategic_quadrant: string | null
          total_funding_eur: number | null
          total_patents: number | null
        }
        Relationships: []
      }
      concept_scoring_summary: {
        Row: {
          acronym: string | null
          challenge_factors: Json | null
          challenge_score: number | null
          concept_id: number | null
          concept_name: string | null
          domain_name: string | null
          last_scored_at: string | null
          maturity_stage: string | null
          opportunity_factors: Json | null
          opportunity_score: number | null
        }
        Relationships: []
      }
      domain_overview: {
        Row: {
          challenge_score: number | null
          company_count: number | null
          description: string | null
          display_order: number | null
          eu_company_count: number | null
          id: number | null
          maturity_stage: string | null
          name: string | null
          opportunity_score: number | null
          strategic_quadrant: string | null
          total_funding_usd: number | null
          total_patents: number | null
        }
        Relationships: []
      }
      keyword_mapping_summary: {
        Row: {
          avg_confidence: number | null
          keyword_id: string | null
          keyword_name: string | null
          keyword_source: Database["public"]["Enums"]["keyword_source"] | null
          last_mapped_at: string | null
          primary_mappings: number | null
          related_mappings: number | null
          tangential_mappings: number | null
          total_mappings: number | null
          verified_mappings: number | null
        }
        Relationships: []
      }
      keyword_overview: {
        Row: {
          aliases: string[] | null
          company_count: number | null
          description: string | null
          display_name: string | null
          domain_challenge: number | null
          domain_id: number | null
          domain_name: string | null
          domain_opportunity: number | null
          keyword: string | null
          keyword_id: string | null
          total_funding_usd: number | null
          total_patents: number | null
        }
        Relationships: []
      }
      maturity_stage_analysis: {
        Row: {
          avg_challenge: number | null
          avg_growth_rate: number | null
          avg_opportunity: number | null
          concept_count: number | null
          maturity_stage: string | null
          total_companies: number | null
          total_funding_eur: number | null
        }
        Relationships: []
      }
      sdv_ecosystem_companies: {
        Row: {
          company_id: string | null
          company_name: string | null
          concept_id: number | null
          concept_name: string | null
          description: string | null
          domain_id: number | null
          domain_name: string | null
          founded_date: string | null
          hq_country: string | null
          industries: string[] | null
          is_core: boolean | null
          number_of_employees: string | null
          total_funding_usd: number | null
        }
        Relationships: []
      }
      technology_intelligence: {
        Row: {
          avg_relevance_score: number | null
          avg_semantic_score: number | null
          avg_trl_mentioned: number | null
          company_names: string[] | null
          composite_score: number | null
          corpus_rarity_score: number | null
          dealroom_company_count: number | null
          display_name: string | null
          document_diversity: number | null
          document_mention_count: number | null
          employees_score: number | null
          eu_alignment_score: number | null
          evidence_by_source: Json | null
          id: string | null
          investment_score: number | null
          key_players: string[] | null
          keyword_description: string | null
          keyword_id: string | null
          last_updated: string | null
          name: string | null
          network_centrality: number | null
          policy_mention_count: number | null
          total_employees: number | null
          total_funding_eur: number | null
          total_patents: number | null
          trend: Database["public"]["Enums"]["trend_direction"] | null
          trl_distribution: Json | null
          trl_score: number | null
          visibility_score: number | null
          weighted_frequency_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "technologies_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: true
            referencedRelation: "combined_technology_graph"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technologies_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: true
            referencedRelation: "keyword_mapping_summary"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technologies_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: true
            referencedRelation: "keyword_overview"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "technologies_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: true
            referencedRelation: "technology_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aggregate_crunchbase_signals: {
        Args: never
        Returns: {
          companies_with_data: number
          keywords_processed: number
          total_funding_aggregated: number
          total_patents_aggregated: number
        }[]
      }
      aggregate_document_insights: {
        Args: { tech_keyword_id: string }
        Returns: Json
      }
      aggregate_patent_scores: {
        Args: never
        Returns: {
          keywords_updated: number
          total_patents_aggregated: number
        }[]
      }
      apply_co_scores_to_technologies: {
        Args: never
        Returns: {
          avg_challenge: number
          avg_opportunity: number
          keywords_updated: number
        }[]
      }
      calculate_challenge_opportunity_scores: {
        Args: { tech_keyword_id: string }
        Returns: undefined
      }
      calculate_co_scores: {
        Args: { tech_keyword_id: string }
        Returns: undefined
      }
      calculate_eu_alignment_score: {
        Args: { policy_count: number }
        Returns: number
      }
      calculate_market_response_count: {
        Args: { p_keyword_id: string }
        Returns: number
      }
      calculate_market_response_score: {
        Args: { p_keyword_id: string }
        Returns: number
      }
      calculate_network_centrality: { Args: never; Returns: undefined }
      calculate_technology_challenge_score: {
        Args: {
          p_additional_impact?: number
          p_integration?: string
          p_maturity?: string
          p_regulatory?: string
          p_roi_clarity?: string
          p_skills_gap?: string
        }
        Returns: number
      }
      calculate_technology_opportunity_score: {
        Args: {
          p_additional_impact?: number
          p_company_count?: number
          p_growth_rate_yoy?: number
          p_market_size_eur?: number
          p_strategic_alignment_count?: number
        }
        Returns: number
      }
      calculate_tfidf_scores: { Args: never; Returns: undefined }
      calculate_trl_score: { Args: { avg_trl: number }; Returns: number }
      calculate_visibility_score: {
        Args: { mention_count: number }
        Returns: number
      }
      calculate_weighted_composite_score: {
        Args: never
        Returns: {
          keywords_updated: number
          score_range: string
        }[]
      }
      can_manage_users: { Args: { _user_id: string }; Returns: boolean }
      explain_concept_score: {
        Args: { p_concept_id: number }
        Returns: {
          challenge_explanation: string
          challenge_score: number
          company_count: number
          concept_acronym: string
          concept_name: string
          maturity: string
          opportunity_explanation: string
          opportunity_score: number
          quadrant: string
          top_challenge_barriers: string[]
          top_opportunity_drivers: string[]
          total_funding_eur: number
        }[]
      }
      get_concept_top_companies: {
        Args: { p_concept_id: number; p_limit?: number }
        Returns: {
          company_id: string
          company_name: string
          data_source: string
          headquarters_location: string
          hq_country: string
          keywords: string[]
          total_funding_eur: number
        }[]
      }
      get_news_timeline: {
        Args: { p_keyword_id: string; p_weeks?: number }
        Returns: {
          mention_count: number
          week_start: string
        }[]
      }
      get_news_trends: {
        Args: { p_limit?: number; p_window_days?: number }
        Returns: {
          current_count: number
          display_name: string
          keyword_id: string
          previous_count: number
          total_all_time: number
          trend_direction: string
          trend_velocity: number
        }[]
      }
      get_strategic_quadrant: {
        Args: { p_challenge_score: number; p_opportunity_score: number }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_sdv_company: { Args: { company_id: string }; Returns: boolean }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      populate_company_evidence: {
        Args: never
        Returns: {
          companies_linked: number
          evidence_created: number
          technologies_linked: number
        }[]
      }
      populate_cooccurrences_from_companies: {
        Args: never
        Returns: {
          pairs_created: number
          pairs_updated: number
          quality_companies_used: number
        }[]
      }
      refresh_log_composite_scores: {
        Args: never
        Returns: {
          keywords_updated: number
          max_score: number
          min_score: number
        }[]
      }
      refresh_technology_intelligence: { Args: never; Returns: undefined }
      refresh_technology_scores: {
        Args: { tech_keyword_id: string }
        Returns: undefined
      }
      rematch_all_news: {
        Args: never
        Returns: {
          articles_processed: number
          keywords_matched: number
          new_matches_created: number
        }[]
      }
      score_all_technologies: {
        Args: never
        Returns: {
          challenge_score: number
          company_count: number
          keyword_id: string
          keyword_name: string
          opportunity_score: number
          quadrant: string
          total_funding: number
        }[]
      }
      sync_keyword_data_pipeline: { Args: never; Returns: Json }
      upsert_cooccurrence: {
        Args: { kw_a: string; kw_b: string; relevance_score?: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "viewer"
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
      app_role: ["superadmin", "admin", "viewer"],
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
