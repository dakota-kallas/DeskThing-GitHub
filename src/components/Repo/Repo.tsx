import './repo.css';
import { GitHubRepo } from '../../stores/gitHubStore';
import { useEffect, useRef, useState } from 'react';
import {
  EyeIcon,
  GitPullRequestIcon,
  IssueOpenedIcon,
  RepoForkedIcon,
  RepoIcon,
  StarIcon,
} from '@primer/octicons-react';

interface RepoProps {
  repo: GitHubRepo;
  onPullRequestsClick: () => void;
}

const Repo = ({ repo, onPullRequestsClick }: RepoProps) => {
  const [isTallEnough, setIsTallEnough] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = contentContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === container) {
          setIsTallEnough(entry.contentRect.height > 400);
        }
      }
    });

    resizeObserver.observe(container);

    // Cleanup observer on component unmount
    return () => {
      resizeObserver.unobserve(container);
      resizeObserver.disconnect();
    };
  }, [contentContainerRef.current]);

  return (
    <div className='repo' ref={contentContainerRef}>
      <div className='repo--header'>
        <RepoIcon size={30} className='repo--repoIcon' />
        <h2 className='repo--name'>{repo.name}</h2>
        <p className='repo--visibility'>{repo.visibility}</p>
      </div>
      <div className='repo--owner'>
        <img
          src={repo.owner.avatarUrl}
          alt='Owner Avatar'
          className='repo--avatar'
        />
        <h3>{repo.owner.username}</h3>
      </div>
      <div>
        <p className='repo--description'>{repo.description}</p>
      </div>
      <div className='repo--actions'>
        <button>
          <IssueOpenedIcon size={14} className='repo--icon' />
          View Issues
        </button>
        <button onClick={onPullRequestsClick}>
          <GitPullRequestIcon size={14} className='repo--icon' />
          View Pull Requests
        </button>
      </div>
      <div className='repo--counts'>
        <span className='repo--count'>
          <StarIcon size={20} className='repo--icon' />
          <p>{repo.stars}</p>
        </span>
        <span className='repo--count'>
          <EyeIcon size={20} className='repo--icon' />
          <p>{repo.watchers}</p>
        </span>
        <span className='repo--count'>
          <RepoForkedIcon size={20} className='repo--icon' />
          <p>{repo.forks}</p>
        </span>
        <span className='repo--count'>
          <IssueOpenedIcon size={20} className='repo--icon' />
          <p>{repo.openIssues}</p>
        </span>
      </div>
    </div>
  );
};

export default Repo;
