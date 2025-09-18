-- Create questionnaire topics table
CREATE TABLE IF NOT EXISTS questionnaire_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  estimated_time INTEGER, -- in minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questionnaire questions table
CREATE TABLE IF NOT EXISTS questionnaire_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES questionnaire_topics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'scale', 'text', 'boolean')),
  options JSONB, -- for multiple choice options
  scale_min INTEGER, -- for scale questions
  scale_max INTEGER, -- for scale questions
  scale_labels JSONB, -- labels for scale endpoints
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user responses table
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES questionnaire_topics(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questionnaire_questions(id) ON DELETE CASCADE,
  response_value TEXT,
  response_data JSONB, -- for complex responses
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create psychological explanations table
CREATE TABLE IF NOT EXISTS psychological_explanations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES questionnaire_topics(id) ON DELETE CASCADE,
  explanation_title TEXT NOT NULL,
  explanation_content TEXT NOT NULL,
  psychological_concepts TEXT[],
  related_theories TEXT[],
  practical_applications TEXT[],
  further_reading JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user questionnaire sessions table
CREATE TABLE IF NOT EXISTS questionnaire_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES questionnaire_topics(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_questions INTEGER,
  answered_questions INTEGER DEFAULT 0,
  session_data JSONB,
  ai_analysis TEXT,
  personalized_insights TEXT[]
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questionnaire_topics_category ON questionnaire_topics(category);
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_topic_id ON questionnaire_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_user_id ON questionnaire_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_topic_id ON questionnaire_responses(topic_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_sessions_user_id ON questionnaire_sessions(user_id);

-- Enable Row Level Security
ALTER TABLE questionnaire_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Topics are viewable by everyone" ON questionnaire_topics
  FOR SELECT USING (is_active = true);

CREATE POLICY "Questions are viewable by everyone" ON questionnaire_questions
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own responses" ON questionnaire_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses" ON questionnaire_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Explanations are viewable by everyone" ON psychological_explanations
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own sessions" ON questionnaire_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON questionnaire_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON questionnaire_sessions
  FOR UPDATE USING (auth.uid() = user_id);
