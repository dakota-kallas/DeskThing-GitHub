import './issues.css';
import { GitHubIssue } from '../../stores/gitHubStore';
import { IoMdArrowRoundBack, IoMdArrowRoundUp } from 'react-icons/io';
import { CheckIcon, GitPullRequestIcon } from '@primer/octicons-react';
import { useEffect, useRef, useState } from 'react';
import { GitHubStore } from '../../stores';
import Issue from '../Issue/Issue';

interface IssuesProps {
  issues: GitHubIssue[];
  onBackClick: () => void;
}

const Issues = ({ issues, onBackClick }: IssuesProps) => {
  const gitHubStore = GitHubStore;
  const [filter, setFilter] = useState<'open' | 'closed'>('open');
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const openIssues = issues.filter(
    (issue) =>
      issue.state === 'open' || issue.draft || issue.stateReason === 'reopened'
  );

  const otherIssues = issues.filter(
    (issue) =>
      issue.state !== 'open' && !issue.draft && issue.stateReason !== 'reopened'
  );

  const issuesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = (event: WheelEvent) => {
      if (event.deltaX !== 0 && issuesRef.current) {
        event.preventDefault();
        issuesRef.current.scrollBy({
          top: event.deltaX,
          behavior: 'smooth',
        });
      }
    };

    const issuesContainer = issuesRef.current;
    issuesContainer?.addEventListener('wheel', handleScroll, {
      passive: false,
    });

    return () => {
      issuesContainer?.removeEventListener('wheel', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (
      issuesRef.current &&
      issuesRef.current.scrollHeight > issuesRef.current.clientHeight
    ) {
      setShowBackToTop(true);
      return;
    }
    setShowBackToTop(false);
  }, [filter]);

  function handleBackToTopClick() {
    issuesRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleOpenClick(url: string) {
    gitHubStore.openURL(url);
  }

  return (
    <div className='issues--container'>
      <div className='issues--controls'>
        <button onClick={onBackClick} className='issues--back'>
          <IoMdArrowRoundBack size={20} />
          <p>Back</p>
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`issues--filter ${
            filter === 'open' ? 'issues--activeFilter' : ''
          }`}
        >
          <GitPullRequestIcon size={20} />
          <p>{openIssues.length} Open</p>
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`issues--filter ${
            filter === 'closed' ? 'issues--activeFilter' : ''
          }`}
        >
          <CheckIcon size={20} />
          <p>{otherIssues.length} Closed</p>
        </button>
      </div>
      <div className='issues' ref={issuesRef}>
        {filter === 'open' &&
          openIssues.map((issue, index) => (
            <Issue issue={issue} key={index} onOpenClick={handleOpenClick} />
          ))}
        {filter === 'closed' &&
          otherIssues.map((issue, index) => (
            <Issue issue={issue} key={index} onOpenClick={handleOpenClick} />
          ))}
        {showBackToTop && (
          <div className='issues--backToTop'>
            <button onClick={handleBackToTopClick}>
              <IoMdArrowRoundUp size={20} />
              <p>Back to Top</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Issues;
