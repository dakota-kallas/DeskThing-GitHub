import './pullrequests.css';
import { GitHubPullRequest } from '../../stores/gitHubStore';
import PullRequest from '../Pull Request/PullRequest';
import { IoMdArrowRoundBack, IoMdArrowRoundUp } from 'react-icons/io';
import { CheckIcon, GitPullRequestIcon } from '@primer/octicons-react';
import { useEffect, useRef, useState } from 'react';
import { GitHubStore } from '../../stores';

interface PullRequestsProps {
  pullRequests: GitHubPullRequest[];
  onBackClick: () => void;
}

const PullRequests = ({ pullRequests, onBackClick }: PullRequestsProps) => {
  const gitHubStore = GitHubStore;
  const [filter, setFilter] = useState<'open' | 'closed'>('open');
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const openPullRequests = pullRequests.filter(
    (pullRequest) => pullRequest.state === 'open' || pullRequest.draft
  );

  const otherPullRequests = pullRequests.filter(
    (pullRequest) => pullRequest.state !== 'open' && !pullRequest.draft
  );

  const pullsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = (event: WheelEvent) => {
      if (event.deltaX !== 0 && pullsRef.current) {
        event.preventDefault();
        pullsRef.current.scrollBy({
          top: event.deltaX,
          behavior: 'smooth',
        });
      }
    };

    const pullsContainer = pullsRef.current;
    pullsContainer?.addEventListener('wheel', handleScroll, { passive: false });

    return () => {
      pullsContainer?.removeEventListener('wheel', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (
      pullsRef.current &&
      pullsRef.current.scrollHeight > pullsRef.current.clientHeight
    ) {
      setShowBackToTop(true);
      return;
    }
    setShowBackToTop(false);
  }, [filter]);

  function handleBackToTopClick() {
    pullsRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleOpenClick(url: string) {
    gitHubStore.openURL(url);
  }

  return (
    <div className='pulls--container'>
      <div className='pulls--controls'>
        <button onClick={onBackClick} className='pulls--back'>
          <IoMdArrowRoundBack size={20} />
          <p>Back</p>
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`pulls--filter ${
            filter === 'open' ? 'pulls--activeFilter' : ''
          }`}
        >
          <GitPullRequestIcon size={20} />
          <p>{openPullRequests.length} Open</p>
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`pulls--filter ${
            filter === 'closed' ? 'pulls--activeFilter' : ''
          }`}
        >
          <CheckIcon size={20} />
          <p>{otherPullRequests.length} Closed</p>
        </button>
      </div>
      <div className='pulls' ref={pullsRef}>
        {filter === 'open' &&
          openPullRequests.map((pullRequest, index) => (
            <PullRequest
              pullRequest={pullRequest}
              key={index}
              onOpenClick={handleOpenClick}
            />
          ))}
        {filter === 'closed' &&
          otherPullRequests.map((pullRequest, index) => (
            <PullRequest
              pullRequest={pullRequest}
              key={index}
              onOpenClick={handleOpenClick}
            />
          ))}
        {showBackToTop && (
          <div className='pulls--backToTop'>
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

export default PullRequests;
