import { useState } from 'react';

function App() {
  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});

  const generateQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://study-assistant-backend-d4nv.onrender.com/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      const data = await res.json();

      if (!res.ok || !data.questions) {
        alert('Server error: ' + (data.details || data.error || 'Unknown error, try again.'));
        setLoading(false);
        return;
      }

      setQuestions(data.questions.map((q, i) => ({ ...q, id: data.questionIds[i] })));
      setAnswers({});
      setFeedback({});
    } catch (err) {
      alert('Network error: ' + err.message);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('https://study-assistant-backend-d4nv.onrender.com/extract-text', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        alert('Error: ' + (data.error || 'Failed to extract text'));
        setUploading(false);
        return;
      }

      setNotes(data.text);
    } catch (err) {
      alert('Upload error: ' + err.message);
    }
    setUploading(false);
  };

  const submitAnswer = async (questionId, index) => {
    const studentAnswer = answers[index];
    if (!studentAnswer) return;

    try {
      const res = await fetch('https://study-assistant-backend-d4nv.onrender.com/grade-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, studentAnswer })
      });
      const data = await res.json();
      setFeedback(prev => ({ ...prev, [index]: data }));
    } catch (err) {
      alert('Error grading answer: ' + err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#dbeafe',
      paddingTop: '1px'
    }}>
      <div style={{
        maxWidth: '700px',
        margin: '40px auto',
        fontFamily: "'Segoe UI', sans-serif",
        padding: '0 20px',
        color: '#1a1a1a'
      }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>📚 Study Assistant</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>Paste your notes and test yourself instantly.</p>

        <textarea
          rows={6}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '15px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
          placeholder="Paste your notes here..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <div style={{ marginTop: '10px' }}>
          <label style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            {uploading ? 'Processing file...' : '📎 Upload PDF, Word, or Image'}
            <input
              type="file"
              accept=".pdf,.docx,image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <button
          onClick={generateQuestions}
          disabled={loading || !notes}
          style={{
            marginTop: '12px',
            padding: '10px 24px',
            fontSize: '15px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: loading || !notes ? '#aaa' : '#2563eb',
            color: 'white',
            cursor: loading || !notes ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating...' : 'Generate Quiz'}
        </button>

        {questions.map((q, i) => (
          <div key={i} style={{
            marginTop: '24px',
            padding: '18px',
            border: '1px solid #e2e2e2',
            borderRadius: '10px',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <p style={{ fontWeight: 600, marginBottom: '10px' }}>Q{i + 1}: {q.question}</p>
            <input
              type="text"
              placeholder="Your answer"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                boxSizing: 'border-box',
                fontSize: '14px'
              }}
              value={answers[i] || ''}
              onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
            />
            <button
              onClick={() => submitAnswer(q.id, i)}
              style={{
                marginTop: '10px',
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#111827',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Submit
            </button>

            {feedback[i] && (
              <p style={{
                marginTop: '12px',
                fontWeight: 500,
                color: feedback[i].correct ? '#16a34a' : '#dc2626'
              }}>
                {feedback[i].correct
                  ? '✅ Correct'
                  : `❌ Incorrect — correct answer: ${feedback[i].correctAnswer}`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;