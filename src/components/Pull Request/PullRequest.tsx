import './pullrequest.css';
import { GitHubPullRequest } from '../../stores/gitHubStore';
import {
  GitMergeIcon,
  GitPullRequestClosedIcon,
  GitPullRequestDraftIcon,
  GitPullRequestIcon,
} from '@primer/octicons-react';
import { RxOpenInNewWindow } from 'react-icons/rx';

interface PullRequestProps {
  pullRequest: GitHubPullRequest;
  onOpenClick: (url: string) => void;
}

const PullRequest = ({ pullRequest, onOpenClick }: PullRequestProps) => {
  const createdDate = new Date(pullRequest.createdAt).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }
  );

  return (
    <div className='pull'>
      <div className='pull--content'>
        <div className='pull--details'>
          {getIcon()}
          <h2>{pullRequest.title}</h2>
          <div className='pull--labels'>
            {pullRequest.labels?.map((label) => (
              <p
                className='pull--label'
                key={label.id}
                style={{
                  color: `#${label.color}`,
                  borderColor: `#${label.color}`,
                  backgroundColor: `#${label.color}2A`,
                }}
              >
                {label.name}
              </p>
            ))}
          </div>
        </div>
        <div className='pull-subDetails'>
          <p>#{pullRequest.number}</p>
          <p>created on {createdDate}</p>
          {pullRequest.user && <p>by {pullRequest.user?.username}</p>}
        </div>
      </div>
      <button
        className='pull--open'
        onClick={() => {
          onOpenClick(pullRequest.url);
        }}
      >
        <RxOpenInNewWindow size={32} />
      </button>
    </div>
  );

  function getIcon() {
    if (pullRequest.draft) {
      return <GitPullRequestDraftIcon size={30} className='pull--icon' />;
    } else if (pullRequest.mergedAt !== null) {
      return <GitMergeIcon size={30} className='pull--mergedIcon' />;
    } else if (pullRequest.state === 'open') {
      return <GitPullRequestIcon size={30} className='pull--openIcon' />;
    } else if (pullRequest.state === 'closed') {
      return (
        <GitPullRequestClosedIcon size={30} className='pull--closedIcon' />
      );
    } else {
      return <GitPullRequestIcon size={30} className='pull--icon' />;
    }
  }
};

export default PullRequest;
