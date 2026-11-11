import { Link } from 'react-router-dom';
import { PageHeader } from '../components/UI.jsx';

export function SkillsPlaceholder() {
  return (
    <>
      <PageHeader
        eyebrow="The skill board"
        title="Learn something. Share something."
        description="Find a skill to learn or offer one of your own."
      />
      <section className="empty-panel">
        <span className="empty-number">01</span>
        <div>
          <h2>The skill board is taking shape.</h2>
          <p>Discovery and listings are the next part of SkillSwap. Your account is ready; add a little context to your profile in the meantime.</p>
          <Link className="text-link" to="/profile">Visit your profile <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}

export function ExchangesPlaceholder() {
  return (
    <>
      <PageHeader
        eyebrow="Your exchanges"
        title="A good exchange starts with a yes."
        description="Keep track of requests, sessions, and the things you’ve learned together."
      />
      <section className="empty-panel">
        <span className="empty-number">02</span>
        <div>
          <h2>No exchanges to show yet.</h2>
          <p>When exchange requests are connected, your requests and their status will appear here.</p>
          <Link className="text-link" to="/skills">Explore skills <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}
