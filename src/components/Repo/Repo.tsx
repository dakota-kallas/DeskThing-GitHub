import './repo.css';
import { GitHubRepo } from '../../stores/gitHubStore';
import {
  EyeIcon,
  GitPullRequestIcon,
  IssueOpenedIcon,
  RepoForkedIcon,
  RepoIcon,
  StarIcon,
} from '@primer/octicons-react';
import { useEffect, useState } from 'react'
import { DeskThing } from '@deskthing/client'

interface RepoProps {
  repo: GitHubRepo;
  onPullRequestsClick: () => void;
  onIssuesClick: () => void;
  onRepoClick: () => void;
}

const Repo = ({
  repo,
  onPullRequestsClick,
  onIssuesClick,
  onRepoClick,
}: RepoProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!repo.owner.avatarUrl) return;
    const url = DeskThing.useProxy(repo.owner.avatarUrl);
    setAvatarUrl(`${url}${repo.owner.avatarUrl}`);
  }, [repo.owner.avatarUrl]);

  return (
    <div className='repo'>
      <div className='repo--header'>
        <RepoIcon size={30} className='repo--repoIcon' />
        <button onClick={onRepoClick}>
          <h2 className='repo--name'>{repo.name}</h2>
        </button>
        <p className='repo--visibility'>{repo.visibility}</p>
      </div>
      <div className='repo--owner'>
        <img
          src={avatarUrl}
          alt='Owner Avatar'
          className='repo--avatar'
        />
        <h3>{repo.owner.username}</h3>
      </div>
      <div>
        <p className='repo--description'>{repo.description}</p>
      </div>
      <div className='repo--actions'>
        <button onClick={onIssuesClick}>
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
