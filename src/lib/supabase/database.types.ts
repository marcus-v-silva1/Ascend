export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string | null;
          city: string | null;
          company: string;
          country: string | null;
          created_at: string;
          id: string;
          next_step: string | null;
          next_step_at: string | null;
          notes: string | null;
          role: string;
          salary: string | null;
          status: Database["public"]["Enums"]["application_status"];
          url: string | null;
          user_id: string;
          visa_route: string | null;
        };
        ComputedFields: never;
        Insert: {
          applied_at?: string | null;
          city?: string | null;
          company: string;
          country?: string | null;
          created_at?: string;
          id?: string;
          next_step?: string | null;
          next_step_at?: string | null;
          notes?: string | null;
          role: string;
          salary?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          url?: string | null;
          user_id?: string;
          visa_route?: string | null;
        };
        Update: {
          applied_at?: string | null;
          city?: string | null;
          company?: string;
          country?: string | null;
          created_at?: string;
          id?: string;
          next_step?: string | null;
          next_step_at?: string | null;
          notes?: string | null;
          role?: string;
          salary?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          url?: string | null;
          user_id?: string;
          visa_route?: string | null;
        };
        Relationships: [];
      };
      attempts: {
        Row: {
          created_at: string;
          id: string;
          is_correct: boolean;
          question_id: string;
          selected: NonNullable<Json>;
          session_id: string | null;
          time_ms: number | null;
          user_id: string;
          why_wrong: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_correct: boolean;
          question_id: string;
          selected?: NonNullable<Json>;
          session_id?: string | null;
          time_ms?: number | null;
          user_id?: string;
          why_wrong?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_correct?: boolean;
          question_id?: string;
          selected?: NonNullable<Json>;
          session_id?: string | null;
          time_ms?: number | null;
          user_id?: string;
          why_wrong?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attempts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "study_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      debt_payments: {
        Row: {
          amount: number;
          date: string;
          debt_id: string;
          id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          date?: string;
          debt_id: string;
          id?: string;
          user_id?: string;
        };
        Update: {
          amount?: number;
          date?: string;
          debt_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey";
            columns: ["debt_id"];
            isOneToOne: false;
            referencedRelation: "debts";
            referencedColumns: ["id"];
          },
        ];
      };
      debts: {
        Row: {
          created_at: string;
          creditor: string | null;
          due_day: number | null;
          id: string;
          interest_rate_month: number;
          min_payment: number;
          name: string;
          original_amount: number;
          paid_off_at: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          creditor?: string | null;
          due_day?: number | null;
          id?: string;
          interest_rate_month?: number;
          min_payment?: number;
          name: string;
          original_amount?: number;
          paid_off_at?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          creditor?: string | null;
          due_day?: number | null;
          id?: string;
          interest_rate_month?: number;
          min_payment?: number;
          name?: string;
          original_amount?: number;
          paid_off_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      decks: {
        Row: {
          created_at: string;
          description: string | null;
          external_id: string | null;
          id: string;
          name: string;
          subject_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          external_id?: string | null;
          id?: string;
          name: string;
          subject_id?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          external_id?: string | null;
          id?: string;
          name?: string;
          subject_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decks_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      english_activity: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          kind: Database["public"]["Enums"]["english_activity_kind"];
          minutes: number;
          note: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          date?: string;
          id?: string;
          kind: Database["public"]["Enums"]["english_activity_kind"];
          minutes: number;
          note?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["english_activity_kind"];
          minutes?: number;
          note?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      english_courses: {
        Row: {
          created_at: string;
          external_ref: string | null;
          id: string;
          level: string | null;
          platform: Database["public"]["Enums"]["english_platform"];
          synced_at: string | null;
          title: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          external_ref?: string | null;
          id?: string;
          level?: string | null;
          platform: Database["public"]["Enums"]["english_platform"];
          synced_at?: string | null;
          title: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          external_ref?: string | null;
          id?: string;
          level?: string | null;
          platform?: Database["public"]["Enums"]["english_platform"];
          synced_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      english_units: {
        Row: {
          completed_at: string | null;
          course_id: string;
          external_ref: string | null;
          id: string;
          position: number;
          score: number | null;
          status: string;
          title: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string | null;
          course_id: string;
          external_ref?: string | null;
          id?: string;
          position?: number;
          score?: number | null;
          status?: string;
          title: string;
          user_id?: string;
        };
        Update: {
          completed_at?: string | null;
          course_id?: string;
          external_ref?: string | null;
          id?: string;
          position?: number;
          score?: number | null;
          status?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "english_units_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "english_courses";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_presets: {
        Row: {
          created_at: string;
          duration_min: number;
          external_id: string | null;
          id: string;
          name: string;
          official_url: string | null;
          pass_pct: number;
          question_count: number;
          ready_pct: number;
          subject_id: string | null;
          tag: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          duration_min: number;
          external_id?: string | null;
          id?: string;
          name: string;
          official_url?: string | null;
          pass_pct: number;
          question_count: number;
          ready_pct?: number;
          subject_id?: string | null;
          tag?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          duration_min?: number;
          external_id?: string | null;
          id?: string;
          name?: string;
          official_url?: string | null;
          pass_pct?: number;
          question_count?: number;
          ready_pct?: number;
          subject_id?: string | null;
          tag?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_presets_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      flashcards: {
        Row: {
          back: string;
          created_at: string;
          deck_id: string;
          difficulty: number;
          due: string;
          elapsed_days: number;
          external_id: string | null;
          front: string;
          id: string;
          lapses: number;
          last_review: string | null;
          learning_steps: number;
          question_id: string | null;
          reps: number;
          scheduled_days: number;
          source: Database["public"]["Enums"]["card_source"];
          stability: number;
          state: number;
          suspended: boolean;
          tags: string[];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          back: string;
          created_at?: string;
          deck_id: string;
          difficulty?: number;
          due?: string;
          elapsed_days?: number;
          external_id?: string | null;
          front: string;
          id?: string;
          lapses?: number;
          last_review?: string | null;
          learning_steps?: number;
          question_id?: string | null;
          reps?: number;
          scheduled_days?: number;
          source?: Database["public"]["Enums"]["card_source"];
          stability?: number;
          state?: number;
          suspended?: boolean;
          tags?: string[];
          user_id?: string;
        };
        Update: {
          back?: string;
          created_at?: string;
          deck_id?: string;
          difficulty?: number;
          due?: string;
          elapsed_days?: number;
          external_id?: string | null;
          front?: string;
          id?: string;
          lapses?: number;
          last_review?: string | null;
          learning_steps?: number;
          question_id?: string | null;
          reps?: number;
          scheduled_days?: number;
          source?: Database["public"]["Enums"]["card_source"];
          stability?: number;
          state?: number;
          suspended?: boolean;
          tags?: string[];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "decks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flashcards_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      fund_entries: {
        Row: {
          amount: number;
          date: string;
          fund_id: string;
          id: string;
          note: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          date?: string;
          fund_id: string;
          id?: string;
          note?: string | null;
          user_id?: string;
        };
        Update: {
          amount?: number;
          date?: string;
          fund_id?: string;
          id?: string;
          note?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fund_entries_fund_id_fkey";
            columns: ["fund_id"];
            isOneToOne: false;
            referencedRelation: "funds";
            referencedColumns: ["id"];
          },
        ];
      };
      funds: {
        Row: {
          created_at: string;
          currency: string;
          external_id: string | null;
          id: string;
          name: string;
          target_amount: number;
          target_date: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          currency?: string;
          external_id?: string | null;
          id?: string;
          name: string;
          target_amount?: number;
          target_date?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          external_id?: string | null;
          id?: string;
          name?: string;
          target_amount?: number;
          target_date?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          created_at: string;
          description: string | null;
          external_id: string | null;
          id: string;
          implementation_intention: string | null;
          position: number;
          status: Database["public"]["Enums"]["goal_status"];
          target_date: string | null;
          title: string;
          track_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          external_id?: string | null;
          id?: string;
          implementation_intention?: string | null;
          position?: number;
          status?: Database["public"]["Enums"]["goal_status"];
          target_date?: string | null;
          title: string;
          track_id?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          external_id?: string | null;
          id?: string;
          implementation_intention?: string | null;
          position?: number;
          status?: Database["public"]["Enums"]["goal_status"];
          target_date?: string | null;
          title?: string;
          track_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goals_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      habit_logs: {
        Row: {
          date: string;
          habit_id: string;
          id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          date: string;
          habit_id: string;
          id?: string;
          user_id?: string;
        };
        Update: {
          date?: string;
          habit_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey";
            columns: ["habit_id"];
            isOneToOne: false;
            referencedRelation: "habits";
            referencedColumns: ["id"];
          },
        ];
      };
      habits: {
        Row: {
          archived: boolean;
          color: string | null;
          created_at: string;
          cue: string | null;
          external_id: string | null;
          id: string;
          name: string;
          position: number;
          target_per_week: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          archived?: boolean;
          color?: string | null;
          created_at?: string;
          cue?: string | null;
          external_id?: string | null;
          id?: string;
          name: string;
          position?: number;
          target_per_week?: number;
          user_id?: string;
        };
        Update: {
          archived?: boolean;
          color?: string | null;
          created_at?: string;
          cue?: string | null;
          external_id?: string | null;
          id?: string;
          name?: string;
          position?: number;
          target_per_week?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      key_results: {
        Row: {
          current_value: number;
          external_id: string | null;
          goal_id: string;
          id: string;
          position: number;
          target_value: number;
          title: string;
          unit: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          current_value?: number;
          external_id?: string | null;
          goal_id: string;
          id?: string;
          position?: number;
          target_value?: number;
          title: string;
          unit?: string | null;
          user_id?: string;
        };
        Update: {
          current_value?: number;
          external_id?: string | null;
          goal_id?: string;
          id?: string;
          position?: number;
          target_value?: number;
          title?: string;
          unit?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "key_results_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
      milestones: {
        Row: {
          created_at: string;
          done_at: string | null;
          due_date: string | null;
          external_id: string | null;
          goal_id: string | null;
          id: string;
          notes: string | null;
          title: string;
          track_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          done_at?: string | null;
          due_date?: string | null;
          external_id?: string | null;
          goal_id?: string | null;
          id?: string;
          notes?: string | null;
          title: string;
          track_id?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          done_at?: string | null;
          due_date?: string | null;
          external_id?: string | null;
          goal_id?: string | null;
          id?: string;
          notes?: string | null;
          title?: string;
          track_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "milestones_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "milestones_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      planned_costs: {
        Row: {
          amount: number;
          category: string | null;
          created_at: string;
          currency: string;
          due_date: string | null;
          external_id: string | null;
          id: string;
          name: string;
          notes: string | null;
          paid_at: string | null;
          track_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          category?: string | null;
          created_at?: string;
          currency?: string;
          due_date?: string | null;
          external_id?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          paid_at?: string | null;
          track_id?: string | null;
          user_id?: string;
        };
        Update: {
          amount?: number;
          category?: string | null;
          created_at?: string;
          currency?: string;
          due_date?: string | null;
          external_id?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          paid_at?: string | null;
          track_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "planned_costs_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      pomodoro_sessions: {
        Row: {
          duration_min: number;
          id: string;
          label: string | null;
          started_at: string;
          subject_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          duration_min: number;
          id?: string;
          label?: string | null;
          started_at?: string;
          subject_id?: string | null;
          user_id?: string;
        };
        Update: {
          duration_min?: number;
          id?: string;
          label?: string | null;
          started_at?: string;
          subject_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          content_version: number;
          created_at: string;
          daily_new_cards: number;
          display_name: string | null;
          eur_brl: number;
          id: string;
          target_cefr: string;
          target_cefr_date: string | null;
          usd_brl: number;
        };
        ComputedFields: never;
        Insert: {
          content_version?: number;
          created_at?: string;
          daily_new_cards?: number;
          display_name?: string | null;
          eur_brl?: number;
          id: string;
          target_cefr?: string;
          target_cefr_date?: string | null;
          usd_brl?: number;
        };
        Update: {
          content_version?: number;
          created_at?: string;
          daily_new_cards?: number;
          display_name?: string | null;
          eur_brl?: number;
          id?: string;
          target_cefr?: string;
          target_cefr_date?: string | null;
          usd_brl?: number;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          board: string | null;
          correct: NonNullable<Json>;
          created_at: string;
          difficulty: number | null;
          explanation: string | null;
          external_id: string | null;
          id: string;
          options: NonNullable<Json>;
          source: string | null;
          source_url: string | null;
          stem: string;
          subject_id: string | null;
          tags: string[];
          type: Database["public"]["Enums"]["question_type"];
          user_id: string;
          year: number | null;
        };
        ComputedFields: never;
        Insert: {
          board?: string | null;
          correct?: NonNullable<Json>;
          created_at?: string;
          difficulty?: number | null;
          explanation?: string | null;
          external_id?: string | null;
          id?: string;
          options?: NonNullable<Json>;
          source?: string | null;
          source_url?: string | null;
          stem: string;
          subject_id?: string | null;
          tags?: string[];
          type?: Database["public"]["Enums"]["question_type"];
          user_id?: string;
          year?: number | null;
        };
        Update: {
          board?: string | null;
          correct?: NonNullable<Json>;
          created_at?: string;
          difficulty?: number | null;
          explanation?: string | null;
          external_id?: string | null;
          id?: string;
          options?: NonNullable<Json>;
          source?: string | null;
          source_url?: string | null;
          stem?: string;
          subject_id?: string | null;
          tags?: string[];
          type?: Database["public"]["Enums"]["question_type"];
          user_id?: string;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      review_logs: {
        Row: {
          card_id: string;
          difficulty: number;
          due: string;
          elapsed_days: number;
          id: string;
          last_elapsed_days: number;
          learning_steps: number;
          rating: number;
          review: string;
          scheduled_days: number;
          stability: number;
          state: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          card_id: string;
          difficulty: number;
          due: string;
          elapsed_days: number;
          id?: string;
          last_elapsed_days: number;
          learning_steps: number;
          rating: number;
          review?: string;
          scheduled_days: number;
          stability: number;
          state: number;
          user_id?: string;
        };
        Update: {
          card_id?: string;
          difficulty?: number;
          due?: string;
          elapsed_days?: number;
          id?: string;
          last_elapsed_days?: number;
          learning_steps?: number;
          rating?: number;
          review?: string;
          scheduled_days?: number;
          stability?: number;
          state?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_logs_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "flashcards";
            referencedColumns: ["id"];
          },
        ];
      };
      roadmap_nodes: {
        Row: {
          app_href: string | null;
          created_at: string;
          description: string | null;
          external_id: string;
          id: string;
          kind: Database["public"]["Enums"]["roadmap_node_kind"];
          link_ref: string | null;
          link_type: Database["public"]["Enums"]["roadmap_link"];
          notes: string | null;
          parent_external_id: string | null;
          position: number;
          requires: string[];
          resources: NonNullable<Json>;
          roadmap: string;
          side: string | null;
          status: Database["public"]["Enums"]["roadmap_status"] | null;
          title: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          app_href?: string | null;
          created_at?: string;
          description?: string | null;
          external_id: string;
          id?: string;
          kind?: Database["public"]["Enums"]["roadmap_node_kind"];
          link_ref?: string | null;
          link_type?: Database["public"]["Enums"]["roadmap_link"];
          notes?: string | null;
          parent_external_id?: string | null;
          position?: number;
          requires?: string[];
          resources?: NonNullable<Json>;
          roadmap: string;
          side?: string | null;
          status?: Database["public"]["Enums"]["roadmap_status"] | null;
          title: string;
          user_id?: string;
        };
        Update: {
          app_href?: string | null;
          created_at?: string;
          description?: string | null;
          external_id?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["roadmap_node_kind"];
          link_ref?: string | null;
          link_type?: Database["public"]["Enums"]["roadmap_link"];
          notes?: string | null;
          parent_external_id?: string | null;
          position?: number;
          requires?: string[];
          resources?: NonNullable<Json>;
          roadmap?: string;
          side?: string | null;
          status?: Database["public"]["Enums"]["roadmap_status"] | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: {
          correct_count: number | null;
          duration_min: number | null;
          finished_at: string | null;
          id: string;
          mode: Database["public"]["Enums"]["session_mode"];
          pass_pct: number | null;
          preset_id: string | null;
          question_ids: string[];
          score_pct: number | null;
          started_at: string;
          subject_ids: string[];
          total: number | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          correct_count?: number | null;
          duration_min?: number | null;
          finished_at?: string | null;
          id?: string;
          mode?: Database["public"]["Enums"]["session_mode"];
          pass_pct?: number | null;
          preset_id?: string | null;
          question_ids?: string[];
          score_pct?: number | null;
          started_at?: string;
          subject_ids?: string[];
          total?: number | null;
          user_id?: string;
        };
        Update: {
          correct_count?: number | null;
          duration_min?: number | null;
          finished_at?: string | null;
          id?: string;
          mode?: Database["public"]["Enums"]["session_mode"];
          pass_pct?: number | null;
          preset_id?: string | null;
          question_ids?: string[];
          score_pct?: number | null;
          started_at?: string;
          subject_ids?: string[];
          total?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_sessions_preset_id_fkey";
            columns: ["preset_id"];
            isOneToOne: false;
            referencedRelation: "exam_presets";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          created_at: string;
          description: string | null;
          external_id: string | null;
          id: string;
          kind: Database["public"]["Enums"]["subject_kind"];
          name: string;
          parent_id: string | null;
          position: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          external_id?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["subject_kind"];
          name: string;
          parent_id?: string | null;
          position?: number;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          external_id?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["subject_kind"];
          name?: string;
          parent_id?: string | null;
          position?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subjects_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      targets: {
        Row: {
          compatibility: number | null;
          created_at: string;
          currency: string;
          difficulty: number | null;
          exam_date: string | null;
          external_id: string | null;
          id: string;
          kind: Database["public"]["Enums"]["target_kind"];
          location: string | null;
          location_score: number | null;
          name: string;
          notes: string | null;
          salary_score: number | null;
          salary_text: string | null;
          salary_value: number | null;
          status: string;
          track_id: string | null;
          url: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          compatibility?: number | null;
          created_at?: string;
          currency?: string;
          difficulty?: number | null;
          exam_date?: string | null;
          external_id?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["target_kind"];
          location?: string | null;
          location_score?: number | null;
          name: string;
          notes?: string | null;
          salary_score?: number | null;
          salary_text?: string | null;
          salary_value?: number | null;
          status?: string;
          track_id?: string | null;
          url?: string | null;
          user_id?: string;
        };
        Update: {
          compatibility?: number | null;
          created_at?: string;
          currency?: string;
          difficulty?: number | null;
          exam_date?: string | null;
          external_id?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["target_kind"];
          location?: string | null;
          location_score?: number | null;
          name?: string;
          notes?: string | null;
          salary_score?: number | null;
          salary_text?: string | null;
          salary_value?: number | null;
          status?: string;
          track_id?: string | null;
          url?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "targets_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          completed_at: string | null;
          created_at: string;
          description: string | null;
          due_date: string | null;
          external_id: string | null;
          goal_id: string | null;
          id: string;
          position: number;
          priority: number;
          status: Database["public"]["Enums"]["task_status"];
          title: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          external_id?: string | null;
          goal_id?: string | null;
          id?: string;
          position?: number;
          priority?: number;
          status?: Database["public"]["Enums"]["task_status"];
          title: string;
          user_id?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          external_id?: string | null;
          goal_id?: string | null;
          id?: string;
          position?: number;
          priority?: number;
          status?: Database["public"]["Enums"]["task_status"];
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
      tracks: {
        Row: {
          color: string | null;
          created_at: string;
          description: string | null;
          external_id: string | null;
          icon: string | null;
          id: string;
          name: string;
          position: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          external_id?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          position?: number;
          user_id?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          external_id?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          position?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      weekly_reviews: {
        Row: {
          blockers: string | null;
          created_at: string;
          energy: number | null;
          id: string;
          lessons: string | null;
          next_focus: string | null;
          user_id: string;
          week_start: string;
          wins: string | null;
        };
        ComputedFields: never;
        Insert: {
          blockers?: string | null;
          created_at?: string;
          energy?: number | null;
          id?: string;
          lessons?: string | null;
          next_focus?: string | null;
          user_id?: string;
          week_start: string;
          wins?: string | null;
        };
        Update: {
          blockers?: string | null;
          created_at?: string;
          energy?: number | null;
          id?: string;
          lessons?: string | null;
          next_focus?: string | null;
          user_id?: string;
          week_start?: string;
          wins?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      question_mastery: {
        Row: {
          attempts: number | null;
          correct_days: number | null;
          last_correct: boolean | null;
          question_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "attempts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      subject_stats: {
        Row: {
          accuracy_pct: number | null;
          attempts: number | null;
          avg_seconds: number | null;
          correct: number | null;
          correct_days: number | null;
          last_attempt_at: string | null;
          subject_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      application_status:
        | "wishlist"
        | "applied"
        | "screening"
        | "interview"
        | "offer"
        | "rejected"
        | "withdrawn";
      card_source: "manual" | "question" | "vocab" | "phrase";
      english_activity_kind:
        | "lesson"
        | "class"
        | "listening"
        | "speaking"
        | "reading"
        | "writing"
        | "vocab";
      english_platform: "times_digital_books" | "times_connected" | "other";
      goal_status: "active" | "done" | "paused" | "dropped";
      question_type: "single" | "multi" | "truefalse";
      roadmap_link:
        | "subject"
        | "goal"
        | "key_result"
        | "milestone"
        | "english_unit"
        | "fund"
        | "none";
      roadmap_node_kind: "goal" | "stage" | "topic";
      roadmap_status: "todo" | "doing" | "done" | "skipped";
      session_mode: "practice" | "mock" | "review";
      subject_kind: "exam" | "discipline" | "topic";
      target_kind: "concurso" | "country" | "company" | "certification";
      task_status: "backlog" | "todo" | "doing" | "done";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      application_status: [
        "wishlist",
        "applied",
        "screening",
        "interview",
        "offer",
        "rejected",
        "withdrawn",
      ],
      card_source: ["manual", "question", "vocab", "phrase"],
      english_activity_kind: [
        "lesson",
        "class",
        "listening",
        "speaking",
        "reading",
        "writing",
        "vocab",
      ],
      english_platform: ["times_digital_books", "times_connected", "other"],
      goal_status: ["active", "done", "paused", "dropped"],
      question_type: ["single", "multi", "truefalse"],
      roadmap_link: [
        "subject",
        "goal",
        "key_result",
        "milestone",
        "english_unit",
        "fund",
        "none",
      ],
      roadmap_node_kind: ["goal", "stage", "topic"],
      roadmap_status: ["todo", "doing", "done", "skipped"],
      session_mode: ["practice", "mock", "review"],
      subject_kind: ["exam", "discipline", "topic"],
      target_kind: ["concurso", "country", "company", "certification"],
      task_status: ["backlog", "todo", "doing", "done"],
    },
  },
} as const;
