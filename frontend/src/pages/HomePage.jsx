import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { PageHeader } from '../components/UI.jsx';

export function HomePage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        eyebrow="Your learning space"
        title={`Good to have you here${user?.first_name ? `, ${user.first_name}` : ''}.`}
        description="Make room for a new skill, or pass along something you know."
      />
      <section className="welcome-panel">
        <div className="welcome-copy">
          <p className="eyebrow">A simple exchange</p>
          <h2>What could you teach someone this week?</h2>
          <p>Start by exploring what people are sharing. The best exchanges begin with a conversation about what you both want to learn.</p>
          <Link className="button button-primary" to="/skills">Explore the skill board <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-ring art-ring-one" />
          <div className="art-ring art-ring-two" />
          <span className="art-word art-word-one">share</span>
          <span className="art-word art-word-two">learn</span>
          <span className="art-spark">✳</span>
        </div>
      </section>
      <section className="home-bottom">
        <div>
          <p className="eyebrow">Start with yourself</p>
          <h2>A little context helps people find you.</h2>
          <p>Add a short bio, your location, and the skills you’d like to exchange.</p>
        </div>
        <Link className="text-link" to="/profile">Complete your profile <span aria-hidden="true">→</span></Link>
      </section>
    </>
  );
}
