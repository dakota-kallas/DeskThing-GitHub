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

interface RepoProps {
  repo: GitHubRepo;
  onPullRequestsClick: () => void;
  onIssuesClick: () => void;
}

const Repo = ({ repo, onPullRequestsClick, onIssuesClick }: RepoProps) => {
  return (
    <div className='repo'>
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
