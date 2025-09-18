-- Insert sample questionnaire topics
INSERT INTO questionnaire_topics (title, description, category, icon, color, difficulty_level, estimated_time) VALUES
('Personality Assessment', 'Discover your core personality traits and behavioral patterns', 'personality', 'User', '#8B5CF6', 2, 15),
('Stress & Anxiety Evaluation', 'Assess your stress levels and anxiety patterns', 'mental_health', 'Brain', '#EF4444', 3, 20),
('Cognitive Biases Test', 'Identify your thinking patterns and cognitive biases', 'cognition', 'Lightbulb', '#F59E0B', 4, 25),
('Emotional Intelligence', 'Evaluate your emotional awareness and regulation skills', 'emotional', 'Heart', '#10B981', 3, 18),
('Learning Style Assessment', 'Understand how you best process and retain information', 'learning', 'BookOpen', '#3B82F6', 2, 12),
('Decision Making Patterns', 'Analyze your decision-making processes and preferences', 'decision', 'Target', '#6366F1', 3, 22);

-- Insert sample questions for Personality Assessment
INSERT INTO questionnaire_questions (topic_id, question_text, question_type, options, order_index) VALUES
((SELECT id FROM questionnaire_topics WHERE title = 'Personality Assessment'), 
 'How do you typically recharge after a long day?', 
 'multiple_choice', 
 '["Spending time alone", "Being with friends or family", "Engaging in physical activity", "Pursuing a hobby"]', 
 1),
((SELECT id FROM questionnaire_topics WHERE title = 'Personality Assessment'), 
 'When making decisions, you tend to:', 
 'multiple_choice', 
 '["Rely on logic and facts", "Trust your intuition", "Seek advice from others", "Consider all possible outcomes"]', 
 2),
((SELECT id FROM questionnaire_topics WHERE title = 'Personality Assessment'), 
 'Rate your comfort level with public speaking', 
 'scale', 
 NULL, 
 3);

-- Update scale questions with proper scale values
UPDATE questionnaire_questions 
SET scale_min = 1, scale_max = 10, scale_labels = '{"1": "Very uncomfortable", "10": "Very comfortable"}'
WHERE question_type = 'scale';

-- Insert sample questions for Stress & Anxiety
INSERT INTO questionnaire_questions (topic_id, question_text, question_type, options, order_index) VALUES
((SELECT id FROM questionnaire_topics WHERE title = 'Stress & Anxiety Evaluation'), 
 'How often do you feel overwhelmed by daily tasks?', 
 'multiple_choice', 
 '["Never", "Rarely", "Sometimes", "Often", "Always"]', 
 1),
((SELECT id FROM questionnaire_topics WHERE title = 'Stress & Anxiety Evaluation'), 
 'Rate your current stress level', 
 'scale', 
 NULL, 
 2);

-- Update the stress scale question
UPDATE questionnaire_questions 
SET scale_min = 1, scale_max = 10, scale_labels = '{"1": "No stress", "10": "Extremely stressed"}'
WHERE topic_id = (SELECT id FROM questionnaire_topics WHERE title = 'Stress & Anxiety Evaluation') 
AND question_type = 'scale';

-- Insert psychological explanations
INSERT INTO psychological_explanations (topic_id, explanation_title, explanation_content, psychological_concepts, related_theories, practical_applications) VALUES
((SELECT id FROM questionnaire_topics WHERE title = 'Personality Assessment'),
 'Understanding Your Personality Type',
 'Personality psychology reveals that individual differences in behavior, thinking, and emotional patterns are relatively stable over time. Your responses indicate specific traits that influence how you interact with the world, process information, and make decisions. These patterns are shaped by both genetic predispositions and environmental experiences.',
 '{"Trait Theory", "Big Five Model", "Introversion-Extraversion", "Cognitive Styles"}',
 '{"Costa & McCrae Five-Factor Model", "Eysenck Personality Theory", "Jung Psychological Types"}',
 '{"Career planning", "Relationship building", "Communication improvement", "Stress management"}'),
((SELECT id FROM questionnaire_topics WHERE title = 'Stress & Anxiety Evaluation'),
 'The Psychology of Stress and Anxiety',
 'Stress and anxiety are natural psychological and physiological responses to perceived threats or challenges. While some stress can be motivating, chronic stress can impact mental health, cognitive function, and physical well-being. Understanding your stress patterns helps identify triggers and develop effective coping strategies.',
 '{"Fight-or-Flight Response", "Cognitive Appraisal Theory", "Stress Adaptation", "Anxiety Disorders"}',
 '{"Lazarus Transactional Model", "Yerkes-Dodson Law", "Beck Cognitive Theory"}',
 '{"Stress management techniques", "Mindfulness practices", "Cognitive restructuring", "Lifestyle modifications"}');
